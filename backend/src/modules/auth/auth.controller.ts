import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from './auth.service';
import { AuthRequest } from '../../middleware/auth.middleware';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await authService.register(req.body);
      
      // Remove verificationCode from response in production (security)
      const { verificationCode, ...responseData } = result as any;
      const response: any = {
        message: 'User created successfully. Please check your email for verification code.',
        ...responseData,
      };
      
      // Only include code in development (for testing)
      if (process.env.NODE_ENV !== 'production' && verificationCode) {
        response.verificationCode = verificationCode;
        response.message = 'User created successfully. Verification code: ' + verificationCode;
      }
      
      res.status(201).json(response);
    } catch (error: any) {
      console.error('Registration error:', error);
      const status = error.message === 'User already exists' ? 400 : 500;
      res.status(status).json({ error: error.message || 'Failed to register user' });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await authService.login(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Login error:', error);
      const status = error.message === 'Invalid credentials' ? 401 : 
                     error.message.includes('verify') ? 403 : 500;
      res.status(status).json({ error: error.message || 'Failed to login' });
    }
  }

  async verifyEmail(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await authService.verifyEmail(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Verification error:', error);
      const status = error.message.includes('Invalid') ? 400 : 500;
      res.status(status).json({ error: error.message || 'Failed to verify email' });
    }
  }

  async resendVerificationCode(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await authService.resendVerificationCode(req.body);
      
      // Remove verificationCode from response in production (security)
      const { verificationCode, ...responseData } = result as any;
      const response: any = {
        message: 'Verification code resent successfully. Please check your email.',
        ...responseData,
      };
      
      // Only include code in development (for testing)
      if (process.env.NODE_ENV !== 'production' && verificationCode) {
        response.verificationCode = verificationCode;
        response.message = 'Verification code resent. Code: ' + verificationCode;
      }
      
      res.json(response);
    } catch (error: any) {
      console.error('Resend verification error:', error);
      const status = error.message === 'User not found' ? 404 : 
                     error.message === 'Email already verified' ? 400 : 500;
      res.status(status).json({ error: error.message || 'Failed to resend verification code' });
    }
  }

  async requestPasswordReset(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await authService.requestPasswordReset(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Password reset request error:', error);
      res.status(500).json({ error: error.message || 'Failed to request password reset' });
    }
  }

  async confirmPasswordReset(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await authService.confirmPasswordReset(req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Password reset confirm error:', error);
      const status = error.message.includes('Invalid') ? 400 : 500;
      res.status(status).json({ error: error.message || 'Failed to reset password' });
    }
  }

  async requestEmailChange(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const result = await authService.requestEmailChange(req.userId, req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Email change request error:', error);
      const status = error.message === 'Email already in use' ? 400 : 500;
      res.status(status).json({ error: error.message || 'Failed to request email change' });
    }
  }

  async confirmEmailChange(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const result = await authService.confirmEmailChange(req.userId, req.body);
      res.json(result);
    } catch (error: any) {
      console.error('Email change confirm error:', error);
      const status = error.message.includes('Invalid') ? 400 : 500;
      res.status(status).json({ error: error.message || 'Failed to change email' });
    }
  }
}
