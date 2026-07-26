import { ProductModel } from '../models/product.model.js';
import { Product, NewProduct } from '../config/db.schemas.js';
import { PaginatedResponse, PaginationParams } from '../types/index.js';

export class ProductService {
  private productModel: ProductModel;

  constructor() {
    this.productModel = new ProductModel();
  }

  async findAll(userId?: number, pagination?: PaginationParams): Promise<PaginatedResponse<Product>> {
    return await this.productModel.findAll(userId, pagination);
  }

  async findById(id: number): Promise<Product | null> {
    return await this.productModel.findById(id);
  }

  async create(data: NewProduct): Promise<Product> {
    return await this.productModel.create(data);
  }

  async update(id: number, data: Partial<NewProduct>): Promise<Product | null> {
    return await this.productModel.update(id, data);
  }

  async delete(id: number): Promise<boolean> {
    return await this.productModel.delete(id);
  }

  async updateStock(id: number, quantity: number): Promise<Product | null> {
    return await this.productModel.updateStock(id, quantity);
  }

  async toggleProductStatus(id: number, isActive: boolean): Promise<Product | null> {
    return await this.productModel.toggleStatus(id, isActive);
  }
}
