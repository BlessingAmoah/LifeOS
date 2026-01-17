import { useState } from 'react';
import api from '../services/api';
import './VerificationModal.css';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onSuccess: (token?: string, code?: string) => void;
  title?: string;
  message?: string;
  onSubmitCode?: (code: string) => Promise<void>; // Custom handler for non-standard flows
}

const VerificationModal = ({
  isOpen,
  onClose,
  email,
  onSuccess,
  title = 'Verify Your Email',
  message = 'Enter the 6-digit verification code sent to your email',
  onSubmitCode,
}: VerificationModalProps) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (onSubmitCode) {
        // Custom handler (for password reset, email change)
        await onSubmitCode(code);
        onSuccess(undefined, code);
      } else {
        // Standard email verification
        const response = await api.post('/auth/verify', { email, code });
        onSuccess(response.data.token, code);
      }
      setCode('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
  };

  const handleResendCode = async () => {
    if (!email) return;
    
    setResending(true);
    setError('');
    try {
      await api.post('/auth/resend-verification', { email });
      alert('Verification code resent! Please check your email.');
      setCode(''); // Clear the code input
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend verification code');
    } finally {
      setResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>{title}</h2>
        <p className="modal-message">{message}</p>
        <p className="modal-email">{email}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="code">Verification Code</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={handleCodeChange}
              placeholder="000000"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              autoFocus
              className="code-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
            <button type="submit" className="btn btn-primary" disabled={loading || code.length !== 6}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
            
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resending}
              className="btn btn-secondary"
              style={{
                background: 'transparent',
                border: '1px solid #667eea',
                color: '#667eea',
                padding: '0.5rem 1rem',
                cursor: resending ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem'
              }}
            >
              {resending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerificationModal;
