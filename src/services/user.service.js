const { userRepository } = require('../repositories/user.repository');
const { authRepository } = require('../repositories/auth.repository');
const { auditService } = require('./audit.service');
const { notificationService } = require('./notification.service');
const { BadRequestError, ConflictError, NotFoundError } = require('../utils/errors');
const { comparePassword, hashPassword } = require('../utils/password.util');
const { buildPagination, buildPaginationMeta } = require('../utils/pagination.util');

const userService = {
  async create(payload, actor) {
    const existing = await userRepository.findByEmail(payload.email);
    if (existing) throw new ConflictError('El email ya esta registrado');

    const user = await userRepository.create({
      name: payload.name,
      email: payload.email,
      password: await hashPassword(payload.password),
      role: payload.role,
      phone: payload.phone || null,
      company: payload.company || null,
      active: true
    });

    await auditService.record({
      userId: actor.id,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user.id,
      newValue: user
    });

    return user;
  },

  async list(query) {
    const pagination = buildPagination(query);
    const where = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.active !== undefined ? { active: query.active } : {}),
      ...(query.q ? {
        OR: [
          { name: { contains: query.q, mode: 'insensitive' } },
          { email: { contains: query.q, mode: 'insensitive' } }
        ]
      } : {})
    };

    const [total, items] = await userRepository.list({
      where,
      orderBy: { [pagination.sortBy]: pagination.sortOrder },
      skip: pagination.skip,
      take: pagination.limit
    });

    return { items, pagination: buildPaginationMeta({ ...pagination, total }) };
  },

  async getById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('Usuario no encontrado');
    return user;
  },

  async update(id, payload, actor, invalidateChallenges = false) {
    const previous = await this.getById(id);
    const updated = await userRepository.update(id, payload, invalidateChallenges);

    await auditService.record({
      userId: actor?.id || null,
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: id,
      previousValue: previous,
      newValue: updated
    });

    return updated;
  },

  async updateMe({ currentPassword, ...payload }, actor) {
    if (payload.email && payload.email !== actor.email) {
      const user = await authRepository.findByIdWithPassword(actor.id);
      if (!currentPassword || !(await comparePassword(currentPassword, user.password))) throw new BadRequestError('Ingresa tu contraseña actual para cambiar el correo');
      const existing = await userRepository.findByEmail(payload.email);
      if (existing) throw new ConflictError('El correo ya está registrado');
    }
    try {
      return await this.update(actor.id, payload, actor, Boolean(payload.email && payload.email !== actor.email));
    } catch (error) {
      if (error.code === 'P2002') throw new ConflictError('El correo ya está registrado');
      throw error;
    }
  },

  async updateRole(id, role, actor) {
    const previous = await this.getById(id);
    const updated = await userRepository.update(id, { role });

    await auditService.record({
      userId: actor.id,
      action: 'USER_ROLE_CHANGED',
      entity: 'User',
      entityId: id,
      previousValue: { role: previous.role },
      newValue: { role }
    });

    if (previous.role !== role) {
      const roleLabel = { ADMIN: 'Administrador', TECHNICIAN: 'Tecnico', CLIENT: 'Cliente' };
      const promoted = ['ADMIN', 'TECHNICIAN'].includes(role);
      await notificationService.dispatchNotification({
        userId: updated.id,
        event: 'USER_ROLE_CHANGED',
        entityType: 'User',
        entityId: updated.id,
        payload: {
          actorName: actor.name || actor.email || 'Administrador',
          previousRole: roleLabel[previous.role] || previous.role,
          newRole: roleLabel[role] || role,
          roleChangeMessage: promoted
            ? `Felicidades, ${actor.name || actor.email || 'un administrador'} te promovio a ${roleLabel[role] || role}.`
            : `${actor.name || actor.email || 'Un administrador'} actualizo tu rol a ${roleLabel[role] || role}.`
        }
      });
    }

    return updated;
  },

  async setActive(id, active, actor) {
    const previous = await this.getById(id);
    const updated = await userRepository.update(id, { active });

    await auditService.record({
      userId: actor?.id || null,
      action: active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entity: 'User',
      entityId: id,
      previousValue: { active: previous.active },
      newValue: { active: updated.active }
    });

    return updated;
  }
};

module.exports = { userService };
