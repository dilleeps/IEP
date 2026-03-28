// src/modules/admin/users/admin-users.repo.ts
import { User } from '../../auth/user.model.js';
import { BaseRepo } from '../../shared/db/base.repo.js';
import { Op } from 'sequelize';

interface ListUsersFilters {
  role?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export class AdminUsersRepository extends BaseRepo<User> {
  constructor() {
    super(User);
  }

  async findAllUsers(
    filters: ListUsersFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<{ rows: User[]; count: number }> {
    const where: any = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where[Op.or] = [
        { email: { [Op.iLike]: `%${filters.search}%` } },
        { firstName: { [Op.iLike]: `%${filters.search}%` } },
        { lastName: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    return await this.model.findAndCountAll({
      where,
      order: [[filters.sortBy || 'createdAt', filters.sortOrder || 'DESC']],
      limit,
      offset: (page - 1) * limit,
      attributes: { exclude: ['passwordHash'] },
    });
  }

  async getUserStats(): Promise<any> {
    const stats = await this.model.findAll({
      attributes: [
        [require('sequelize').fn('COUNT', '*'), 'total'],
        'role',
        'status',
      ],
      group: ['role', 'status'],
      raw: true,
    });

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await this.model.count({
      where: {
        createdAt: {
          [Op.gte]: startOfMonth,
        },
      },
    });

    return {
      stats,
      newThisMonth,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.model.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async changeStatus(id: string, status: User['status'], reason?: string): Promise<boolean> {
    const [affected] = await this.model.update(
      { status: status as User['status'] },
      { where: { id } }
    );

    // TODO: Log status change with reason in audit log
    return affected > 0;
  }
}
