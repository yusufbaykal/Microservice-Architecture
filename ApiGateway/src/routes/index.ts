import { Router } from 'express';
import { register, login } from '../controller/auth.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';
import {
  productServiceProxy,
  orderServiceProxy,
  notificationServiceProxy,
} from '../middlewares/proxy.middleware';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);

router.all('/api/products*', authenticateToken, authorizeRole(['admin']), productServiceProxy);

router.all('/api/orders*', authenticateToken, authorizeRole(['admin']), orderServiceProxy);

router.all('/api/notifications*', authenticateToken, notificationServiceProxy);

router.get('/admin', authenticateToken, authorizeRole(['admin']), (_req, res) => {
  res.json({ message: 'Welcome to the admin panel' });
});

export default router; 