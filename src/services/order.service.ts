import { OrderModel } from '../models/order.model.js';
import { CartModel } from '../models/cart.model.js';
import type { PaginatedResponse, PaginationParams } from '../types/index.js';

export class OrderService {
  private orderModel = new OrderModel();
  private cartModel = new CartModel();

  async findAll(userId: number | undefined, pagination?: PaginationParams): Promise<PaginatedResponse<any>> {
    return this.orderModel.findAll(userId, pagination);
  }

  async findById(id: number): Promise<any | null> {
    return this.orderModel.findById(id);
  }

  async create(userId: number, data: { shippingAddress: string; phone: string; notes?: string }): Promise<any> {
    const cartItems = await this.cartModel.findByUser(userId);
    if (!cartItems.length) throw new Error('Cart is empty');

    const items = cartItems.map((item: any) => ({
      productId: item.productId,
      productName: item.product?.name || 'Unknown',
      price: String(item.price || 0),
      quantity: item.quantity,
    }));

    const total = items.reduce((sum: number, i: any) => sum + Number(i.price) * i.quantity, 0);

    const order = await this.orderModel.create(userId, {
      shippingAddress: data.shippingAddress,
      phone: data.phone,
      notes: data.notes,
      total: String(total),
      status: 'pending',
      paymentStatus: 'unpaid',
      paymentMethod: 'qris',
    } as any, items);

    await this.cartModel.clearByUser(userId);
    return order;
  }

  async updateStatus(id: number, status: string): Promise<any | null> {
    return this.orderModel.update(id, { status } as any);
  }

  async updatePaymentStatus(id: number, paymentStatus: string): Promise<any | null> {
    return this.orderModel.update(id, { paymentStatus } as any);
  }

  async updatePaymentProof(id: number, proofUrl: string): Promise<any | null> {
    return this.orderModel.updatePaymentProof(id, proofUrl);
  }
}
