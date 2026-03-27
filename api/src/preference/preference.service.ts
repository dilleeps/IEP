// src/modules/preference/preference.service.ts
import { UserPreference } from './preference.model.js';
import { PreferenceRepository } from './preference.repo.js';
import { UpdatePreferenceDto } from './preference.types.js';

export class PreferenceService {
  private repo: PreferenceRepository;

  constructor() {
    this.repo = new PreferenceRepository();
  }

  async getByUserId(userId: string): Promise<UserPreference> {
    return this.repo.findOrCreateByUserId(userId);
  }

  async update(userId: string, data: UpdatePreferenceDto): Promise<UserPreference> {
    return this.repo.updateByUserId(userId, data);
  }
}
