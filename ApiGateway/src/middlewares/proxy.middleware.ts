import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { config } from '../config/config';

// Product Service Proxy
export const productServiceProxy = createProxyMiddleware({
  target: config.services.product.url,
  changeOrigin: true,
  pathRewrite: {
    '^/api/products': '/api/products' // Match Product Service route
  },
  onProxyReq: (proxyReq, req, res) => {
    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err: Error, req: Request, res: Response) => {
    console.error('Product Service Error:', err.message);
    res.status(500).json({ 
      message: 'Product Service is currently not available', 
      error: err.message
    });
  }
});

// Order Service Proxy
export const orderServiceProxy = createProxyMiddleware({
  target: config.services.order.url,
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': '/api/orders' // Match Order Service route
  },
  onProxyReq: (proxyReq, req, res) => {
    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err: Error, req: Request, res: Response) => {
    console.error('Order Service Error:', err.message);
    res.status(500).json({ 
      message: 'Order Service is currently not available', 
      error: err.message
    });
  }
});

// Notification Service Proxy
export const notificationServiceProxy = createProxyMiddleware({
  target: config.services.notification.url,
  changeOrigin: true,
  pathRewrite: {
    '^/api/notifications': '/notifications'
  },
  onError: (err: Error, req: Request, res: Response) => {
    console.error('Notification Service Error:', err.message);
    res.status(500).json({ 
      message: 'Notification Service is currently not available', 
      error: err.message 
    });
  }
}); 