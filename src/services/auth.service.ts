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
} 