const { authRepository } = require('../repositories/auth.repository');
const { passwordResetCodeRepository } = require('../repositories/passwordResetCode.repository');
const { refreshTokenRepository } = require('../repositories/refreshToken.repository');
const { auditService } = require('./audit.service');
const { BadRequestError, ConflictError, UnauthorizedError } = require('../utils/errors');
const crypto = require('crypto');
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

const generateResetCode = () => crypto.randomInt(100000, 1000000).toString();

const hashResetCode = (email, code) => crypto
  .createHash('sha256')
  .update(`${email}:${code}`)
  .digest('hex');

const sanitizeUser = (user) => {
  if (!user) return null;

  const { password, ...safeUser } = user;
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

    const user = await authRepository.createClientUser({
      name: payload.name,
      email: payload.email,
      password,
      phone: payload.phone || null,
      company: payload.company || null,
      active: true
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

    return user;
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

    const updatedUser = await authRepository.updateLastLogin(user.id);
    const tokens = await buildTokenPair(updatedUser);

    await auditLogin({
      userId: user.id,
      email,
      success: true,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      reason: 'OK'
    });

    return {
      user: updatedUser,
      ...tokens
    };
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
