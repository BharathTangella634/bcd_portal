import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../entities/User';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    hospitalId: number;
    role: UserRole;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'secret';
    const decoded = jwt.verify(token!, secret) as any;
    req.user = {
      id: decoded.userId,
      hospitalId: decoded.hospitalId,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || (!roles.includes(req.user.role) && req.user.role !== UserRole.ADMIN)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};
