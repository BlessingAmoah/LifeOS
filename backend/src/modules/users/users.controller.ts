import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { UsersService } from './users.service';
import { AuthRequest } from '../../middleware/auth.middleware';

const usersService = new UsersService();

export class UsersController {
  async getProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const profile = await usersService.getProfile(req.userId);
      res.json(profile);
    } catch (error: any) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: error.message || 'Failed to get profile' });
    }
  }

  async updateProfile(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const profile = await usersService.updateProfile(req.userId, req.body);
      res.json(profile);
    } catch (error: any) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
  }

  async uploadAvatar(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const profileImageUrl = await usersService.uploadAvatar(req.userId, req.file);
      res.json({ profileImageUrl });
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      const status = error.message.includes('Invalid') || error.message.includes('size') ? 400 : 500;
      res.status(status).json({ error: error.message || 'Failed to upload avatar' });
    }
  }
}
