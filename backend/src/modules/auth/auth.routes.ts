import express from 'express';
import { body } from 'express-validator';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = express.Router();
const authController = new AuthController();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
  ],
  (req, res) => authController.register(req, res)
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  (req, res) => authController.login(req, res)
);

router.post(
  '/verify',
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 }).isNumeric(),
  ],
  (req, res) => authController.verifyEmail(req, res)
);

router.post(
  '/resend-verification',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  (req, res) => authController.resendVerificationCode(req, res)
);

router.post(
  '/password-reset/request',
  [
    body('email').isEmail().normalizeEmail(),
  ],
  (req, res) => authController.requestPasswordReset(req, res)
);

router.post(
  '/password-reset/confirm',
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 }).isNumeric(),
    body('newPassword').isLength({ min: 8 }),
  ],
  (req, res) => authController.confirmPasswordReset(req, res)
);

router.post(
  '/email-change/request',
  authenticate,
  [
    body('newEmail').isEmail().normalizeEmail(),
  ],
  (req, res) => authController.requestEmailChange(req, res)
);

router.post(
  '/email-change/confirm',
  authenticate,
  [
    body('code').isLength({ min: 6, max: 6 }).isNumeric(),
  ],
  (req, res) => authController.confirmEmailChange(req, res)
);

export default router;
