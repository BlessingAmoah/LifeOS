import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../context/AuthContext';
import VerificationModal from '../components/VerificationModal';
import Footer from '../components/Footer';
import './Auth.css';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}

const Register = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { register, handleSubmit, formState: { errors }, watch, getValues } = useForm<RegisterForm>();
  const [error, setError] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const password = watch('password');

  const [resendingCode, setResendingCode] = useState(false);

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('');
      
      if (data.password !== data.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      // Set email first so it's available for error handling
      setRegisteredEmail(data.email);

      await api.post('/auth/register', {
        email: data.email,
        password: data.password,
      });

      // Show verification modal instead of logging in
      setShowVerificationModal(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Registration failed';
      setError(errorMessage);
      
      // If error mentions resend, show verification modal with resend option
      const lowerError = errorMessage.toLowerCase();
      if (lowerError.includes('resend') || lowerError.includes('already sent') || lowerError.includes('verification code already')) {
        // Email is already set above, just open modal
        setShowVerificationModal(true);
      }
    }
  };

  const handleVerificationSuccess = (token?: string) => {
    if (token) {
      // Get user info and set auth
      api.get('/profiles').then(() => {
        setAuth({ id: '', email: registeredEmail, is_verified: true }, token);
        navigate('/dashboard');
      }).catch(() => {
        // If profile doesn't exist yet, just set basic auth
        setAuth({ id: '', email: registeredEmail, is_verified: true }, token);
        navigate('/dashboard');
      });
    } else {
      // Just close modal, user can login
      setShowVerificationModal(false);
      navigate('/login');
    }
  };

  return (
    <>
      <div className="auth-container">
        <div className="auth-card">
          <h1><strong>LifeOS</strong></h1>
          <h2>Create Account</h2>
          {error && (
            <div className="error-message">
              {error}
              {(() => {
                const lowerError = error.toLowerCase();
                return lowerError.includes('resend') || lowerError.includes('already sent') || lowerError.includes('verification code already');
              })() && (
                <div style={{ marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      const email = registeredEmail || getValues('email');
                      if (email) {
                        setRegisteredEmail(email);
                        setResendingCode(true);
                        try {
                          await api.post('/auth/resend-verification', { email });
                          setError('');
                          alert('Verification code resent! Please check your email.');
                          setShowVerificationModal(true);
                        } catch (err: any) {
                          setError(err.response?.data?.error || 'Failed to resend verification code');
                        } finally {
                          setResendingCode(false);
                        }
                      }
                    }}
                    disabled={resendingCode}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: resendingCode ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      marginRight: '0.5rem'
                    }}
                  >
                    {resendingCode ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />
              {errors.email && <span className="error-text">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  }
                })}
              />
              {errors.password && <span className="error-text">{errors.password.message}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                {...register('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword.message}</span>}
            </div>

            <button type="submit" className="auth-button">
              Sign Up
            </button>
          </form>

          <p className="auth-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>

      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        email={registeredEmail}
        onSuccess={handleVerificationSuccess}
        title="Verify Your Email"
        message="We've sent a 6-digit verification code to your email. Please enter it below to complete your registration."
          />
          <Footer />
        </>
      );
    };
    
    export default Register;
