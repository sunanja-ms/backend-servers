import { CategoryModel } from '../models/category.model.js';
import { Category, NewCategory } from '../config/db.schemas.js';

export class CategoryService {
  private model = new CategoryModel();

  async findAll(): Promise<Category[]> {
    return this.model.findAll();
  }

  async findById(id: number): Promise<Category | null> {
    return this.model.findById(id);
  }

  async create(data: NewCategory): Promise<Category> {
    return this.model.create(data);
  }

  async update(id: number, data: Partial<NewCategory>): Promise<Category | null> {
    return this.model.update(id, data);
  }

  async delete(id: number): Promise<boolean> {
    return this.model.delete(id);
  }
}
