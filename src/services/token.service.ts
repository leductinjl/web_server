import jwt, { SignOptions } from 'jsonwebtoken';
import { redis } from '../config/redis.config';
import dotenv from 'dotenv';

dotenv.config();

interface TokenPayload {
  email: string;
  userId?: string;
  type: 'email_verification' | 'password_reset' | 'access' | 'refresh';
}

interface AuthTokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
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
      '10m'
    );
    
    // Store token in Redis with 10 minutes expiration
    await redis.set(
      `email_verification:${token}`,
      JSON.stringify({ email }),
      'EX',
      10 * 60
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

  static async generateAuthTokens(userId: string, email: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Generate access token (15 minutes)
    const accessToken = this.generateToken(
      { userId, email, type: 'access' },
      '15m'
    );

    // Generate refresh token (7 days)
    const refreshToken = this.generateToken(
      { userId, email, type: 'refresh' },
      '7d'
    );

    // Store refresh token in Redis
    await redis.set(
      `refresh_token:${userId}`,
      refreshToken,
      'EX',
      7 * 24 * 60 * 60 // 7 days
    );

    return { accessToken, refreshToken };
  }

  static async verifyAuthToken(token: string): Promise<AuthTokenPayload> {
    try {
      const decoded = this.verifyToken(token) as AuthTokenPayload;
      
      if (decoded.type !== 'access' && decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // For refresh tokens, verify it exists in Redis
      if (decoded.type === 'refresh') {
        const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
        if (!storedToken || storedToken !== token) {
          throw new Error('Invalid refresh token');
        }
      }

      return decoded;
    } catch (error) {
      console.error('Auth token verification error:', error);
      throw new Error('Invalid or expired token');
    }
  }

  static async revokeRefreshToken(userId: string): Promise<void> {
    await redis.del(`refresh_token:${userId}`);
  }
} 