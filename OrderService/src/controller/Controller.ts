import { Request, Response } from 'express';
import { OrderService } from '../service/Service';

export class OrderController {
  constructor(private orderService: OrderService) {}

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      await this.orderService.createOrder(req.body);
      res.status(201).json({ message: 'Order Created'});
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
      res.status(400).json({ error: message });
    }
  }
}