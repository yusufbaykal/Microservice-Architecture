import { Router } from 'express';
import { register, login } from '../controller/auth.controller';
import { authenticateToken, authorizeRole } from '../middlewares/auth.middleware';
import {
  productServiceProxy,
  orderServiceProxy,
  notificationServiceProxy,
} from '../middlewares/proxy.middleware';

const router = Router();

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);

// Product Service routes
router.all('/api/products*', authenticateToken, authorizeRole(['admin']), productServiceProxy);

// Order Service routes
router.all('/api/orders*', authenticateToken, authorizeRole(['admin']), orderServiceProxy);

// Notification Service routes
router.all('/api/notifications*', authenticateToken, notificationServiceProxy);

router.get('/admin', authenticateToken, authorizeRole(['admin']), (req, res) => {
  res.json({ message: 'Welcome to the admin panel' });
});

export default router; 