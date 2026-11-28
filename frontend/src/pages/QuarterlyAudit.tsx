import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
//import ErrorMessage from '../components/ErrorMessage';
import { useCurrentQuarter } from '../hooks/useQuarterly';
import { formatQuarter } from '../utils/quarterly';
import './QuarterlyAudit.css';

const PILLARS = [
  { value: 'identity', label: 'Identity', icon: '🧭' },
  { value: 'employment', label: 'Employment', icon: '💼' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'immigration', label: 'Immigration', icon: '🛂' },
  { value: 'health', label: 'Health', icon: '🧠' },
  { value: 'christian_life', label: 'Christian Life', icon: '✝️' },
  { value: 'personal_growth', label: 'Personal Growth', icon: '📚' },
];

const QuarterlyAudit = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: quarterInfo } = useCurrentQuarter();
  const [currentPillarIndex, setCurrentPillarIndex] = useState(() =>
    Math.max(0, PILLARS.findIndex(pillar => pillar.value === searchParams.get('pillar')))
  );
  const [formData, setFormData] = useState<Record<string, any>>({});

  const currentPillar = PILLARS[currentPillarIndex];
  const quarter = quarterInfo?.quarter || 'Q1';
  const year = quarterInfo?.year || new Date().getFullYear();

  const { data: audit, isLoading } = useQuery({
    queryKey: ['quarterly-audit', currentPillar.value, quarter, year],
    queryFn: () => api.get(`/stewardship/quarterly-audit/${currentPillar.value}/${quarter}/${year}`).then(res => res.data),
    enabled: !!currentPillar && !!quarter && !!year,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => api.post(`/stewardship/quarterly-audit/${currentPillar.value}/${quarter}/${year}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quarterly-audit'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => api.post(`/stewardship/quarterly-audit/${currentPillar.value}/${quarter}/${year}/complete`),
    onSuccess: () => {
      if (currentPillarIndex < PILLARS.length - 1) {
        setCurrentPillarIndex(currentPillarIndex + 1);
        setFormData({});
      } else {
        navigate('/dashboard');
      }
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleArrayChange = (field: string, items: string[]) => {
    setFormData({ ...formData, [field]: items });
  };

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const handleNext = () => {
    if (currentPillarIndex < PILLARS.length - 1) {
      handleSave();
      setCurrentPillarIndex(currentPillarIndex + 1);
      setFormData({});
    }
  };

  const handleComplete = () => {
    handleSave();
    completeMutation.mutate();
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading quarterly audit..." size="large" />;
  }

  // Initialize form data from audit if available
  if (audit && Object.keys(formData).length === 0) {
    setFormData({
      vision: audit.vision || '',
      reality: audit.reality || '',
      gapDelta: audit.gap_delta || '',
      rootCause: audit.root_cause || '',
      stopItems: audit.stop_items || [],
      startItems: audit.start_items || [],
      continueItems: audit.continue_items || [],
      nextCommitments: audit.next_commitments || [],
    });
  }

  return (
    <div className="quarterly-audit-page">
      <div className="audit-header">
        <h1>Quarterly Audit</h1>
        <p className="audit-subtitle">
          {formatQuarter(quarter as any, year)} - {currentPillar.label}
        </p>
        <div className="audit-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentPillarIndex + 1) / PILLARS.length) * 100}%` }}
            ></div>
          </div>
          <span className="progress-text">
            Pillar {currentPillarIndex + 1} of {PILLARS.length}
          </span>
        </div>
      </div>

      <div className="audit-wizard">
        <div className="pillar-selector">
          {PILLARS.map((pillar, index) => (
            <button
              key={pillar.value}
              className={`pillar-tab ${index === currentPillarIndex ? 'active' : ''} ${audit?.completed_at ? 'completed' : ''}`}
              onClick={() => setCurrentPillarIndex(index)}
            >
              {pillar.icon} {pillar.label}
            </button>
          ))}
        </div>

        <div className="audit-form">
          <h2>{currentPillar.icon} {currentPillar.label}</h2>

          <div className="form-section">
            <label>Vision</label>
            <textarea
              value={formData.vision || ''}
              onChange={(e) => handleInputChange('vision', e.target.value)}
              placeholder="What did you envision for this pillar this quarter?"
              rows={4}
            />
          </div>

          <div className="form-section">
            <label>Reality</label>
            <textarea
              value={formData.reality || ''}
              onChange={(e) => handleInputChange('reality', e.target.value)}
              placeholder="What actually happened?"
              rows={4}
            />
          </div>

          <div className="form-section">
            <label>Gap (Delta)</label>
            <textarea
              value={formData.gapDelta || ''}
              onChange={(e) => handleInputChange('gapDelta', e.target.value)}
              placeholder="What's the gap between vision and reality?"
              rows={3}
            />
          </div>

          <div className="form-section">
            <label>Root Cause</label>
            <textarea
              value={formData.rootCause || ''}
              onChange={(e) => handleInputChange('rootCause', e.target.value)}
              placeholder="Why did this gap occur?"
              rows={3}
            />
          </div>

          <div className="form-section">
            <label>Stop</label>
            <ArrayInput
              items={formData.stopItems || []}
              onChange={(items) => handleArrayChange('stopItems', items)}
              placeholder="What should you stop doing?"
            />
          </div>

          <div className="form-section">
            <label>Start</label>
            <ArrayInput
              items={formData.startItems || []}
              onChange={(items) => handleArrayChange('startItems', items)}
              placeholder="What should you start doing?"
            />
          </div>

          <div className="form-section">
            <label>Continue</label>
            <ArrayInput
              items={formData.continueItems || []}
              onChange={(items) => handleArrayChange('continueItems', items)}
              placeholder="What should you continue doing?"
            />
          </div>

          <div className="form-section">
            <label>Next Quarter Commitments</label>
            <ArrayInput
              items={formData.nextCommitments || []}
              onChange={(items) => handleArrayChange('nextCommitments', items)}
              placeholder="What are your commitments for next quarter?"
            />
          </div>

          <div className="form-actions">
            <button onClick={handleSave} className="save-btn" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Progress'}
            </button>
            {currentPillarIndex < PILLARS.length - 1 ? (
              <button onClick={handleNext} className="next-btn">
                Next Pillar →
              </button>
            ) : (
              <button onClick={handleComplete} className="complete-btn" disabled={completeMutation.isPending}>
                {completeMutation.isPending ? 'Completing...' : 'Complete Audit'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Array Input Component
const ArrayInput = ({ items, onChange, placeholder }: { items: string[]; onChange: (items: string[]) => void; placeholder: string }) => {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="array-input">
      <div className="array-items">
        {items.map((item, index) => (
          <div key={index} className="array-item">
            <span>{item}</span>
            <button type="button" onClick={() => handleRemove(index)} className="remove-btn">×</button>
          </div>
        ))}
      </div>
      <div className="array-input-controls">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          placeholder={placeholder}
        />
        <button type="button" onClick={handleAdd} className="add-item-btn">+ Add</button>
      </div>
    </div>
  );
};

export default QuarterlyAudit;
