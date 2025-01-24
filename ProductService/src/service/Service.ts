import { ProductRepository } from '../domain/Repositories/Repositories';

export class ProductService {
  constructor(private repositories: ProductRepository) {}

  async createProduct(data: any): Promise<any> {
    try {
      const product = await this.repositories.createProduct(data);
      return product;
    } catch (error) {
      throw error instanceof Error ? error : new Error('Bilinmeyen hata');
    }
  }
}