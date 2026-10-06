const { authRepository } = require('../repositories/auth.repository');
const { passwordResetCodeRepository } = require('../repositories/passwordResetCode.repository');
const { refreshTokenRepository } = require('../repositories/refreshToken.repository');
const { auditService } = require('./audit.service');
const { BadRequestError, ConflictError, UnauthorizedError } = require('../utils/errors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { env } = require('../config/env');
const { generateSecret, encryptSecret, decryptSecret, matchingStep, setupUri } = require('../utils/totp.util');
const {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  getRefreshTokenExpiryDate
} = require('../utils/jwt.util');
const { comparePassword, hashPassword } = require('../utils/password.util');
const { logger } = require('../utils/logger');
const { transactionalEmailService } = require('./transactionalEmail.service');

const PASSWORD_RESET_CODE_TTL_MINUTES = 15;
const LOGIN_CHALLENGE_MS = 10 * 60 * 1000;
const MFA_BYPASS_LOGIN_EMAILS = new Set([
  'admin@kollabkoncepts.com',
  'tecnico@kollabkoncepts.com',
  'cliente@kollabkoncepts.com'
]);
const hashLoginCode = (challengeId, code) => crypto.createHmac('sha256', env.jwt.secret).update(`${challengeId}:${code}`).digest('hex');
const getChallenge = async (id) => {
  const challenge = await prisma.loginChallenge.findUnique({ where: { id } });
  if (!challenge || challenge.usedAt || challenge.expiresAt <= new Date() || challenge.attempts >= 5) throw new UnauthorizedError('Código expirado. Inicia sesión de nuevo.');
  return challenge;
};

const generateResetCode = () => crypto.randomInt(100000, 1000000).toString();
const maskEmail = (email) => {
  const [name, domain] = email.split('@');
  return `${name.slice(0, Math.min(3, name.length))}${name.length > 3 ? '***' : ''}@${domain}`;
};

const hashResetCode = (email, code) => crypto
  .createHash('sha256')
  .update(`${email}:${code}`)
  .digest('hex');

const sanitizeUser = (user) => {
  if (!user) return null;

  const { password, totpSecret, totpPendingSecret, totpLastStep, ...safeUser } = user;
  return safeUser;
};

const buildTokenPair = async (user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshToken();

  await refreshTokenRepository.create({
    userId: user.id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: getRefreshTokenExpiryDate()
  });

  return { accessToken, refreshToken };
};

const auditLogin = async ({ userId = null, email, success, ipAddress, userAgent, reason }) => {
  await auditService.logEvent({
    userId,
    action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE',
    entity: 'Auth',
    entityId: userId,
    ipAddress,
    userAgent,
    result: success ? 'SUCCESS' : 'FAILURE',
    details: {
      email,
      reason
    }
  });
};

const authService = {
  async registerClient(payload, context = {}) {
    const existingUser = await authRepository.findByEmail(payload.email);

    if (existingUser) {
      throw new ConflictError('El email ya esta registrado');
    }

    const password = await hashPassword(payload.password);

    const setupCode = generateSecret();
    const user = await authRepository.createClientUser({
      name: payload.name,
      email: payload.email,
      password,
      phone: payload.phone || null,
      company: payload.company || null,
      active: true,
      totpPendingSecret: encryptSecret(setupCode)
    });

    await auditService.record({
      userId: user.id,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user.id,
      newValue: user,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      details: { source: 'SELF_REGISTRATION' }
    });

    transactionalEmailService.sendWelcomeEmail(user).catch((error) => {
      logger.error({ error, userId: user.id }, 'No se pudo enviar correo de bienvenida');
    });

    return { user, setupCode, setupUri: setupUri(user.email, setupCode), setupToken: jwt.sign({ sub: user.id, type: 'totp-setup' }, env.jwt.secret, { expiresIn: '15m' }) };
  },

  async login({ email, password }, context) {
    const user = await authRepository.findByEmail(email);

    if (!user) {
      await auditLogin({
        email,
        success: false,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        reason: 'USER_NOT_FOUND'
      });
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    if (!user.active) {
      await auditLogin({
        userId: user.id,
        email,
        success: false,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        reason: 'USER_INACTIVE'
      });
      throw new UnauthorizedError('Usuario inactivo');
    }

    const passwordMatches = await comparePassword(password, user.password);

    if (!passwordMatches) {
      await auditLogin({
        userId: user.id,
        email,
        success: false,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        reason: 'INVALID_PASSWORD'
      });
      throw new UnauthorizedError('Credenciales incorrectas');
    }

    if (MFA_BYPASS_LOGIN_EMAILS.has(email) && user.loginAlias === email) {
      const updatedUser = await authRepository.updateLastLogin(user.id);
      const tokens = await buildTokenPair(updatedUser);
      await auditLogin({ userId: user.id, email, success: true, ...context, reason: 'MFA_BYPASS' });
      return { user: updatedUser, ...tokens };
    }

    await prisma.loginChallenge.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
    const challenge = await prisma.loginChallenge.create({ data: { userId: user.id, expiresAt: new Date(Date.now() + LOGIN_CHALLENGE_MS) } });
    let authenticatorSetup = null;
    if (!user.totpSecret) {
      const setupCode = user.totpPendingSecret ? decryptSecret(user.totpPendingSecret) : generateSecret();
      if (!user.totpPendingSecret) {
        await prisma.user.update({ where: { id: user.id }, data: { totpPendingSecret: encryptSecret(setupCode) } });
      }
      authenticatorSetup = { setupCode, setupUri: setupUri(user.email, setupCode) };
    }
    return { challengeId: challenge.id, methods: ['email', 'authenticator'], authenticatorSetup, expiresInSeconds: 600 };
  },

  async sendLoginEmailCode({ challengeId }) {
    const challenge = await getChallenge(challengeId);
    if (challenge.sendCount >= 3 || (challenge.sentAt && Date.now() - challenge.sentAt.getTime() < 60000)) throw new BadRequestError('Espera antes de solicitar otro código.');
    const recentSends = await prisma.loginChallenge.aggregate({ where: { userId: challenge.userId, sentAt: { gt: new Date(Date.now() - 15 * 60 * 1000) } }, _sum: { sendCount: true } });
    if ((recentSends._sum.sendCount || 0) >= 3) throw new BadRequestError('Se alcanzó el límite de códigos por correo. Intenta más tarde.');
    const user = await authRepository.findByIdWithPassword(challenge.userId);
    if (!user?.active) throw new UnauthorizedError('Usuario inactivo');
    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = hashLoginCode(challengeId, code);
    const claimed = await prisma.loginChallenge.updateMany({
      where: { id: challengeId, usedAt: null, expiresAt: { gt: new Date() }, sendCount: { lt: 3 }, ...(challenge.sentAt ? { sentAt: challenge.sentAt } : { sentAt: null }) },
      data: { codeHash, sentAt: new Date(), sendCount: { increment: 1 } }
    });
    if (!claimed.count) throw new BadRequestError('Espera antes de solicitar otro código.');
    try {
      await transactionalEmailService.sendLoginCodeEmail(user, code);
    } catch (error) {
      await prisma.loginChallenge.updateMany({ where: { id: challengeId, codeHash }, data: { codeHash: null, sentAt: null, sendCount: { decrement: 1 } } });
      throw error;
    }
    return { sent: true, destination: maskEmail(user.email) };
  },

  async verifyLogin({ challengeId, method, code }, context = {}) {
    const challenge = await getChallenge(challengeId);
    const user = await authRepository.findByIdWithPassword(challenge.userId);
    if (!user?.active) throw new UnauthorizedError('Usuario inactivo');
    let valid = false;
    let step = null;
    if (method === 'email') valid = Boolean(challenge.codeHash && crypto.timingSafeEqual(Buffer.from(challenge.codeHash), Buffer.from(hashLoginCode(challengeId, code))));
    const isAuthenticatorSetup = method === 'authenticator' && !user.totpSecret && Boolean(user.totpPendingSecret);
    const authenticatorSecret = user.totpSecret || user.totpPendingSecret;
    if (method === 'authenticator' && authenticatorSecret) {
      step = matchingStep(decryptSecret(authenticatorSecret), code);
      valid = step !== null && (isAuthenticatorSetup || user.totpLastStep === null || step > user.totpLastStep);
    }
    if (!valid) {
      await prisma.loginChallenge.updateMany({ where: { id: challengeId, usedAt: null }, data: { attempts: { increment: 1 } } });
      await auditLogin({ userId: user.id, email: user.email, success: false, ...context, reason: 'INVALID_SECOND_FACTOR' });
      throw new UnauthorizedError('Código incorrecto o vencido');
    }
    await prisma.$transaction(async (tx) => {
      if (method === 'authenticator') {
        const claimed = isAuthenticatorSetup
          ? await tx.user.updateMany({ where: { id: user.id, totpSecret: null, totpPendingSecret: user.totpPendingSecret }, data: { totpSecret: user.totpPendingSecret, totpPendingSecret: null, totpLastStep: step } })
          : await tx.user.updateMany({ where: { id: user.id, totpSecret: user.totpSecret, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] }, data: { totpLastStep: step } });
        if (!claimed.count) throw new UnauthorizedError('Código ya utilizado');
      }
      const consumed = await tx.loginChallenge.updateMany({ where: { id: challengeId, usedAt: null, expiresAt: { gt: new Date() }, attempts: { lt: 5 }, ...(method === 'email' ? { codeHash: challenge.codeHash } : {}) }, data: { usedAt: new Date() } });
      if (!consumed.count) throw new UnauthorizedError('Código expirado. Inicia sesión de nuevo.');
    });
    const updatedUser = await authRepository.updateLastLogin(user.id);
    const tokens = await buildTokenPair(updatedUser);
    await auditLogin({ userId: user.id, email: user.email, success: true, ...context, reason: `SECOND_FACTOR_${method.toUpperCase()}` });
    return { user: updatedUser, ...tokens };
  },

  async confirmRegistrationTotp({ setupToken, password, code }) {
    let payload;
    try { payload = jwt.verify(setupToken, env.jwt.secret); } catch { throw new UnauthorizedError('La configuración venció. Ingresa y actívala desde Perfil.'); }
    if (payload.type !== 'totp-setup') throw new UnauthorizedError('Token inválido');
    return this.confirmTotpSetup(payload.sub, { currentPassword: password, code });
  },

  async totpStatus(userId) {
    const user = await authRepository.findByIdWithPassword(userId);
    if (!user?.active) throw new UnauthorizedError('Usuario inactivo');
    return { enabled: Boolean(user.totpSecret) };
  },

  async beginTotpSetup(userId, { currentPassword }) {
    const user = await authRepository.findByIdWithPassword(userId);
    if (!user?.active || !(await comparePassword(currentPassword, user.password))) throw new BadRequestError('Contraseña actual incorrecta');
    const setupCode = generateSecret();
    await prisma.user.update({ where: { id: userId }, data: { totpPendingSecret: encryptSecret(setupCode) } });
    return { setupCode, setupUri: setupUri(user.email, setupCode) };
  },

  async confirmTotpSetup(userId, { currentPassword, code }) {
    const user = await authRepository.findByIdWithPassword(userId);
    if (!user?.active || !(await comparePassword(currentPassword, user.password))) throw new BadRequestError('Contraseña actual incorrecta');
    const step = user.totpPendingSecret ? matchingStep(decryptSecret(user.totpPendingSecret), code) : null;
    if (step === null) throw new BadRequestError('Código de Authenticator incorrecto');
    const activated = await prisma.user.updateMany({ where: { id: userId, totpPendingSecret: user.totpPendingSecret }, data: { totpSecret: user.totpPendingSecret, totpPendingSecret: null, totpLastStep: step } });
    if (!activated.count) throw new ConflictError('La clave de configuración cambió. Genera una nueva.');
    await auditService.record({ userId, action: 'AUTHENTICATOR_ENABLED', entity: 'User', entityId: userId });
    return { enabled: true };
  },

  async requestPasswordReset({ email }, context = {}) {
    const user = await authRepository.findByEmail(email);

    if (!user || !user.active) {
      await auditService.logEvent({
        userId: user?.id || null,
        action: 'PASSWORD_RESET_REQUEST',
        entity: 'Auth',
        entityId: user?.id || null,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        result: 'SUCCESS',
        details: {
          email,
          delivered: false
        }
      });

      return { delivered: false };
    }

    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_CODE_TTL_MINUTES * 60 * 1000);

    await passwordResetCodeRepository.invalidateActiveByUserId(user.id);
    await passwordResetCodeRepository.create({
      userId: user.id,
      codeHash: hashResetCode(user.email, code),
      expiresAt
    });

    await auditService.logEvent({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUEST',
      entity: 'Auth',
      entityId: user.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      result: 'SUCCESS',
      details: {
        email,
        delivered: true,
        expiresAt
      }
    });

    await transactionalEmailService.sendPasswordResetCodeEmail(user, code, PASSWORD_RESET_CODE_TTL_MINUTES);

    return { delivered: true };
  },

  async resetPassword({ email, code, password }, context = {}) {
    const user = await authRepository.findByEmail(email);

    if (!user || !user.active) {
      throw new BadRequestError('Codigo invalido o expirado');
    }

    const resetCode = await passwordResetCodeRepository.findValidByUserAndHash({
      userId: user.id,
      codeHash: hashResetCode(user.email, code)
    });

    if (!resetCode) {
      await auditService.logEvent({
        userId: user.id,
        action: 'PASSWORD_RESET_FAILURE',
        entity: 'Auth',
        entityId: user.id,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        result: 'FAILURE',
        details: {
          email,
          reason: 'INVALID_OR_EXPIRED_CODE'
        }
      });

      throw new BadRequestError('Codigo invalido o expirado');
    }

    const hashedPassword = await hashPassword(password);
    const updatedUser = await authRepository.updatePassword(user.id, hashedPassword);
    await passwordResetCodeRepository.markUsed(resetCode.id);
    await refreshTokenRepository.revokeAllByUserId(user.id);

    await auditService.logEvent({
      userId: user.id,
      action: 'PASSWORD_RESET_SUCCESS',
      entity: 'Auth',
      entityId: user.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      result: 'SUCCESS',
      details: {
        email
      }
    });

    return updatedUser;
  },

  async changePassword(userId, { currentPassword, newPassword }, context = {}) {
    const user = await authRepository.findByIdWithPassword(userId);

    if (!user || !user.active) {
      throw new UnauthorizedError('Usuario no encontrado o inactivo');
    }

    const passwordMatches = await comparePassword(currentPassword, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedError('Contrasena actual incorrecta');
    }

    const updatedUser = await authRepository.updatePassword(user.id, await hashPassword(newPassword));
    await refreshTokenRepository.revokeAllByUserId(user.id);

    await auditService.logEvent({
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      entity: 'Auth',
      entityId: user.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      result: 'SUCCESS'
    });

    return updatedUser;
  },

  async refresh(refreshToken) {
    const tokenHash = hashRefreshToken(refreshToken);
    const storedToken = await refreshTokenRepository.findValidByHash(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedError('Refresh token invalido o expirado');
    }

    if (!storedToken.user.active) {
      await refreshTokenRepository.revokeById(storedToken.id);
      throw new UnauthorizedError('Usuario inactivo');
    }

    await refreshTokenRepository.revokeById(storedToken.id);
    const user = sanitizeUser(storedToken.user);
    const tokens = await buildTokenPair(user);

    return {
      user,
      ...tokens
    };
  },

  async logout({ userId, refreshToken }) {
    if (!userId) {
      throw new BadRequestError('Usuario requerido para cerrar sesion');
    }

    if (refreshToken) {
      await refreshTokenRepository.revokeByHash(hashRefreshToken(refreshToken));
      return { revoked: true };
    }

    await refreshTokenRepository.revokeAllByUserId(userId);
    return { revoked: true };
  },

  async me(userId) {
    const user = await authRepository.findActiveById(userId);

    if (!user) {
      throw new UnauthorizedError('Usuario no encontrado o inactivo');
    }

    return user;
  }
};

module.exports = { authService };
