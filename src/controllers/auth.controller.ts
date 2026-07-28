import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, verifyEmailSchema } from '../schemas/user.schema.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { AppError } from '../types/errors.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const data = registerSchema.parse(request.body);
    const user = await this.authService.register(data);

    reply.status(201).send({
      success: true,
      message: 'User registered successfully. Check email to verify.',
      data: user,
    });
  };

  login = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { email, password } = loginSchema.parse(request.body);
    const result = await this.authService.login(email, password);

    reply.send({
      success: true,
      message: 'Login successful',
      data: result,
    });
  };

  me = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = await this.authService.getUser((request as AuthRequest).user.id);

    reply.send({
      success: true,
      data: user,
    });
  };

  validateToken = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token || token.length === 0) {
      throw AppError.badRequest('Token is required');
    }

    const decoded = await this.authService.validateToken(token);
    reply.send({
      success: true,
      data: { valid: true, user: decoded },
    });
  };

  forgotPassword = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { email } = forgotPasswordSchema.parse(request.body);
    await this.authService.forgotPassword(email);

    reply.send({
      success: true,
      message: 'If the email exists, a reset link has been sent.',
    });
  };

  resetPassword = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { token, password } = resetPasswordSchema.parse(request.body);
    await this.authService.resetPassword(token, password);

    reply.send({
      success: true,
      message: 'Password reset successfully.',
    });
  };

  verifyEmail = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { token } = verifyEmailSchema.parse(request.body);
    await this.authService.verifyEmail(token);

    reply.send({
      success: true,
      message: 'Email verified successfully.',
    });
  };
}
