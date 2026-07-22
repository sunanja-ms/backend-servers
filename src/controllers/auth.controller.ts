import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service.js';
import { registerSchema, loginSchema } from '../schemas/user.schema.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const data = registerSchema.parse(request.body);
    const user = await this.authService.register(data);

    reply.status(201).send({
      success: true,
      message: 'User registered successfully',
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
    if (!token) {
      return reply.status(400).send({
        success: false,
        error: 'Bad Request',
        message: 'Token is required',
      });
    }

    const decoded = await this.authService.validateToken(token);
    reply.send({
      success: true,
      data: { valid: true, user: decoded },
    });
  };
}