import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import './Analytics.css';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Career Analytics
  const { data: careerData, isLoading: careerLoading } = useQuery({
    queryKey: ['analytics-career', timeRange],
    queryFn: () => api.get(`/analytics/career?range=${timeRange}`).then(res => res.data),
  });

  // Financial Analytics
  const { data: financialData, isLoading: financialLoading } = useQuery({
    queryKey: ['analytics-financial', timeRange],
    queryFn: () => api.get(`/analytics/financial?range=${timeRange}`).then(res => res.data),
  });

  // Health Analytics
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ['analytics-health', timeRange],
    queryFn: () => api.get(`/analytics/health?range=${timeRange}`).then(res => res.data),
  });

  // Technical Growth Analytics
  const { data: technicalData, isLoading: technicalLoading } = useQuery({
    queryKey: ['analytics-technical', timeRange],
    queryFn: () => api.get(`/analytics/technical?range=${timeRange}`).then(res => res.data),
  });

  const isLoading = careerLoading || financialLoading || healthLoading || technicalLoading;

  return (
    <div className="analytics">
      <div className="page-header">
        <h1>Cross-Module Analytics</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setTimeRange('week')}
            className={timeRange === 'week' ? 'btn-primary' : 'btn-secondary'}
          >
            Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={timeRange === 'month' ? 'btn-primary' : 'btn-secondary'}
          >
            Month
          </button>
          <button
            onClick={() => setTimeRange('quarter')}
            className={timeRange === 'quarter' ? 'btn-primary' : 'btn-secondary'}
          >
            Quarter
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={timeRange === 'year' ? 'btn-primary' : 'btn-secondary'}
          >
            Year
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading analytics..." size="large" />
      ) : (
        <div className="analytics-grid">
          {/* Career Trends */}
          <div className="analytics-card">
            <h2>💼 Career Trends</h2>
            {careerData ? (
              <div>
                <div className="stat-row">
                  <span>Skills Improved:</span>
                  <strong>{careerData.skills_improved || 0}</strong>
                </div>
                <div className="stat-row">
                  <span>Goals Completed:</span>
                  <strong>{careerData.goals_completed || 0}</strong>
                </div>
                <div className="stat-row">
                  <span>Milestones Achieved:</span>
                  <strong>{careerData.milestones_achieved || 0}</strong>
                </div>
                <div className="stat-row">
                  <span>Average Skill Progress:</span>
                  <strong>{careerData.avg_skill_progress ? `${careerData.avg_skill_progress.toFixed(1)}%` : 'N/A'}</strong>
                </div>
              </div>
            ) : (
              <p style={{ color: '#999' }}>No career data available</p>
            )}
          </div>

          {/* Financial Trends */}
          <div className="analytics-card">
            <h2>💰 Financial Trends</h2>
            {financialData ? (
              <div>
                <div className="stat-row">
                  <span>Total Income:</span>
                  <strong>${financialData.total_income?.toFixed(2) || '0.00'}</strong>
                </div>
                <div className="stat-row">
                  <span>Total Expenses:</span>
                  <strong>${financialData.total_expenses?.toFixed(2) || '0.00'}</strong>
                </div>
                <div className="stat-row">
                  <span>Net Cash Flow:</span>
                  <strong style={{ color: (financialData.net_cash_flow || 0) >= 0 ? '#10b981' : '#ef4444' }}>
                    ${financialData.net_cash_flow?.toFixed(2) || '0.00'}
                  </strong>
                </div>
                <div className="stat-row">
                  <span>Savings Rate:</span>
                  <strong>{financialData.savings_rate ? `${financialData.savings_rate.toFixed(1)}%` : 'N/A'}</strong>
                </div>
              </div>
            ) : (
              <p style={{ color: '#999' }}>No financial data available</p>
            )}
          </div>

          {/* Health Trends */}
          <div className="analytics-card">
            <h2>💪 Health Trends</h2>
            {healthData ? (
              <div>
                <div className="stat-row">
                  <span>Avg Sleep (hours):</span>
                  <strong>{healthData.avg_sleep?.toFixed(1) || 'N/A'}</strong>
                </div>
                <div className="stat-row">
                  <span>Avg Energy Level:</span>
                  <strong>{healthData.avg_energy?.toFixed(1) || 'N/A'}/10</strong>
                </div>
                <div className="stat-row">
                  <span>Exercise Days:</span>
                  <strong>{healthData.exercise_days || 0}</strong>
                </div>
                <div className="stat-row">
                  <span>Health Goals Progress:</span>
                  <strong>{healthData.goals_progress ? `${healthData.goals_progress.toFixed(1)}%` : 'N/A'}</strong>
                </div>
              </div>
            ) : (
              <p style={{ color: '#999' }}>No health data available</p>
            )}
          </div>

          {/* Technical Growth Trends */}
          <div className="analytics-card">
            <h2>🧠 Technical Growth Trends</h2>
            {technicalData ? (
              <div>
                <div className="stat-row">
                  <span>Practice Sessions:</span>
                  <strong>{technicalData.practice_sessions || 0}</strong>
                </div>
                <div className="stat-row">
                  <span>Total Practice Hours:</span>
                  <strong>{technicalData.total_hours?.toFixed(1) || '0.0'}</strong>
                </div>
                <div className="stat-row">
                  <span>Docs Created:</span>
                  <strong>{technicalData.docs_created || 0}</strong>
                </div>
                <div className="stat-row">
                  <span>Wins Logged:</span>
                  <strong>{technicalData.wins_logged || 0}</strong>
                </div>
              </div>
            ) : (
              <p style={{ color: '#999' }}>No technical growth data available</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
