import { Router } from 'express';
import { OrderService } from '../service/Service';

const orderService = new OrderService();

const router = Router();

router.post('/create', orderService.createOrder.bind(orderService));

export default router;