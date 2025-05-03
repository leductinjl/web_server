import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, email, password, phone } = req.body;

      await this.authService.registerUser({
        fullName,
        email,
        password,
        phone,
      });

      res.status(201).json({
        message: 'Registration successful. Please check your email to verify your account.',
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Email already exists' || error.message === 'Phone number already exists') {
          res.status(409).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Internal server error' });
        }
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      const result = await this.authService.login(email, password);
      
      res.status(200).json({
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid credentials') {
          res.status(401).json({ error: 'Invalid email or password' });
        } else if (error.message.includes('Account not verified')) {
          res.status(403).json({ error: error.message });
        } else {
          res.status(500).json({ error: 'Internal server error' });
        }
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token is required' });
        return;
      }

      const tokens = await this.authService.refreshToken(refreshToken);
      
      res.status(200).json({
        message: 'Token refreshed successfully',
        data: tokens
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Invalid refresh token') {
          res.status(401).json({ error: 'Invalid refresh token' });
        } else {
          res.status(500).json({ error: 'Internal server error' });
        }
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id; // Assuming we have auth middleware that sets req.user
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await this.authService.logout(userId);
      
      res.status(200).json({
        message: 'Logout successful'
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 