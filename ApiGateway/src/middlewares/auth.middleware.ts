import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { User } from '../models/User';

interface TokenPayload {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authorization token not found' });
    }

    const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
    const user = await User.findById(decoded.userId).exec();

    if (!user) {
      return res.status(401).json({ message: 'Invalid user' });
    }

    req.user = { 
      id: user._id.toString(), 
      role: user.role 
    };
    return next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not authorized for this operation' });
    }
    return next();
  };
}; 