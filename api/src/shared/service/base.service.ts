import { NotFoundError } from "../errors/appError.js";
import type { BaseRepo } from "../db/base.repo.js";
import type { Model } from "sequelize";

export class BaseService<TModel extends Model> {
  constructor(protected readonly repo: BaseRepo<TModel>) {}

  async getOrThrow(id: string) {
    const entity = await this.repo.findById(id);
    if (!entity) throw new NotFoundError(`Resource ${id} not found`);
    return entity;
  }
}
