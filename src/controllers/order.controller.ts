import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderService } from '../services/order.service.js';
import { createOrderSchema, updateOrderStatusSchema, updatePaymentStatusSchema } from '../schemas/order.schema.js';
import { idSchema, parsePagination } from '../utils/validator.js';
import { AppError } from '../types/errors.js';
import { processImage } from '../utils/upload.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { writeFile } from 'fs/promises';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { join, basename, extname } from 'path';
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

    let buffer: Buffer;
    try {
      buffer = await data.toBuffer();
    } catch {
      throw AppError.badRequest('File too large (max 5 MB)');
    }

    const webp = await processImage(buffer, { maxWidth: 1600 });
    const filename = `proof_${id}_${randomUUID()}.webp`;
    await writeFile(join(proofsDir, filename), webp);

    const updated = await this.orderService.updatePaymentProof(id, filename);
    reply.send({ success: true, message: 'Payment proof uploaded', data: updated });
  };

  downloadProof = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const authReq = request as AuthRequest;
    const order = await this.orderService.findById(id);
    if (!order) throw AppError.notFound('Order not found');
    if (order.userId !== authReq.user.id && authReq.user.role !== 'admin') throw AppError.forbidden();
    if (!order.paymentProof) throw AppError.notFound('Payment proof not uploaded');

    // Legacy rows stored a /storage/proofs/<file> URL, new rows store the filename.
    const filename = basename(order.paymentProof);
    const ext = extname(filename);
    if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) throw AppError.notFound('Payment proof not found');

    const filepath = join(proofsDir, filename);
    if (!existsSync(filepath)) throw AppError.notFound('Payment proof not found');

    reply.type(ext === '.jpg' ? 'image/jpeg' : `image/${ext.slice(1)}`).send(createReadStream(filepath));
  };

  getReceipt = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const authReq = request as AuthRequest;
    const order = await this.orderService.findById(id);
    if (!order) throw AppError.notFound('Order not found');
    if (order.userId !== authReq.user.id && authReq.user.role !== 'admin') throw AppError.forbidden();

    const esc = (value: unknown): string =>
      String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string));

    const rows = (order.items || []).map((item: any) => `
      <tr>
        <td>${esc(item.productName)}</td>
        <td class="num">${esc(item.quantity)}</td>
        <td class="num">Rp ${Number(item.price).toLocaleString('en-US')}</td>
        <td class="num">Rp ${(Number(item.price) * Number(item.quantity)).toLocaleString('en-US')}</td>
      </tr>`).join('');

    const created = new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

    reply
      .type('text/html; charset=utf-8')
      .header('Content-Disposition', `inline; filename="receipt-${id}.html"`)
      .send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Receipt #${esc(order.id)}</title>
<style>
  body{font-family:ui-sans-serif,system-ui,sans-serif;margin:0;padding:32px;color:#111;background:#f6f7f9}
  .sheet{max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px}
  h1{font-size:18px;margin:0 0 4px} .muted{color:#6b7280;font-size:13px}
  table{width:100%;border-collapse:collapse;margin-top:20px;font-size:14px}
  th,td{text-align:left;padding:8px 4px;border-bottom:1px solid #eee} th{font-size:12px;text-transform:uppercase;color:#6b7280}
  .num{text-align:right} .total{font-size:16px;font-weight:600}
  .meta{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:16px;font-size:13px}
  .print{margin-top:24px} button{padding:8px 16px;border:0;border-radius:8px;background:#2563eb;color:#fff;font-size:14px;cursor:pointer}
  @media print{body{background:#fff;padding:0}.sheet{border:0}.print{display:none}}
</style></head>
<body><div class="sheet">
  <h1>Order receipt #${esc(order.id)}</h1>
  <div class="muted">${esc(created)}</div>
  <div class="meta">
    <div><strong>Status</strong><br>${esc(order.status)}</div>
    <div><strong>Payment</strong><br>${esc(order.paymentStatus)} (${esc(order.paymentMethod)})</div>
    <div><strong>Ship to</strong><br>${esc(order.shippingAddress)}</div>
    <div><strong>Phone</strong><br>${esc(order.phone || '-')}</div>
  </div>
  <table><thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Subtotal</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr><td colspan="3" class="num total">Total</td><td class="num total">Rp ${Number(order.total).toLocaleString('en-US')}</td></tr></tfoot></table>
  <div class="print"><button onclick="window.print()">Print</button></div>
</div></body></html>`);
  };
}
