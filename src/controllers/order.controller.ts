import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderService } from '../services/order.service.js';
import { createOrderSchema, updateOrderStatusSchema, updatePaymentStatusSchema } from '../schemas/order.schema.js';
import { idSchema, parsePagination } from '../utils/validator.js';
import { AppError } from '../types/errors.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { pipeline } from 'stream/promises';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const proofsDir = join(__dirname, '..', '..', 'storage', 'proofs');
if (!existsSync(proofsDir)) mkdirSync(proofsDir, { recursive: true });

export class OrderController {
  constructor(private orderService: OrderService) {}

  getAll = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const authReq = request as AuthRequest;
    const isAdmin = authReq.user?.role === 'admin';
    const userId = isAdmin ? undefined : authReq.user?.id;
    const pagination = parsePagination(request.query as Record<string, unknown>);
    const result = await this.orderService.findAll(userId, pagination);
    reply.send({ success: true, data: result.data, message: `Page ${result.page} of ${result.totalPages} (${result.total} total)` });
  };

  getById = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const authReq = request as AuthRequest;
    const order = await this.orderService.findById(id);
    if (!order) throw AppError.notFound('Order not found');
    if (order.userId !== authReq.user.id && authReq.user.role !== 'admin') throw AppError.forbidden();
    reply.send({ success: true, data: order });
  };

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userId = (request as AuthRequest).user.id;
    const data = createOrderSchema.parse(request.body);
    const order = await this.orderService.create(userId, data);
    reply.status(201).send({ success: true, message: 'Order created', data: order });
  };

  updateStatus = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const { status } = updateOrderStatusSchema.parse(request.body);
    const order = await this.orderService.updateStatus(id, status);
    if (!order) throw AppError.notFound('Order not found');
    reply.send({ success: true, message: `Order status updated to ${status}`, data: order });
  };

  updatePayment = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const { paymentStatus } = updatePaymentStatusSchema.parse(request.body);
    const order = await this.orderService.updatePaymentStatus(id, paymentStatus);
    if (!order) throw AppError.notFound('Order not found');
    reply.send({ success: true, message: `Payment status updated to ${paymentStatus}`, data: order });
  };

  uploadProof = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const authReq = request as AuthRequest;
    const order = await this.orderService.findById(id);
    if (!order) throw AppError.notFound('Order not found');
    if (order.userId !== authReq.user.id) throw AppError.forbidden();

    const data = await request.file();
    if (!data) throw AppError.badRequest('No file uploaded');

    const ext = extname(data.filename) || '.jpg';
    const filename = `proof_${id}_${randomUUID()}${ext}`;
    const filepath = join(proofsDir, filename);

    await pipeline(data.file, createWriteStream(filepath));
    const proofUrl = `/storage/proofs/${filename}`;

    const updated = await this.orderService.updatePaymentProof(id, proofUrl);
    reply.send({ success: true, message: 'Payment proof uploaded', data: updated });
  };
}
