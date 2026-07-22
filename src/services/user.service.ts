import { UserModel } from '../models/user.model.js';
import { User } from '../config/db.schemas.js';

export class UserService {
  private userModel: UserModel;

  constructor() {
    this.userModel = new UserModel();
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    return await this.userModel.findAll();
  }

  async findById(id: number): Promise<Omit<User, 'password'> | null> {
    return await this.userModel.findById(id);
  }

  async updateUser(
    id: number,
    data: Partial<Omit<User, 'id' | 'password' | 'createdAt' | 'updatedAt'>>
  ): Promise<Omit<User, 'password'> | null> {
    return await this.userModel.update(id, data);
  }

  async updatePassword(id: number, currentPassword: string, newPassword: string): Promise<boolean> {
    return await this.userModel.updatePassword(id, currentPassword, newPassword);
  }

  async deleteUser(id: number): Promise<boolean> {
    return await this.userModel.delete(id);
  }

  async toggleUserStatus(id: number, isActive: boolean): Promise<Omit<User, 'password'> | null> {
    return await this.userModel.toggleStatus(id, isActive);
  }
}