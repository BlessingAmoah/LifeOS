import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { exportHealthLogsToCSV, exportToPDF } from '../utils/exportUtils';
import './Health.css';

interface HealthLogForm {
  exercise: string;
  sleep_hours: number;
  energy_level: number;
  notes: string;
  logged_on: string;
  nutrition_notes?: string;
  weight?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  mental_health_score?: number;
  mental_health_notes?: string;
  mood?: string;
  stress_level?: number;
}

interface HealthGoalForm {
  title: string;
  description?: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
  target_date?: string;
  status: 'active' | 'completed' | 'paused';
}

const Health = () => {
  const [showForm, setShowForm] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [viewMode, setViewMode] = useState<'logs' | 'trends' | 'goals' | 'summary'>('logs');
  const queryClient = useQueryClient();

  const { data: healthLogs, isLoading, error } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.get('/health').then(res => res.data),
  });

  const { data: healthGoals, isLoading: goalsLoading, error: goalsError } = useQuery({
    queryKey: ['health-goals'],
    queryFn: () => api.get('/health-goals').then(res => res.data),
    enabled: viewMode === 'goals',
  });

  const { register, handleSubmit, reset } = useForm<HealthLogForm>({
    defaultValues: {
      logged_on: new Date().toISOString().split('T')[0],
      energy_level: 5,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: HealthLogForm) => api.post('/health', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health'] });
      reset();
      setShowForm(false);
    },
  });

  // Health Goal Form Component
  const HealthGoalForm = ({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) => {
    const { register, handleSubmit, reset } = useForm<HealthGoalForm>({
      defaultValues: { status: 'active', current_value: 0 },
    });

    const createGoalMutation = useMutation({
      mutationFn: (data: HealthGoalForm) => api.post('/health-goals', data),
      onSuccess: () => {
        reset();
        onSuccess();
      },
    });

    return (
      <form onSubmit={handleSubmit((data) => createGoalMutation.mutate(data))} className="health-form" style={{ marginBottom: '2rem' }}>
        <h3>Create Health Goal</h3>
        <div className="form-group">
          <label>Title *</label>
          <input type="text" {...register('title', { required: true })} placeholder="e.g., Lose 10 pounds" />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea rows={3} {...register('description')} placeholder="Optional description..." />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Current Value</label>
            <input type="number" step="0.1" {...register('current_value', { valueAsNumber: true })} placeholder="0" />
          </div>
          <div className="form-group">
            <label>Target Value</label>
            <input type="number" step="0.1" {...register('target_value', { valueAsNumber: true })} placeholder="e.g., 10" />
          </div>
          <div className="form-group">
            <label>Unit</label>
            <input type="text" {...register('unit')} placeholder="e.g., lbs, kg, hours" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Target Date</label>
            <input type="date" {...register('target_date')} />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select {...register('status')}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" className="btn-primary" disabled={createGoalMutation.isPending}>
            Create Goal
          </button>
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    );
  };

  // Health Goal Card Component
  const HealthGoalCard = ({ goal, onUpdate, onDelete }: { goal: any; onUpdate: () => void; onDelete: () => void }) => {
    const [isEditing, setIsEditing] = useState(false);
    const { register, handleSubmit, reset } = useForm<HealthGoalForm>({
      defaultValues: {
        title: goal.title,
        description: goal.description || '',
        target_value: goal.target_value,
        current_value: goal.current_value || 0,
        unit: goal.unit || '',
        target_date: goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : '',
        status: goal.status,
      },
    });

    const updateMutation = useMutation({
      mutationFn: (data: Partial<HealthGoalForm>) => api.put(`/health-goals/${goal.id}`, data),
      onSuccess: () => {
        setIsEditing(false);
        onUpdate();
      },
    });

    const deleteMutation = useMutation({
      mutationFn: () => api.delete(`/health-goals/${goal.id}`),
      onSuccess: () => {
        onDelete();
      },
    });

    if (isEditing) {
      return (
        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="health-form" style={{ marginBottom: '1rem' }}>
          <div className="form-group">
            <label>Title *</label>
            <input type="text" {...register('title', { required: true })} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={2} {...register('description')} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Current Value</label>
              <input type="number" step="0.1" {...register('current_value', { valueAsNumber: true })} />
            </div>
            <div className="form-group">
              <label>Target Value</label>
              <input type="number" step="0.1" {...register('target_value', { valueAsNumber: true })} />
            </div>
            <div className="form-group">
              <label>Unit</label>
              <input type="text" {...register('unit')} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Target Date</label>
              <input type="date" {...register('target_date')} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select {...register('status')}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-primary" disabled={updateMutation.isPending}>
              Update
            </button>
            <button type="button" onClick={() => { setIsEditing(false); reset(); }} className="btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to delete this goal?')) {
                  deleteMutation.mutate();
                }
              }}
              className="btn-danger"
              disabled={deleteMutation.isPending}
            >
              Delete
            </button>
          </div>
        </form>
      );
    }

    return (
      <div className="goal-card" style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', marginBottom: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
          <h3>{goal.title}</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setIsEditing(true)} className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
              ✏️ Edit
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this goal?')) {
                  deleteMutation.mutate();
                }
              }}
              className="btn-danger"
              style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
              disabled={deleteMutation.isPending}
            >
              🗑️
            </button>
          </div>
        </div>
        {goal.description && <p style={{ marginBottom: '1rem', color: '#666' }}>{goal.description}</p>}
        {goal.target_value && (
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Progress:</span>
              <span><strong>{goal.current_value || 0} / {goal.target_value} {goal.unit || ''}</strong></span>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min((goal.current_value || 0) / goal.target_value * 100, 100)}%`,
                  height: '100%',
                  background: goal.status === 'completed' ? '#10b981' : '#667eea',
                  transition: 'width 0.3s'
                }}
              />
            </div>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          {goal.target_date && (
            <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
              Target: {new Date(goal.target_date).toLocaleDateString()}
            </p>
          )}
          <span style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            background: goal.status === 'completed' ? '#10b981' : goal.status === 'paused' ? '#f59e0b' : '#667eea',
            color: 'white',
            borderRadius: '1rem',
            fontSize: '0.875rem',
            textTransform: 'capitalize'
          }}>
            {goal.status}
          </span>
        </div>
      </div>
    );
  };

  if (isLoading && viewMode === 'logs') {
    return <LoadingSpinner message="Loading health logs..." size="large" />;
  }

  if (error && viewMode === 'logs') {
    return (
      <ErrorMessage
        message={error instanceof Error ? error.message : 'Failed to load health logs'}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['health'] })}
      />
    );
  }

  return (
    <div className="health">
      <div className="page-header">
        <h1>Health</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setViewMode('logs')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'logs' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'logs' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logs
            </button>
            <button
              onClick={() => setViewMode('trends')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'trends' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'trends' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Trends
            </button>
            <button
              onClick={() => setViewMode('goals')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'goals' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'goals' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Goals
            </button>
            <button
              onClick={() => setViewMode('summary')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'summary' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'summary' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Weekly Summary
            </button>
          </div>
          {viewMode === 'logs' && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                {showForm ? 'Cancel' : 'Log Health'}
              </button>
              {healthLogs && healthLogs.length > 0 && (
                <>
                  <button 
                    onClick={() => exportHealthLogsToCSV(healthLogs)} 
                    className="btn-secondary"
                    title="Export to CSV"
                  >
                    📥 CSV
                  </button>
                  <button 
                    onClick={() => exportToPDF(
                      'Health Logs',
                      healthLogs,
                      [
                        { key: 'logged_on', label: 'Date' },
                        { key: 'sleep_hours', label: 'Sleep' },
                        { key: 'energy_level', label: 'Energy' },
                        { key: 'weight', label: 'Weight' },
                      ],
                      'health-logs-export'
                    )} 
                    className="btn-secondary"
                    title="Export to PDF"
                  >
                    📄 PDF
                  </button>
                </>
              )}
            </div>
          )}
          {viewMode === 'goals' && (
            <button onClick={() => setShowGoals(!showGoals)} className="btn-primary">
              {showGoals ? 'Cancel' : 'New Goal'}
            </button>
          )}
        </div>
      </div>

      {viewMode === 'trends' && (
        <div className="trends-view" style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px' }}>
          <h2>Health Trends</h2>
          {healthLogs && healthLogs.length > 0 ? (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h3>Sleep Hours (Last 7 Days)</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: '200px' }}>
                  {healthLogs.slice(0, 7).reverse().map((log: any, idx: number) => (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '100%',
                          background: '#667eea',
                          height: `${(log.sleep_hours || 0) * 8}px`,
                          minHeight: '4px',
                          borderRadius: '4px 4px 0 0',
                          marginBottom: '0.5rem'
                        }}
                        title={`${log.sleep_hours || 0}h`}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#666' }}>
                        {new Date(log.logged_on).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3>Energy Levels (Last 7 Days)</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: '200px' }}>
                  {healthLogs.slice(0, 7).reverse().map((log: any, idx: number) => (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '100%',
                          background: log.energy_level >= 7 ? '#10b981' : log.energy_level >= 4 ? '#f59e0b' : '#ef4444',
                          height: `${(log.energy_level || 0) * 20}px`,
                          minHeight: '4px',
                          borderRadius: '4px 4px 0 0',
                          marginBottom: '0.5rem'
                        }}
                        title={`${log.energy_level || 0}/10`}
                      />
                      <span style={{ fontSize: '0.75rem', color: '#666' }}>
                        {new Date(log.logged_on).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p>No health data to display trends</p>
          )}
        </div>
      )}

      {viewMode === 'summary' && (
        <div className="weekly-summary-view" style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px' }}>
          <h2>Weekly Health Summary</h2>
          {healthLogs && healthLogs.length > 0 ? (
            (() => {
              // Get last 7 days of logs
              const last7Days = healthLogs.slice(0, 7);
              const avgSleep = last7Days.reduce((sum: number, log: any) => sum + (log.sleep_hours || 0), 0) / last7Days.length;
              const avgEnergy = last7Days.reduce((sum: number, log: any) => sum + (log.energy_level || 0), 0) / last7Days.length;
              const exerciseDays = last7Days.filter((log: any) => log.exercise && log.exercise.trim() !== '').length;
              const daysWithNotes = last7Days.filter((log: any) => log.notes && log.notes.trim() !== '').length;
              
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                  <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#667eea' }}>Average Sleep</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
                      {avgSleep.toFixed(1)} hours
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                      Over last 7 days
                    </div>
                  </div>
                  
                  <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#667eea' }}>Average Energy</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
                      {avgEnergy.toFixed(1)}/10
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                      Over last 7 days
                    </div>
                  </div>
                  
                  <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#667eea' }}>Exercise Days</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
                      {exerciseDays}/7
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                      Days with exercise logged
                    </div>
                  </div>
                  
                  <div style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#667eea' }}>Days Logged</h3>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
                      {last7Days.length}/7
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                      Days with health logs
                    </div>
                  </div>
                  
                  <div style={{ gridColumn: '1 / -1', padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ marginTop: 0, color: '#667eea' }}>Recent Notes</h3>
                    {daysWithNotes > 0 ? (
                      <div style={{ marginTop: '1rem' }}>
                        {last7Days.filter((log: any) => log.notes && log.notes.trim() !== '').map((log: any, idx: number) => (
                          <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', background: '#f9f9f9', borderRadius: '4px' }}>
                            <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
                              {new Date(log.logged_on).toLocaleDateString()}
                            </div>
                            <div>{log.notes}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: '#999', fontStyle: 'italic' }}>No notes logged this week</p>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <p style={{ color: '#666', textAlign: 'center', padding: '2rem' }}>No health data available for weekly summary</p>
          )}
        </div>
      )}

      {viewMode === 'goals' && (
        <div className="goals-view">
          {showGoals && (
            <HealthGoalForm
              onSuccess={() => {
                setShowGoals(false);
                queryClient.invalidateQueries({ queryKey: ['health-goals'] });
              }}
              onCancel={() => setShowGoals(false)}
            />
          )}
          {goalsLoading ? (
            <LoadingSpinner message="Loading goals..." size="medium" />
          ) : healthGoals && healthGoals.length > 0 ? (
            <div className="goals-list">
              {healthGoals.map((goal: any) => (
                <HealthGoalCard
                  key={goal.id}
                  goal={goal}
                  onUpdate={() => queryClient.invalidateQueries({ queryKey: ['health-goals'] })}
                  onDelete={() => queryClient.invalidateQueries({ queryKey: ['health-goals'] })}
                />
              ))}
            </div>
          ) : goalsError ? (
            <ErrorMessage
              message={goalsError instanceof Error ? goalsError.message : 'Failed to load health goals'}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['health-goals'] })}
            />
          ) : (
            <EmptyState
              icon="🎯"
              title="No health goals"
              message="Set your first health goal to start tracking your progress."
              actionLabel="Create Goal"
              onAction={() => setShowGoals(true)}
            />
          )}
        </div>
      )}

      {viewMode === 'logs' && showForm && (
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="health-form">
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              {...register('logged_on', { required: true })}
            />
          </div>
          <div className="form-group">
            <label>Exercise</label>
            <textarea
              rows={3}
              placeholder="What exercise did you do?"
              {...register('exercise')}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Sleep Hours</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                placeholder="Hours"
                {...register('sleep_hours', { valueAsNumber: true })}
              />
            </div>
            <div className="form-group">
              <label>Energy Level (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                {...register('energy_level', { valueAsNumber: true })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              rows={3}
              placeholder="Additional notes..."
              {...register('notes')}
            />
          </div>
          
          {/* Nutrition Notes */}
          <div className="form-group">
            <label>Nutrition Notes (Enhanced)</label>
            <textarea
              rows={4}
              placeholder="Track meals, calories, macros, dietary notes..."
              {...register('nutrition_notes')}
            />
          </div>

          {/* Weight & Vitals */}
          <div style={{ borderTop: '2px solid #e0e0e0', paddingTop: '1rem', marginTop: '1rem' }}>
            <h4 style={{ marginBottom: '1rem', color: '#667eea' }}>Weight & Vitals</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Weight</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="kg or lbs"
                  {...register('weight', { valueAsNumber: true })}
                />
              </div>
              <div className="form-group">
                <label>Blood Pressure (Systolic)</label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  placeholder="mmHg"
                  {...register('blood_pressure_systolic', { valueAsNumber: true })}
                />
              </div>
              <div className="form-group">
                <label>Blood Pressure (Diastolic)</label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  placeholder="mmHg"
                  {...register('blood_pressure_diastolic', { valueAsNumber: true })}
                />
              </div>
              <div className="form-group">
                <label>Heart Rate (bpm)</label>
                <input
                  type="number"
                  min="0"
                  max="300"
                  placeholder="bpm"
                  {...register('heart_rate', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          {/* Mental Health */}
          <div style={{ borderTop: '2px solid #e0e0e0', paddingTop: '1rem', marginTop: '1rem' }}>
            <h4 style={{ marginBottom: '1rem', color: '#667eea' }}>Mental Health Check-in</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Mental Health Score (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="1-10"
                  {...register('mental_health_score', { valueAsNumber: true })}
                />
              </div>
              <div className="form-group">
                <label>Mood</label>
                <select {...register('mood')}>
                  <option value="">Select mood</option>
                  <option value="😊">😊 Happy</option>
                  <option value="😌">😌 Calm</option>
                  <option value="😔">😔 Sad</option>
                  <option value="😰">😰 Anxious</option>
                  <option value="😴">😴 Tired</option>
                  <option value="😤">😤 Frustrated</option>
                  <option value="😃">😃 Excited</option>
                  <option value="😑">😑 Neutral</option>
                </select>
              </div>
              <div className="form-group">
                <label>Stress Level (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="1-10"
                  {...register('stress_level', { valueAsNumber: true })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Mental Health Notes</label>
              <textarea
                rows={3}
                placeholder="How are you feeling? Any concerns or positive thoughts..."
                {...register('mental_health_notes')}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary">Save Log</button>
        </form>
      )}

      {viewMode === 'logs' && (
        <div className="health-logs">
          {healthLogs && healthLogs.length > 0 ? (
            healthLogs.map((log: any) => (
              <div key={log.id} className="health-card">
                <div className="health-header">
                  <h3>{new Date(log.logged_on).toLocaleDateString()}</h3>
                  {log.sleep_hours && (
                    <span className="health-sleep">💤 {log.sleep_hours}h</span>
                  )}
                  {log.energy_level && (
                    <span className="health-energy">⚡ {log.energy_level}/10</span>
                  )}
                </div>
                {log.exercise && (
                  <div className="health-section">
                    <strong>Exercise:</strong> {log.exercise}
                  </div>
                )}
                {log.notes && (
                  <div className="health-section">
                    <strong>Notes:</strong> {log.notes}
                  </div>
                )}
                {log.nutrition_notes && (
                  <div className="health-section" style={{ background: '#e8f5e9', padding: '0.75rem', borderRadius: '4px', marginTop: '0.5rem' }}>
                    <strong>🍎 Nutrition:</strong> {log.nutrition_notes}
                  </div>
                )}
                {(log.weight || log.blood_pressure_systolic || log.heart_rate) && (
                  <div className="health-section" style={{ background: '#e3f2fd', padding: '0.75rem', borderRadius: '4px', marginTop: '0.5rem' }}>
                    <strong>📊 Vitals:</strong>
                    {log.weight && <span style={{ marginLeft: '0.5rem' }}>Weight: {log.weight}</span>}
                    {log.blood_pressure_systolic && log.blood_pressure_diastolic && (
                      <span style={{ marginLeft: '0.5rem' }}>
                        BP: {log.blood_pressure_systolic}/{log.blood_pressure_diastolic}
                      </span>
                    )}
                    {log.heart_rate && <span style={{ marginLeft: '0.5rem' }}>HR: {log.heart_rate} bpm</span>}
                  </div>
                )}
                {(log.mental_health_score || log.mood || log.stress_level || log.mental_health_notes) && (
                  <div className="health-section" style={{ background: '#f3e5f5', padding: '0.75rem', borderRadius: '4px', marginTop: '0.5rem' }}>
                    <strong>🧠 Mental Health:</strong>
                    {log.mental_health_score && <span style={{ marginLeft: '0.5rem' }}>Score: {log.mental_health_score}/10</span>}
                    {log.mood && <span style={{ marginLeft: '0.5rem' }}>Mood: {log.mood}</span>}
                    {log.stress_level && <span style={{ marginLeft: '0.5rem' }}>Stress: {log.stress_level}/10</span>}
                    {log.mental_health_notes && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{log.mental_health_notes}</div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="empty-state">No health logs yet</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Health;
