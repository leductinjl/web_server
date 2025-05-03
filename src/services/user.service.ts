import { pool } from '../config/database.config';
import bcrypt from 'bcryptjs';

export class UserService {
  static async verifyEmail(email: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        'UPDATE users SET status = $1 WHERE email = $2',
        ['verified', email]
      );
    } finally {
      client.release();
    }
  }
} 