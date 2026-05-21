const { userRepository } = require('../repositories/user.repository');
const { auditService } = require('./audit.service');
const { ConflictError, NotFoundError } = require('../utils/errors');
const { hashPassword } = require('../utils/password.util');
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

  async update(id, payload) {
    await this.getById(id);
    return userRepository.update(id, payload);
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

    return updated;
  },

  async setActive(id, active) {
    await this.getById(id);
    return userRepository.update(id, { active });
  }
};

module.exports = { userService };
