import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { useAuthStore } from '../context/AuthContext';
import VerificationModal from '../components/VerificationModal';
import Tabs from '../components/Tabs';
import ErrorMessage from '../components/ErrorMessage';
import './Profile.css';

interface ProfileData {
  fullName?: string | null;
  full_name?: string | null; // Backend returns snake_case
  preferredName?: string | null;
  preferred_name?: string | null;
  email: string;
  location: string | null;
  timezone: string | null;
  phoneNumbers?: string[];
  phone_numbers?: string[]; // Backend returns snake_case
  identityStatement?: string | null;
  identity_statement?: string | null; // Backend returns snake_case
  lifePillars?: string[];
  life_pillars?: string[];
  personalRules?: string[];
  personal_rules?: string[];
  strengths?: string[];
  strengths_backend?: string[];
  growthAreas?: string[];
  growth_areas?: string[];
  visionShortTerm?: string | null;
  vision_short_term?: string | null; // Backend returns snake_case
  visionCurrentFocusTheme?: string | null;
  vision_current_focus_theme?: string | null;
  visionTopPriorities?: string[];
  vision_top_priorities?: string[];
  visionSeasonOfLife?: string | null;
  vision_season_of_life?: string | null;
  visionLongTerm?: string | null;
  vision_long_term?: string | null; // Backend returns snake_case
  visionCareer?: string | null;
  vision_career?: string | null;
  visionLifestyle?: string | null;
  vision_lifestyle?: string | null;
  visionFinancial?: string | null;
  vision_financial?: string | null;
  visionSpiritual?: string | null;
  vision_spiritual?: string | null;
  coreValues?: string[];
  core_values?: string[]; // Backend returns snake_case
  profileImageUrl?: string | null;
  profile_image_url?: string | null; // Backend returns snake_case
}

const Profile = () => {
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [emailChangeStep, setEmailChangeStep] = useState<'request' | 'confirm'>('request');
  const [newEmail, setNewEmail] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationType, setVerificationType] = useState<'password' | 'email'>('password');
  const [activeTab, setActiveTab] = useState<'account' | 'contact' | 'password' | 'avatar'>('account');

  const { data: profile, isLoading, error, refetch } = useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: () => api.get('/profiles').then(res => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<ProfileData>) => {
      // Convert camelCase to snake_case for backend
      const backendData: any = {};
      if (data.fullName !== undefined) backendData.full_name = data.fullName;
      if (data.preferredName !== undefined) backendData.preferred_name = data.preferredName;
      if (data.location !== undefined) backendData.location = data.location;
      if (data.timezone !== undefined) backendData.timezone = data.timezone;
      if (data.phoneNumbers !== undefined) backendData.phone_numbers = data.phoneNumbers;
      if (data.identityStatement !== undefined) backendData.identity_statement = data.identityStatement;
      if (data.lifePillars !== undefined) backendData.life_pillars = data.lifePillars;
      if (data.personalRules !== undefined) backendData.personal_rules = data.personalRules;
      if (data.strengths !== undefined) backendData.strengths = data.strengths;
      if (data.growthAreas !== undefined) backendData.growth_areas = data.growthAreas;
      if (data.visionShortTerm !== undefined) backendData.vision_short_term = data.visionShortTerm;
      if (data.visionCurrentFocusTheme !== undefined) backendData.vision_current_focus_theme = data.visionCurrentFocusTheme;
      if (data.visionTopPriorities !== undefined) backendData.vision_top_priorities = data.visionTopPriorities;
      if (data.visionSeasonOfLife !== undefined) backendData.vision_season_of_life = data.visionSeasonOfLife;
      if (data.visionLongTerm !== undefined) backendData.vision_long_term = data.visionLongTerm;
      if (data.visionCareer !== undefined) backendData.vision_career = data.visionCareer;
      if (data.visionLifestyle !== undefined) backendData.vision_lifestyle = data.visionLifestyle;
      if (data.visionFinancial !== undefined) backendData.vision_financial = data.visionFinancial;
      if (data.visionSpiritual !== undefined) backendData.vision_spiritual = data.visionSpiritual;
      if (data.coreValues !== undefined) backendData.core_values = data.coreValues;
      return api.put('/profiles', backendData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      alert('Profile updated successfully!');
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      return api.post('/profiles/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      alert('Profile picture updated!');
    },
  });

  const passwordResetRequestMutation = useMutation({
    mutationFn: (email: string) => api.post('/auth/password-reset/request', { email }),
    onSuccess: () => {
      setVerificationType('password');
      setShowVerificationModal(true);
    },
  });

  const passwordResetConfirmMutation = useMutation({
    mutationFn: (data: { email: string; code: string; newPassword: string }) =>
      api.post('/auth/password-reset/confirm', data),
    onSuccess: () => {
      alert('Password reset successfully! You will be logged out for security.');
      logout();
      window.location.href = '/login';
    },
  });

  const emailChangeRequestMutation = useMutation({
    mutationFn: (newEmail: string) => api.post('/auth/email-change/request', { newEmail }),
    onSuccess: () => {
      setEmailChangeStep('confirm');
      setVerificationType('email');
      setShowVerificationModal(true);
    },
  });

  const emailChangeConfirmMutation = useMutation({
    mutationFn: (code: string) => api.post('/auth/email-change/confirm', { code }),
    onSuccess: () => {
      alert('Email changed successfully! You will be logged out on all devices for security.');
      logout();
      window.location.href = '/login';
    },
  });

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      avatarMutation.mutate(file);
    }
  };

  const handlePasswordReset = () => {
    if (profile?.email) {
      passwordResetRequestMutation.mutate(profile.email);
    }
  };

  const handleEmailChangeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    emailChangeRequestMutation.mutate(newEmail);
  };

  const handleVerificationSuccess = (_token?: string, code?: string) => {
    if (!code) return;
    
    if (verificationType === 'password') {
      const newPassword = prompt('Enter your new password (min 8 characters):');
      if (newPassword && newPassword.length >= 8) {
        passwordResetConfirmMutation.mutate({
          email: profile?.email || '',
          code,
          newPassword,
        });
      }
    } else if (verificationType === 'email') {
      emailChangeConfirmMutation.mutate(code);
    }
    setShowVerificationModal(false);
  };

  const handlePasswordResetCode = async (code: string) => {
    // Just validate the code format, actual reset happens in handleVerificationSuccess
    if (code.length !== 6) {
      throw new Error('Code must be 6 digits');
    }
  };

  const handleEmailChangeCode = async (code: string) => {
    // Just validate the code format, actual change happens in handleVerificationSuccess
    if (code.length !== 6) {
      throw new Error('Code must be 6 digits');
    }
  };

  if (isLoading) return <div className="profile-loading">Loading profile...</div>;
  if (error) {
    return <ErrorMessage message="Failed to load profile" onRetry={() => { void refetch(); }} />;
  }

  const tabs = [
    { id: 'account', label: 'Account Info', icon: '👤' },
    { id: 'contact', label: 'Contact Info', icon: '📞' },
    { id: 'password', label: 'Password Reset', icon: '🔒' },
    { id: 'avatar', label: 'Avatar Upload', icon: '🖼️' },
  ];

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-picture-section">
          <div className="profile-picture-wrapper">
            {(profile?.profileImageUrl || profile?.profile_image_url) ? (
              <img src={String(profile.profileImageUrl || profile.profile_image_url || '')} alt="Profile" className="profile-picture" />
            ) : (
              <div className="profile-picture-placeholder">
                {(profile?.fullName || profile?.full_name)?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
          <div className="profile-name-section">
            <h1>{profile?.fullName || profile?.full_name || 'Your Name'}</h1>
            <p className="profile-email">{profile?.email}</p>
            {profile?.location && <p className="profile-location">📍 {profile.location}</p>}
            {profile?.timezone && <p className="profile-timezone">🕐 {profile.timezone}</p>}
          </div>
        </div>
      </div>

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as typeof activeTab)} />

      <div className="profile-content">
        {activeTab === 'account' && (
          <AccountSection
            profile={profile}
            updateMutation={updateMutation}
            onEmailChange={() => setShowEmailChange(true)}
          />
        )}

        {activeTab === 'contact' && (
          <ContactSection
            profile={profile}
            updateMutation={updateMutation}
          />
        )}

        {activeTab === 'password' && (
          <PasswordSection
            onPasswordReset={handlePasswordReset}
          />
        )}

        {activeTab === 'avatar' && (
          <AvatarSection
            profile={profile}
            onAvatarUpload={handleAvatarUpload}
            avatarMutation={avatarMutation}
          />
        )}
      </div>

      {showEmailChange && (
        <EmailChangeModal
          onClose={() => {
            setShowEmailChange(false);
            setNewEmail('');
            setEmailChangeStep('request');
          }}
          onSubmit={handleEmailChangeRequest}
          newEmail={newEmail}
          setNewEmail={setNewEmail}
          step={emailChangeStep}
        />
      )}

      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
        }}
        email={verificationType === 'password' ? profile?.email || '' : newEmail}
        onSuccess={(token, code) => handleVerificationSuccess(token, code)}
        onSubmitCode={
          verificationType === 'password'
            ? handlePasswordResetCode
            : verificationType === 'email'
            ? handleEmailChangeCode
            : undefined
        }
        title={
          verificationType === 'password'
            ? 'Verify Password Reset'
            : 'Verify Email Change'
        }
        message={
          verificationType === 'password'
            ? 'Enter the 6-digit code sent to your email. After verification, you will be asked to enter your new password.'
            : 'Enter the 6-digit code sent to your new email address'
        }
      />
    </div>
  );
};

// Account Section Component
const AccountSection = ({
  profile,
  updateMutation,
  onEmailChange,
}: {
  profile: ProfileData | undefined;
  updateMutation: any;
  onEmailChange: () => void;
}) => {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      fullName: profile?.fullName || profile?.full_name || '',
      preferredName: profile?.preferredName || profile?.preferred_name || '',
      location: profile?.location || '',
      timezone: profile?.timezone || '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        fullName: profile.fullName || profile.full_name || '',
        preferredName: profile.preferredName || profile.preferred_name || '',
        location: profile.location || '',
        timezone: profile.timezone || '',
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: any) => {
    updateMutation.mutate({
      fullName: data.fullName,
      preferredName: data.preferredName,
      location: data.location,
      timezone: data.timezone,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
      <div className="form-group">
        <label>Full Name</label>
        <input type="text" {...register('fullName')} />
      </div>

      <div className="form-group">
        <label>Preferred Name</label>
        <input type="text" {...register('preferredName')} placeholder="Name you prefer to be called" />
      </div>

      <div className="form-group">
        <label>Email</label>
        <input type="email" value={profile?.email || ''} disabled className="read-only" />
        <button type="button" className="link-button" onClick={onEmailChange}>
          Change Email
        </button>
      </div>

      <div className="form-group">
        <label>Location</label>
        <input type="text" {...register('location')} placeholder="City, Country" />
      </div>

      <div className="form-group">
        <label>Timezone</label>
        <select {...register('timezone')}>
          <option value="">Select timezone</option>
          <option value="America/New_York">Eastern Time (ET)</option>
          <option value="America/Chicago">Central Time (CT)</option>
          <option value="America/Denver">Mountain Time (MT)</option>
          <option value="America/Los_Angeles">Pacific Time (PT)</option>
          <option value="Europe/London">London (GMT)</option>
          <option value="Europe/Paris">Paris (CET)</option>
          <option value="Asia/Tokyo">Tokyo (JST)</option>
          <option value="Asia/Shanghai">Shanghai (CST)</option>
        </select>
      </div>

      <button type="submit" className="btn-primary">
        Save Changes
      </button>
    </form>
  );
};

// Contact Section Component
const ContactSection = ({
  profile,
  updateMutation,
}: {
  profile: ProfileData | undefined;
  updateMutation: any;
}) => {
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(
    profile?.phoneNumbers || profile?.phone_numbers || []
  );

  useEffect(() => {
    if (profile) {
      setPhoneNumbers(profile.phoneNumbers || profile.phone_numbers || []);
    }
  }, [profile]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ phoneNumbers });
  };

  const addPhoneNumber = () => {
    setPhoneNumbers([...phoneNumbers, '']);
  };

  const removePhoneNumber = (index: number) => {
    setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
  };

  const updatePhoneNumber = (index: number, value: string) => {
    const updated = [...phoneNumbers];
    updated[index] = value;
    setPhoneNumbers(updated);
  };

  return (
    <form onSubmit={onSubmit} className="profile-form">
      <div className="form-group">
        <label>Phone Numbers</label>
        {phoneNumbers.map((phone, index) => (
          <div key={index} className="phone-number-row">
            <input
              type="tel"
              value={phone}
              onChange={(e) => updatePhoneNumber(index, e.target.value)}
              placeholder="+1-234-567-8900"
            />
            <button
              type="button"
              onClick={() => removePhoneNumber(index)}
              className="remove-button"
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={addPhoneNumber} className="add-button">
          + Add Phone Number
        </button>
      </div>

      <button type="submit" className="btn-primary">
        Save Changes
      </button>
    </form>
  );
};

// Password Section Component
const PasswordSection = ({
  onPasswordReset,
}: {
  onPasswordReset: () => void;
}) => {
  return (
    <div className="profile-form">
      <div className="form-group">
        <h3>Password Reset</h3>
        <p>To reset your password, click the button below. You will receive a verification code via email.</p>
      </div>
      <button type="button" className="btn-primary" onClick={onPasswordReset}>
        Reset Password
      </button>
    </div>
  );
};

// Avatar Section Component
const AvatarSection = ({
  profile,
  onAvatarUpload,
  avatarMutation,
}: {
  profile: ProfileData | undefined;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  avatarMutation: any;
}) => {
  return (
    <div className="profile-form">
      <div className="form-group">
        <h3>Profile Picture</h3>
        <p>Upload a profile picture to personalize your account.</p>
      </div>
      <div className="avatar-upload-section">
        <div className="profile-picture-wrapper">
          {(profile?.profileImageUrl || profile?.profile_image_url) ? (
            <img src={String(profile.profileImageUrl || profile.profile_image_url || '')} alt="Profile" className="profile-picture" />
          ) : (
            <div className="profile-picture-placeholder">
              {(profile?.fullName || profile?.full_name)?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <label className="avatar-upload-label" title="Click to upload profile picture">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={onAvatarUpload}
            disabled={avatarMutation.isPending}
          />
          <span className="avatar-upload-text">
            {avatarMutation.isPending ? 'Uploading...' : 'Upload Photo'}
          </span>
        </label>
      </div>
    </div>
  );
};

// Email Change Modal Component
const EmailChangeModal = ({
  onClose,
  onSubmit,
  newEmail,
  setNewEmail,
  step,
}: {
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  newEmail: string;
  setNewEmail: (email: string) => void;
  step: 'request' | 'confirm';
}) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Change Email</h2>
        {step === 'request' && (
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label>New Email Address</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <p className="modal-warning">
              After changing your email, you will be logged out on all devices for security.
            </p>
            <button type="submit" className="btn btn-primary">
              Send Verification Code
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
