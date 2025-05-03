import { Request, Response } from 'express';
import { pool } from '../config/database.config';
import { redis } from '../config/redis.config';

export class HealthController {
  /**
   * @swagger
   * /api/health:
   *   get:
   *     summary: Check server and services health
   *     description: Returns the status of the server and its dependencies (database, redis)
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Server and all services are healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: ok
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                 services:
   *                   type: object
   *                   properties:
   *                     database:
   *                       type: string
   *                       example: ok
   *                     redis:
   *                       type: string
   *                       example: ok
   *       500:
   *         description: Server or one of its services is not healthy
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  static async check(req: Request, res: Response) {
    try {
      // Check database connection
      await pool.query('SELECT 1');
      
      // Check Redis connection
      await redis.ping();
      
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
          database: 'ok',
          redis: 'ok'
        }
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        services: {
          database: error instanceof Error && error.message.includes('database') ? 'error' : 'ok',
          redis: error instanceof Error && error.message.includes('redis') ? 'error' : 'ok'
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 