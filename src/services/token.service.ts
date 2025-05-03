import jwt, { SignOptions } from 'jsonwebtoken';
import { redis } from '../config/redis.config.js';
import dotenv from 'dotenv';

dotenv.config();

interface TokenPayload {
  email: string;
  type: 'email_verification' | 'password_reset';
}

export class TokenService {
  private static generateToken(payload: TokenPayload, expiresIn: SignOptions['expiresIn']): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
  }

  private static verifyToken(token: string): TokenPayload {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }
    return jwt.verify(token, process.env.JWT_SECRET) as TokenPayload;
  }

  static async generateEmailToken(email: string): Promise<string> {
    const token = this.generateToken(
      { email, type: 'email_verification' },
      '24h'
    );
    
    // Store token in Redis with 24h expiration
    await redis.set(
      `email_verification:${token}`,
      JSON.stringify({ email }),
      'EX',
      24 * 60 * 60
    );
    
    return token;
  }

  static async verifyEmailToken(token: string): Promise<{ email: string }> {
    try {
      // Verify JWT token first
      const decoded = this.verifyToken(token);
      
      if (decoded.type !== 'email_verification') {
        throw new Error('Invalid token type');
      }

      // Check if token exists in Redis
      const storedData = await redis.get(`email_verification:${token}`);
      if (!storedData) {
        throw new Error('Token not found or expired');
      }

      const { email } = JSON.parse(storedData);
      
      // Verify email matches
      if (decoded.email !== email) {
        throw new Error('Token email mismatch');
      }

      // Delete used token
      await redis.del(`email_verification:${token}`);

      return { email };
    } catch (error) {
      console.error('Token verification error:', error);
      throw new Error('Invalid or expired token');
    }
  }

  static async deleteEmailToken(token: string): Promise<void> {
    await redis.del(`email_verification:${token}`);
  }

  static async generatePasswordResetToken(email: string): Promise<string> {
    const token = this.generateToken(
      { email, type: 'password_reset' },
      '1h'
    );
    
    // Store token in Redis with 1h expiration
    await redis.set(
      `password_reset:${token}`,
      JSON.stringify({ email }),
      'EX',
      60 * 60
    );
    
    return token;
  }

  static async verifyPasswordResetToken(token: string): Promise<{ email: string }> {
    try {
      // Verify JWT token first
      const decoded = this.verifyToken(token);
      
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }

      // Check if token exists in Redis
      const storedData = await redis.get(`password_reset:${token}`);
      if (!storedData) {
        throw new Error('Token not found or expired');
      }

      const { email } = JSON.parse(storedData);
      
      // Verify email matches
      if (decoded.email !== email) {
        throw new Error('Token email mismatch');
      }

      return { email };
    } catch (error) {
      console.error('Token verification error:', error);
      throw new Error('Invalid or expired token');
    }
  }

  static async deletePasswordResetToken(token: string): Promise<void> {
    await redis.del(`password_reset:${token}`);
  }
} 