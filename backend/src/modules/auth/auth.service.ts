import pool from '../../config/db';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateToken } from '../../utils/jwt';
import { sendVerificationEmail, sendEmail } from '../../config/mailer';

export interface RegisterData {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface VerifyData {
  email: string;
  code: string;
}

export interface PasswordResetRequestData {
  email: string;
}

export interface PasswordResetConfirmData {
  email: string;
  code: string;
  newPassword: string;
}

export interface EmailChangeRequestData {
  newEmail: string;
}

export interface EmailChangeConfirmData {
  code: string;
  newPassword?: string; // Required if changing email
}

// Generate 6-digit verification code
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export class AuthService {
  async register(data: RegisterData) {
    const { email, password } = data;

    // Check if user exists
    const existingUserResult = await pool.query(
      `SELECT id, is_verified, verification_expires_at 
       FROM users 
       WHERE email = $1`,
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      const existingUser = existingUserResult.rows[0];
      
      // If user is verified, they already exist
      if (existingUser.is_verified) {
        throw new Error('User already exists');
      }

      // If user is unverified but code hasn't expired, don't allow re-registration
      // (they should use resend verification code endpoint instead)
      if (existingUser.verification_expires_at && new Date(existingUser.verification_expires_at) > new Date()) {
        throw new Error('Verification code already sent. Please check your email or use "Resend Code" to get a new one.');
      }

      // If user is unverified and code has expired, delete the old user and allow re-registration
      console.log(`Deleting expired unverified user: ${email}`);
      await pool.query('DELETE FROM profiles WHERE user_id = $1', [existingUser.id]);
      await pool.query('DELETE FROM users WHERE id = $1', [existingUser.id]);
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const verificationCode = generateVerificationCode();

    // Try to send verification email FIRST - only create user if email succeeds
    try {
      await sendVerificationEmail(email, verificationCode);
      console.log(`✓ Verification email sent to ${email}`);
    } catch (error) {
      console.error('✗ Failed to send verification email:', error);
      throw new Error('Failed to send verification email. Please check your email address and try again.');
    }

    // Only create user if email was sent successfully
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, verification_code, verification_expires_at)
       VALUES ($1, $2, $3, NOW() + INTERVAL '5 minutes')
       RETURNING id, email, is_verified`,
      [email, passwordHash, verificationCode]
    );

    const user = result.rows[0];

    // Create profile
    await pool.query('INSERT INTO profiles (user_id) VALUES ($1)', [user.id]);

    return {
      user: { id: user.id, email: user.email, is_verified: user.is_verified },
      verificationCode: verificationCode, // Return code in development/testing (remove in production)
    };
  }

  async login(data: LoginData) {
    const { email, password } = data;

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0];

    // Block login if not verified
    if (!user.is_verified) {
      throw new Error('Please verify your email before logging in');
    }

    // Verify password
    const isValid = await comparePassword(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT
    const token = generateToken({ userId: user.id });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        is_verified: user.is_verified,
      },
    };
  }

  async verifyEmail(data: VerifyData) {
    const { email, code } = data;

    const result = await pool.query(
      `UPDATE users 
       SET is_verified = TRUE, verification_code = NULL, verification_expires_at = NULL
       WHERE email = $1 AND verification_code = $2 AND verification_expires_at > NOW()
       RETURNING id`,
      [email, code]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired verification code');
    }

    // Generate token after verification
    const token = generateToken({ userId: result.rows[0].id });

    return { 
      message: 'Email verified successfully',
      token,
    };
  }

  async resendVerificationCode(data: { email: string }) {
    const { email } = data;

    // Find unverified user
    const result = await pool.query(
      `SELECT id, is_verified FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];

    // If user is already verified, no need to resend
    if (user.is_verified) {
      throw new Error('Email already verified');
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();

    // Try to send verification email
    try {
      await sendVerificationEmail(email, verificationCode);
      console.log(`✓ Verification email resent to ${email}`);
    } catch (error) {
      console.error('✗ Failed to send verification email:', error);
      throw new Error('Failed to send verification email. Please check your email address and try again.');
    }

    // Update user with new code and expiry
    await pool.query(
      `UPDATE users 
       SET verification_code = $1, verification_expires_at = NOW() + INTERVAL '5 minutes'
       WHERE email = $2`,
      [verificationCode, email]
    );

    return {
      message: 'Verification code resent successfully. Please check your email.',
      verificationCode: verificationCode, // Return code in development/testing
    };
  }

  async requestPasswordReset(data: PasswordResetRequestData) {
    const { email } = data;

    // Find user
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset code has been sent' };
    }

    const resetCode = generateVerificationCode();

    // Store reset code (10 minutes expiry)
    await pool.query(
      `UPDATE users 
       SET password_reset_code = $1, password_reset_expires_at = NOW() + INTERVAL '10 minutes'
       WHERE email = $2`,
      [resetCode, email]
    );

    // Send email (non-blocking)
    const html = `
      <h1>Reset your LifeOS password</h1>
      <p>Your verification code is: <strong>${resetCode}</strong></p>
      <p>This code expires in 10 minutes.</p>
    `;

    sendEmail({
      to: email,
      subject: 'Reset your LifeOS password',
      html,
      text: `Reset your LifeOS password\n\nYour verification code is: ${resetCode}\n\nThis code expires in 10 minutes.`,
    }).catch((error) => {
      console.error('Failed to send password reset email:', error);
      console.warn('⚠️  Password reset code generated but email not sent. Code:', resetCode);
    });

    return { message: 'If the email exists, a reset code has been sent' };
  }

  async confirmPasswordReset(data: PasswordResetConfirmData) {
    const { email, code, newPassword } = data;

    // Find user with valid reset code
    const result = await pool.query(
      `SELECT id FROM users 
       WHERE email = $1 
       AND password_reset_code = $2 
       AND password_reset_expires_at > NOW()`,
      [email, code]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired reset code');
    }

    const userId = result.rows[0].id;

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and clear reset fields
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, 
           password_reset_code = NULL, 
           password_reset_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, userId]
    );

    return { message: 'Password reset successfully. Please log in again.' };
  }

  async requestEmailChange(userId: string, data: EmailChangeRequestData) {
    const { newEmail } = data;

    // Check if new email is already taken
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [newEmail]);
    if (existingUser.rows.length > 0) {
      throw new Error('Email already in use');
    }

    // Get current email
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const currentEmail = userResult.rows[0].email;
    const changeCode = generateVerificationCode();

    // Store change code (10 minutes expiry)
    await pool.query(
      `UPDATE users 
       SET email_change_code = $1, 
           email_change_new_email = $2, 
           email_change_expires_at = NOW() + INTERVAL '10 minutes'
       WHERE id = $3`,
      [changeCode, newEmail, userId]
    );

    // Send email to new address (non-blocking)
    const html = `
      <h1>Confirm your new email address</h1>
      <p>You requested to change your LifeOS email from ${currentEmail} to ${newEmail}.</p>
      <p>Your verification code is: <strong>${changeCode}</strong></p>
      <p>This code expires in 10 minutes.</p>
      <p><strong>Note:</strong> After confirming, you will be logged out on all devices for security.</p>
    `;

    sendEmail({
      to: newEmail,
      subject: 'Confirm your new LifeOS email address',
      html,
      text: `Confirm your new email address\n\nYou requested to change your LifeOS email from ${currentEmail} to ${newEmail}.\n\nYour verification code is: ${changeCode}\n\nThis code expires in 10 minutes.\n\nNote: After confirming, you will be logged out on all devices for security.`,
    }).catch((error) => {
      console.error('Failed to send email change verification:', error);
      console.warn('⚠️  Email change code generated but email not sent. Code:', changeCode);
    });

    return { message: 'Verification code sent to new email address' };
  }

  async confirmEmailChange(userId: string, data: EmailChangeConfirmData) {
    const { code } = data;

    // Find user with valid change code
    const result = await pool.query(
      `SELECT email_change_new_email FROM users 
       WHERE id = $1 
       AND email_change_code = $2 
       AND email_change_expires_at > NOW()`,
      [userId, code]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid or expired verification code');
    }

    const newEmail = result.rows[0].email_change_new_email;

    // Update email and clear change fields
    await pool.query(
      `UPDATE users 
       SET email = $1, 
           email_change_code = NULL, 
           email_change_new_email = NULL, 
           email_change_expires_at = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [newEmail, userId]
    );

    return { 
      message: 'Email changed successfully. Please log in again with your new email.',
      newEmail,
    };
  }
}
