import { FastifyInstance } from 'fastify';
import { UserModel } from '../models/user.model.js';
import { TokenModel } from '../models/token.model.js';
import { RegisterInput } from '../schemas/user.schema.js';
import { User } from '../config/db.schemas.js';
import { AppError } from '../types/errors.js';
import { sendEmail, buildVerifyEmailLink, buildResetPasswordLink } from './email.service.js';
import bcrypt from 'bcryptjs';

export class AuthService {
  private userModel: UserModel;
  private tokenModel: TokenModel;

  constructor(private fastify: FastifyInstance) {
    this.userModel = new UserModel();
    this.tokenModel = new TokenModel();
  }

  async register(data: RegisterInput): Promise<Omit<User, 'password'>> {
    const existingUser = await this.userModel.findByEmail(data.email);
    if (existingUser) {
      throw AppError.conflict('User already exists');
    }

    const user = await this.userModel.create(data);

    const token = await this.tokenModel.create(user.id, 'email_verify');
    await sendEmail(
      user.email,
      'Verify your email',
      `Click to verify: ${buildVerifyEmailLink(token.token)}`
    );

    return user;
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

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userModel.findByEmail(email);
    if (!user) return

    const token = await this.tokenModel.create(user.id, 'password_reset');
    await sendEmail(
      user.email,
      'Reset your password',
      `Click to reset: ${buildResetPasswordLink(token.token)}`
    );
  }

  async resetPassword(tokenValue: string, newPassword: string): Promise<void> {
    const token = await this.tokenModel.findByToken(tokenValue, 'password_reset');
    if (!token) {
      throw AppError.badRequest('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userModel.updatePasswordOnly(token.userId, hashedPassword);
    await this.tokenModel.markUsed(token.id);
  }

  async verifyEmail(tokenValue: string): Promise<void> {
    const token = await this.tokenModel.findByToken(tokenValue, 'email_verify');
    if (!token) {
      throw AppError.badRequest('Invalid or expired verification token');
    }

    await this.userModel.updateEmailVerified(token.userId);
    await this.tokenModel.markUsed(token.id);
  }
}
