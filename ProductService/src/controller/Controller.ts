import { Request, Response } from 'express';
import { ProductService } from '../service/Service';

export class ProductController {
  constructor(private productService: ProductService) {}

  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const product = await this.productService.createProduct(req.body);
      res.status(200).json({message: 'Product Created'});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      res.status(400).json({ error: message });
    }
  }
}