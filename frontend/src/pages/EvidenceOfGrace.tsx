import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { useCurrentQuarter } from '../hooks/useQuarterly';
import './EvidenceOfGrace.css';

const PILLARS = [
  { value: 'identity', label: 'Identity', icon: '🧭' },
  { value: 'employment', label: 'Employment', icon: '💼' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'immigration', label: 'Immigration', icon: '🛂' },
  { value: 'health', label: 'Health', icon: '🧠' },
  { value: 'christian_life', label: 'Christian Life', icon: '✝️' },
  { value: 'personal_growth', label: 'Personal Growth', icon: '📚' },
];

const EvidenceOfGrace = () => {
  const [searchParams] = useSearchParams();
  const selectedPillar = PILLARS.find(pillar => pillar.value === searchParams.get('pillar'))?.value || '';
  const queryClient = useQueryClient();
  const { data: quarterInfo } = useCurrentQuarter();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    pillar: selectedPillar,
    title: '',
    description: '',
    testimony: '',
  });

  const { data: evidence, isLoading, error } = useQuery({
    queryKey: ['evidence-of-grace', selectedPillar],
    queryFn: () => api.get('/stewardship/evidence-of-grace', {
      params: selectedPillar ? { pillar: selectedPillar } : {},
    }).then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/stewardship/evidence-of-grace', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence-of-grace'] });
      setShowForm(false);
      setFormData({ pillar: selectedPillar, title: '', description: '', testimony: '' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pillar || !formData.title || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    createMutation.mutate({
      ...formData,
      quarter: quarterInfo?.quarter,
      year: quarterInfo?.year,
    });
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading Evidence of Grace..." size="large" />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error instanceof Error ? error.message : 'Failed to load Evidence of Grace'}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['evidence-of-grace'] })}
      />
    );
  }

  return (
    <div className="evidence-of-grace-page">
      <div className="page-header">
        <h1>Evidence of Grace</h1>
        <p className="page-subtitle">
          "For I am about to do something new. See, I have already begun! Do you not see it? 
          I will make a pathway through the wilderness. I will create rivers in the dry wasteland." 
          — Isaiah 43:19
        </p>
        <button className="add-evidence-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Evidence of Grace'}
        </button>
      </div>

      {showForm && (
        <div className="evidence-form-container">
          <form className="evidence-form" onSubmit={handleSubmit}>
            <h2>Record Evidence of Grace</h2>
            
            <div className="form-group">
              <label htmlFor="pillar">Pillar *</label>
              <select
                id="pillar"
                value={formData.pillar}
                onChange={(e) => setFormData({ ...formData, pillar: e.target.value })}
                required
              >
                <option value="">Select a pillar</option>
                {PILLARS.map((pillar) => (
                  <option key={pillar.value} value={pillar.value}>
                    {pillar.icon} {pillar.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief title for this evidence"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what happened - the evidence of God's grace in this situation"
                rows={4}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="testimony">Testimony (Optional)</label>
              <textarea
                id="testimony"
                value={formData.testimony}
                onChange={(e) => setFormData({ ...formData, testimony: e.target.value })}
                placeholder="Your personal testimony or reflection on this evidence of grace"
                rows={4}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Save Evidence of Grace'}
              </button>
            </div>
          </form>
        </div>
      )}

      {evidence && evidence.length > 0 ? (
        <div className="evidence-list">
          {evidence.map((item: any) => {
            const pillar = PILLARS.find(p => p.value === item.pillar);
            return (
              <div key={item.id} className="evidence-card">
                <div className="evidence-header">
                  <span className="evidence-pillar-badge">
                    {pillar?.icon} {pillar?.label}
                  </span>
                  <span className="evidence-quarter">
                    {item.quarter} {item.year}
                  </span>
                </div>
                <h3 className="evidence-title">{item.title}</h3>
                <p className="evidence-description">{item.description}</p>
                {item.testimony && (
                  <div className="evidence-testimony">
                    <strong>Testimony:</strong>
                    <p>{item.testimony}</p>
                  </div>
                )}
                <div className="evidence-date">
                  {new Date(item.created_at).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="✨"
          title="No Evidence of Grace yet"
          message="Start recording moments of divine intervention and grace in your life"
        />
      )}
    </div>
  );
};

export default EvidenceOfGrace;
