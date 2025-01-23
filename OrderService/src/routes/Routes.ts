import { Router } from 'express';
import { OrderService } from '../service/Service';

export function createOrderRouter(
    orderService: OrderService
  ): Router {
    const router = Router();
    router.post('/create', orderService.createOrder.bind(orderService));
    return router;
  }