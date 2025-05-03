import { Request, Response } from 'express';
import { TokenService } from '../services/token.service';
import { UserService } from '../services/user.service';

export class EmailController {
  static async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Token is required' });
      }

      // Verify token
      const decoded = await TokenService.verifyEmailToken(token);
      
      // Update user's email verification status
      await UserService.verifyEmail(decoded.email);
      
      // Delete the token from Redis
      await TokenService.deleteEmailToken(token);

      res.status(200).json({ 
        message: 'Email verified successfully',
        redirectUrl: `${process.env.FRONTEND_URL}/login?verified=true`
      });
    } catch (error) {
      console.error('Email verification failed:', error);
      res.status(400).json({ 
        error: 'Invalid or expired token',
        redirectUrl: `${process.env.FRONTEND_URL}/verify-email?error=invalid_token`
      });
    }
  }
} 