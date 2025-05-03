import { Pool } from 'pg';
import { pool } from '../config/database.config';

export interface IUser {
  id: string;
  fullName: string;
  email: string;
  password: string;
  phone: string;
  status: 'unverified' | 'verified';
  verificationToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UserModel {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async createUser(user: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    const query = `
      INSERT INTO users (full_name, email, password, phone, status, verification_token)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, full_name, email, phone, status, verification_token, created_at, updated_at
    `;

    const values = [
      user.fullName,
      user.email,
      user.password,
      user.phone,
      user.status,
      user.verificationToken
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToUser(result.rows[0]);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.pool.query(query, [email]);
    return result.rows.length ? this.mapRowToUser(result.rows[0]) : null;
  }

  async findByPhone(phone: string): Promise<IUser | null> {
    const query = 'SELECT * FROM users WHERE phone = $1';
    const result = await this.pool.query(query, [phone]);
    return result.rows.length ? this.mapRowToUser(result.rows[0]) : null;
  }

  async updateVerificationToken(userId: string, verificationToken: string): Promise<void> {
    const query = `
      UPDATE users 
      SET verification_token = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    await this.pool.query(query, [verificationToken, userId]);
  }

  private mapRowToUser(row: any): IUser {
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      password: row.password,
      phone: row.phone,
      status: row.status,
      verificationToken: row.verification_token,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
} 