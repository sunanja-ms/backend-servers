import { ApiKeyModel } from '../models/apikey.model.js';
import { CreateApiKeyInput } from '../schemas/apikey.schema.js';
import { AppError } from '../types/errors.js';
import type { ApiKeyInfo } from '../types/index.js';

export class ApiKeyService {
  private apiKeyModel: ApiKeyModel;

  constructor() {
    this.apiKeyModel = new ApiKeyModel();
  }

  async create(
    userId: number,
    data: CreateApiKeyInput
  ): Promise<{ rawKey: string; apiKey: ApiKeyInfo }> {
    return await this.apiKeyModel.create(userId, data.name);
  }

  async list(userId: number): Promise<ApiKeyInfo[]> {
    return await this.apiKeyModel.findByUser(userId);
  }

  async revoke(id: number, userId: number): Promise<boolean> {
    const deleted = await this.apiKeyModel.delete(id, userId);
    if (!deleted) {
      throw AppError.notFound('API key not found');
    }
    return true;
  }
}
