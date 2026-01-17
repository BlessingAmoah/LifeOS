import express from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import { UsersController } from './users.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();
const usersController = new UsersController();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Get profile
router.get('/', authenticate, (req, res) => usersController.getProfile(req as any, res));

// Update profile
router.put(
  '/',
  authenticate,
  [
    body('full_name').optional().isString(),
    body('location').optional().isString(),
    body('timezone').optional().isString(),
    body('phone_numbers').optional().isArray(),
    body('phone_numbers.*').optional().isString(),
    body('identity_statement').optional().isString(),
    body('vision_short_term').optional().isString(),
    body('vision_long_term').optional().isString(),
    body('core_values').optional().isArray(),
    body('core_values.*').optional().isString(),
  ],
  (req, res) => usersController.updateProfile(req as any, res)
);

// Upload avatar
router.post(
  '/avatar',
  authenticate,
  upload.single('avatar'),
  (req, res) => usersController.uploadAvatar(req as any, res)
);

export default router;
