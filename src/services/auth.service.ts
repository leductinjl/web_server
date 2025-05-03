import bcrypt from 'bcryptjs';
import { UserModel, IUser } from '../models/user.model';
import { EmailService } from './email.service';
import { TokenService } from './token.service';
import dotenv from 'dotenv';

dotenv.config();

export class AuthService {
  private userModel: UserModel;
  private emailService: EmailService;

  constructor() {
    this.userModel = new UserModel();
    this.emailService = new EmailService();
  }

  async registerUser(userData: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
  }): Promise<void> {
    // Check if email already exists
    const existingUserByEmail = await this.userModel.findByEmail(userData.email);
    if (existingUserByEmail) {
      throw new Error('Email already exists');
    }

    // Check if phone already exists
    const existingUserByPhone = await this.userModel.findByPhone(userData.phone);
    if (existingUserByPhone) {
      throw new Error('Phone number already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Generate verification token
    const verificationToken = await TokenService.generateEmailToken(userData.email);

    // Create user in database
    await this.userModel.createUser({
      fullName: userData.fullName,
      email: userData.email,
      password: hashedPassword,
      phone: userData.phone,
      status: 'unverified',
      verificationToken,
    });

    // Send verification email
    await this.emailService.sendVerificationEmail(userData.email, verificationToken);
  }

  async login(email: string, password: string): Promise<{ 
    accessToken: string; 
    refreshToken: string;
    user: Omit<IUser, 'password'>;
  }> {
    // Find user by email
    const user = await this.userModel.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if account is verified
    if (user.status === 'unverified') {
      // Generate new verification token
      const verificationToken = await TokenService.generateEmailToken(user.email);
      
      // Update user's verification token
      await this.userModel.updateVerificationToken(user.id, verificationToken);
      
      // Send new verification email
      await this.emailService.sendVerificationEmail(user.email, verificationToken);
      
      throw new Error('Account not verified. A new verification email has been sent.');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate auth tokens
    const { accessToken, refreshToken } = await TokenService.generateAuthTokens(user.id, user.email);

    // Return user info (excluding password) and tokens
    const { password: _, ...userWithoutPassword } = user;
    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = await TokenService.verifyAuthToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Generate new tokens
      return await TokenService.generateAuthTokens(decoded.userId, decoded.email);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await TokenService.revokeRefreshToken(userId);
  }
} 