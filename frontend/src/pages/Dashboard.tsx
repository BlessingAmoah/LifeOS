import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useCurrentQuarter} from '../hooks/useQuarterly';
// import { useCurrentQuarter, useReadOnly } from '../hooks/useQuarterly';
import { formatQuarter, getQuarterProgress, isGapAnalysisWindow, getDaysUntilQuarterEnd } from '../utils/quarterly';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  // Current quarter info
  const { data: quarterInfo, isLoading: quarterLoading } = useCurrentQuarter();

  // Profile data
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profiles').then(res => res.data),
  });

  // Get quarterly identity statement
  const quarterlyIdentityStatement = profile?.quarterly_identity_statement || '';

  // Financial snapshot
  const { data: financialDashboard } = useQuery({
    queryKey: ['financial-dashboard'],
    queryFn: () => api.get('/financial-dashboard').then(res => res.data),
    enabled: !!profile,
  });

  const { data: netWorth } = useQuery({
    queryKey: ['net-worth', 'latest'],
    queryFn: () => api.get('/net-worth/latest').then(res => res.data).catch(() => null),
    enabled: !!profile,
  });

  // Immigration deadlines
  const { data: deadlines } = useQuery({
    queryKey: ['deadlines-reminders', 'upcoming'],
    queryFn: () => api.get('/deadlines-reminders?upcoming=true').then(res => res.data),
    enabled: !!profile,
  });

  // Evidence of Grace (recent)
  const { data: evidenceOfGrace } = useQuery({
    queryKey: ['evidence-of-grace', 'recent'],
    queryFn: () => api.get('/stewardship/evidence-of-grace?limit=3').then(res => res.data),
    enabled: !!profile,
  });

  if (profileLoading || quarterLoading) {
    return <LoadingSpinner message="Loading dashboard..." size="large" />;
  }

  if (profileError) {
    return (
      <ErrorMessage
        message={profileError instanceof Error ? profileError.message : 'Failed to load dashboard'}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const currentQuarter = quarterInfo?.quarter || 'Q1';
  const currentYear = quarterInfo?.year || new Date().getFullYear();
  const quarterProgress = getQuarterProgress();
  const daysUntilEnd = getDaysUntilQuarterEnd();
  const isGapWindow = isGapAnalysisWindow();

  // Calculate financial metrics
  const netWorthValue = netWorth ? parseFloat(netWorth.total_assets || '0') - parseFloat(netWorth.total_liabilities || '0') : 0;
  const savingsRate = financialDashboard?.health_indicators?.savings_rate || 0;

  // Get next immigration deadline
  const today = new Date().toISOString().split('T')[0];
  const nextDeadline = deadlines?.find((d: any) => !d.completed && d.deadline_date >= today) || null;
  const daysUntilDeadline = nextDeadline ? Math.ceil((new Date(nextDeadline.deadline_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)) : null;

  // Pillar definitions
  const pillars = [
    {
      id: 'identity',
      name: 'Identity',
      icon: '🧭',
      path: '/dashboard/identity',
      color: '#9b59b6',
      currentFocus: quarterlyIdentityStatement || 'Define who you are becoming',
      status: 'active',
      insight: 'Your North Star',
    },
    {
      id: 'employment',
      name: 'Employment',
      icon: '💼',
      path: '/dashboard/employment',
      color: '#f39c12',
      currentFocus: 'Vocation mastery',
      status: 'active',
      insight: 'Technical growth as compounding asset',
    },
    {
      id: 'finance',
      name: 'Finance',
      icon: '💰',
      path: '/dashboard/finance',
      color: '#3498db',
      currentFocus: `Net Worth: $${netWorthValue.toLocaleString()}`,
      status: 'active',
      insight: `${savingsRate}% savings rate`,
    },
    {
      id: 'immigration',
      name: 'Immigration',
      icon: '🛂',
      path: '/dashboard/immigration',
      color: '#e74c3c',
      currentFocus: nextDeadline ? nextDeadline.title : 'No upcoming deadlines',
      status: nextDeadline && daysUntilDeadline && daysUntilDeadline <= 30 ? 'warning' : 'active',
      insight: nextDeadline && daysUntilDeadline ? `${daysUntilDeadline} days until deadline` : 'All clear',
    },
    {
      id: 'health',
      name: 'Health',
      icon: '🧠',
      path: '/dashboard/health',
      color: '#27ae60',
      currentFocus: 'Capacity & sustainability',
      status: 'active',
      insight: 'Track energy trends',
    },
    {
      id: 'christian_life',
      name: 'Christian Life',
      icon: '✝️',
      path: '/dashboard/christian-life',
      color: '#16a085',
      currentFocus: 'Formation & faithfulness',
      status: 'active',
      insight: 'Spiritual rhythms',
    },
    {
      id: 'personal_growth',
      name: 'Personal Growth',
      icon: '📚',
      path: '/dashboard/personal',
      color: '#e91e63',
      currentFocus: 'Character & learning',
      status: 'active',
      insight: 'Beyond career',
    },
  ];

  return (
    <div className="stewardship-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-logo">LifeOS</h1>
        </div>
        <div className="header-center">
          {quarterlyIdentityStatement ? (
            <div className="quarterly-identity-statement">
              <p className="identity-text">{quarterlyIdentityStatement}</p>
            </div>
          ) : (
            <div className="quarterly-identity-statement empty">
              <p className="identity-text">Set your quarterly identity statement</p>
            </div>
          )}
        </div>
        <div className="header-right">
          <div className="quarter-info">
            <div className="quarter-label">{formatQuarter(currentQuarter as any, currentYear)}</div>
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${quarterProgress}%` }}
                ></div>
              </div>
              <div className="progress-text">{daysUntilEnd} days remaining</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stewardship Grid - 7 Pillars */}
      <div className="stewardship-grid">
        {pillars.map((pillar) => (
          <div
            key={pillar.id}
            className={`pillar-tile ${pillar.status}`}
            onClick={() => navigate(pillar.path)}
            style={{ borderTopColor: pillar.color }}
          >
            <div className="pillar-header">
              <span className="pillar-icon">{pillar.icon}</span>
              <h3 className="pillar-name">{pillar.name}</h3>
            </div>
            <div className="pillar-content">
              <div className="pillar-focus">
                <strong>Current Focus:</strong>
                <p>{pillar.currentFocus}</p>
              </div>
              <div className="pillar-insight">
                <span className="insight-label">Insight:</span>
                <span className="insight-text">{pillar.insight}</span>
              </div>
            </div>
            <div className="pillar-status-indicator">
              <span className={`status-dot ${pillar.status}`}></span>
              <span className="status-text">{pillar.status === 'warning' ? 'Attention needed' : 'Active'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="dashboard-footer">
        {isGapWindow && (
          <button 
            className="gap-analysis-btn"
            onClick={() => navigate('/dashboard/quarterly-audit')}
          >
            Start Gap Analysis
          </button>
        )}
        <button 
          className="evidence-of-grace-btn"
          onClick={() => navigate('/dashboard/evidence-of-grace')}
          title="Add Evidence of Grace"
        >
          + Evidence of Grace
        </button>
      </div>

      {/* Recent Evidence of Grace */}
      {evidenceOfGrace && evidenceOfGrace.length > 0 && (
        <div className="recent-evidence">
          <h3>Recent Evidence of Grace</h3>
          <div className="evidence-list">
            {evidenceOfGrace.map((evidence: any) => (
              <div key={evidence.id} className="evidence-item">
                <span className="evidence-pillar">{evidence.pillar}</span>
                <strong>{evidence.title}</strong>
                <p>{evidence.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
