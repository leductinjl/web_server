import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { UserModel } from '../models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const decoded = await TokenService.verifyAuthToken(token);
    if (decoded.type !== 'access') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Check if user still exists
    const userModel = new UserModel();
    const user = await userModel.findByEmail(decoded.email);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check if account is verified
    if (user.status === 'unverified') {
      return res.status(403).json({ error: 'Account not verified' });
    }

    // Attach user info to request
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}; 