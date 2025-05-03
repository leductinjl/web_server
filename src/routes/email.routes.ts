import express from 'express';
import { EmailService } from '../services/email.service';
import { TokenService } from '../services/token.service';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database.config';
import { EmailController } from '../controllers/email.controller';

const router = express.Router();
const emailService = new EmailService();

/**
 * @swagger
 * /api/email/verify-email:
 *   get:
 *     summary: Verify user's email address
 *     description: Verify a user's email address using the verification token sent to their email
 *     tags: [Email]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Verification token sent to user's email
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Email verified successfully
 *       400:
 *         description: Invalid or missing token
 *       500:
 *         description: Server error
 */

// Email Verification Route
router.get('/verify-email', EmailController.verifyEmail);

/**
 * @swagger
 * /api/email/reset-password-request:
 *   post:
 *     summary: Request password reset
 *     description: Send a password reset email to the user's email address
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset email sent
 *       400:
 *         description: Invalid or missing email
 *       500:
 *         description: Server error
 */

// Password Reset Request Route
router.post('/reset-password-request', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const userResult = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const token = await TokenService.generatePasswordResetToken(user.email);
    await emailService.sendPasswordResetEmail(user.email, token);
    
    return res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

/**
 * @swagger
 * /api/email/reset-password:
 *   post:
 *     summary: Reset password with token
 *     description: Reset user's password using the token received in email
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token received in email
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password to set
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset successfully
 *       400:
 *         description: Invalid or missing token/password
 *       500:
 *         description: Server error
 */

// Password Reset Route (with token)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Verify token and get user info
    const { email } = await TokenService.verifyPasswordResetToken(token);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hashedPassword, email]
    );

    // Delete used token
    await TokenService.deletePasswordResetToken(token);
    
    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router; 