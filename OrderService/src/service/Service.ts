import { Request, Response } from 'express';
import { OrderSaga } from '../application/saga/Saga';

export class OrderService {
    constructor(
      private saga: OrderSaga
    ) {}
    
    async createOrder(req: Request, res: Response): Promise<void> {
      try {
        const order = await this.saga.start(req.body);
        res.status(201).json(order);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Bilinmeyen hata';
        res.status(400).json({ error: message });
      }
    }
  }