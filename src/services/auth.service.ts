import { FastifyInstance } from 'fastify';
import { UserModel } from '../models/user.model.js';
import { RegisterInput, LoginInput } from '../schemas/user.schema.js';
import { User } from '../config/db.schemas.js';
import { AppError } from '../types/errors.js';
import bcrypt from 'bcryptjs';

export class AuthService {
  private userModel: UserModel;

  constructor(private fastify: FastifyInstance) {
    this.userModel = new UserModel();
  }

  async register(data: RegisterInput): Promise<Omit<User, 'password'>> {
    const existingUser = await this.userModel.findByEmail(data.email);
    if (existingUser) {
      throw AppError.conflict('User already exists');
    }

    return await this.userModel.create(data);
  }

  async login(email: string, password: string): Promise<{ token: string; user: Omit<User, 'password'> }> {
    const user = await this.userModel.findByEmail(email);
    if (!user) {
      throw AppError.unauthorized('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw AppError.unauthorized('Invalid credentials');
    }

    if (!user.isActive) {
      throw AppError.forbidden('Account is deactivated');
    }

    await this.userModel.updateLastLogin(user.id);

    const token = this.fastify.jwt.sign({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  async getUser(id: number): Promise<Omit<User, 'password'> | null> {
    return await this.userModel.findById(id);
  }

  async validateToken(token: string): Promise<any> {
    try {
      const decoded = this.fastify.jwt.verify(token);
      return decoded;
    } catch (error) {
      throw AppError.unauthorized('Invalid token');
    }
  }
}
