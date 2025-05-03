import { Pool } from 'pg';
import { pool } from '../config/database.config';

export interface IEmailVerificationToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export class EmailVerificationTokenModel {
  private pool: Pool;

  constructor() {
    this.pool = pool;
  }

  async createToken(userId: string, token: string, expiresAt: Date): Promise<IEmailVerificationToken> {
    const query = `
      INSERT INTO email_verification_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, token, expires_at, created_at
    `;

    const values = [userId, token, expiresAt];
    const result = await this.pool.query(query, values);
    return this.mapRowToToken(result.rows[0]);
  }

  async findByToken(token: string): Promise<IEmailVerificationToken | null> {
    const query = 'SELECT * FROM email_verification_tokens WHERE token = $1';
    const result = await this.pool.query(query, [token]);
    return result.rows.length ? this.mapRowToToken(result.rows[0]) : null;
  }

  async deleteToken(token: string): Promise<void> {
    const query = 'DELETE FROM email_verification_tokens WHERE token = $1';
    await this.pool.query(query, [token]);
  }

  private mapRowToToken(row: any): IEmailVerificationToken {
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: row.expires_at,
      createdAt: row.created_at
    };
  }
} 