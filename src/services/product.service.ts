import { ProductModel } from '../models/product.model.js';
import { NewProduct } from '../config/db.schemas.js';
import type { PaginatedResponse, PaginationParams } from '../types/index.js';

export class ProductService {
  private productModel = new ProductModel();

  async findAll(pagination?: PaginationParams, activeOnly = false): Promise<PaginatedResponse<any>> {
    return this.productModel.findAll(pagination, activeOnly);
  }

  async findById(id: number): Promise<any | null> {
    return this.productModel.findById(id);
  }

  async create(data: NewProduct): Promise<any> {
    return this.productModel.create(data);
  }

  async update(id: number, data: Partial<NewProduct>): Promise<any | null> {
    return this.productModel.update(id, data);
  }

  async delete(id: number): Promise<boolean> {
    return this.productModel.delete(id);
  }

  async restore(id: number): Promise<any | null> {
    return this.productModel.restore(id);
  }

  async updateStock(id: number, quantity: number): Promise<any | null> {
    return this.productModel.updateStock(id, quantity);
  }

  async toggleProductStatus(id: number, isActive: boolean): Promise<any | null> {
    return this.productModel.toggleStatus(id, isActive);
  }

  async addImage(productId: number, url: string, isPrimary?: boolean): Promise<any> {
    return this.productModel.addImage(productId, url, isPrimary);
  }

  async deleteImage(productId: number, imageId: number): Promise<boolean> {
    return this.productModel.deleteImage(productId, imageId);
  }

  async findImage(productId: number, imageId: number): Promise<any | null> {
    return this.productModel.findImage(productId, imageId);
  }

  async setPrimaryImage(productId: number, imageId: number): Promise<any | null> {
    return this.productModel.setPrimaryImage(productId, imageId);
  }

  async findLowStock(threshold: number, limit?: number): Promise<any[]> {
    return this.productModel.findLowStock(threshold, limit);
  }
}
