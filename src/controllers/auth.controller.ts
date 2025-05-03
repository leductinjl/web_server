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
} 