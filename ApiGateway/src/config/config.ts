import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3003,
  jwtSecret: process.env.JWT_SECRET || '1234',
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://mongodb:27017/api-gateway',
  },
  services: {
    product: {
      url: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3000',
    },
    order: {
      url: process.env.ORDER_SERVICE_URL || 'http://order-service:3001',
    },
    notification: {
      url: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3002',
    },
  },
  rateLimiting: {
    windowMs: 15 * 60 * 1000, 
    max: 100, 
  },
  nodeEnv: process.env.NODE_ENV || 'production',
}; 