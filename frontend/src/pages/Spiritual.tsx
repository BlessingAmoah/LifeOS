import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import './Spiritual.css';

interface SpiritualGoalForm {
  title: string;
  description: string;
  goal_type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  target_value: number;
  current_value: number;
  target_date: string;
  status: 'active' | 'completed' | 'paused';
}

interface PrayerLogForm {
  type: 'prayer' | 'meditation' | 'worship' | 'devotion';
  duration_minutes: number;
  notes: string;
  scripture_reference: string;
  logged_on: string;
}

interface ScriptureForm {
  type: 'scripture' | 'affirmation' | 'quote' | 'prayer';
  title: string;
  content: string;
  reference: string;
  category: string;
  tags: string;
  is_favorite: boolean;
}

interface ReflectionForm {
  reflection_type: 'daily' | 'weekly';
  content: string;
  reflection_date: string;
}

interface SpiritualGoal {
  id: string;
  title: string;
  description: string | null;
  goal_type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  target_value: number | null;
  current_value: number;
  target_date: string | null;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

interface PrayerLog {
  id: string;
  type: 'prayer' | 'meditation' | 'worship' | 'devotion';
  duration_minutes: number | null;
  notes: string | null;
  scripture_reference: string | null;
  logged_on: string;
  created_at: string;
  updated_at: string;
}

interface Scripture {
  id: string;
  type: 'scripture' | 'affirmation' | 'quote' | 'prayer';
  title: string | null;
  content: string;
  reference: string | null;
  category: string | null;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

interface Reflection {
  id: string;
  reflection_type: 'daily' | 'weekly';
  content: string;
  reflection_date: string;
  created_at: string;
  updated_at: string;
}

const Spiritual = () => {
  const [viewMode, setViewMode] = useState<'goals' | 'prayers' | 'scriptures' | 'reflections'>('goals');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showPrayerForm, setShowPrayerForm] = useState(false);
  const [showScriptureForm, setShowScriptureForm] = useState(false);
  const [showReflectionForm, setShowReflectionForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SpiritualGoal | null>(null);
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerLog | null>(null);
  const [selectedScripture, setSelectedScripture] = useState<Scripture | null>(null);
  const [selectedReflection, setSelectedReflection] = useState<Reflection | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'prayer' | 'meditation' | 'worship' | 'devotion'>('all');
  const [filterScriptureType, setFilterScriptureType] = useState<'all' | 'scripture' | 'affirmation' | 'quote' | 'prayer'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const queryClient = useQueryClient();

  // Spiritual Goals query
  const { data: goals, isLoading: goalsLoading, error: goalsError } = useQuery<SpiritualGoal[]>({
    queryKey: ['spiritual-goals'],
    queryFn: () => api.get('/spiritual-goals').then(res => res.data),
  });

  // Prayer Logs query
  const { data: prayers, isLoading: prayersLoading, error: prayersError } = useQuery<PrayerLog[]>({
    queryKey: ['prayer-logs', filterType],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      return api.get(`/prayer-logs?${params.toString()}`).then(res => res.data);
    },
    enabled: viewMode === 'prayers',
  });

  // Prayer summary query
  const { data: prayerSummary } = useQuery({
    queryKey: ['prayer-summary'],
    queryFn: () => api.get('/prayer-logs/summary').then(res => res.data),
    enabled: viewMode === 'prayers',
  });

  // Scriptures query
  const { data: scriptures, isLoading: scripturesLoading, error: scripturesError } = useQuery<Scripture[]>({
    queryKey: ['scriptures', filterScriptureType, showFavoritesOnly],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterScriptureType !== 'all') params.append('type', filterScriptureType);
      if (showFavoritesOnly) params.append('is_favorite', 'true');
      return api.get(`/scriptures?${params.toString()}`).then(res => res.data);
    },
    enabled: viewMode === 'scriptures',
  });

  // Reflections query
  const { data: reflections, isLoading: reflectionsLoading, error: reflectionsError } = useQuery<Reflection[]>({
    queryKey: ['spiritual-reflections'],
    queryFn: () => api.get('/spiritual-reflections').then(res => res.data),
    enabled: viewMode === 'reflections',
  });

  // Forms
  const { register: registerGoal, handleSubmit: handleGoalSubmit, reset: resetGoal, setValue: setGoalValue } = useForm<SpiritualGoalForm>({
    defaultValues: {
      title: '',
      description: '',
      goal_type: 'daily',
      target_value: 0,
      current_value: 0,
      target_date: '',
      status: 'active',
    },
  });

  const { register: registerPrayer, handleSubmit: handlePrayerSubmit, reset: resetPrayer, setValue: setPrayerValue } = useForm<PrayerLogForm>({
    defaultValues: {
      type: 'prayer',
      duration_minutes: 0,
      notes: '',
      scripture_reference: '',
      logged_on: new Date().toISOString().split('T')[0],
    },
  });

  const { register: registerScripture, handleSubmit: handleScriptureSubmit, reset: resetScripture, setValue: setScriptureValue } = useForm<ScriptureForm>({
    defaultValues: {
      type: 'scripture',
      title: '',
      content: '',
      reference: '',
      category: '',
      tags: '',
      is_favorite: false,
    },
  });

  const { register: registerReflection, handleSubmit: handleReflectionSubmit, reset: resetReflection, setValue: setReflectionValue } = useForm<ReflectionForm>({
    defaultValues: {
      reflection_type: 'daily',
      content: '',
      reflection_date: new Date().toISOString().split('T')[0],
    },
  });

  // Goal mutations
  const createGoalMutation = useMutation({
    mutationFn: (data: SpiritualGoalForm) => api.post('/spiritual-goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spiritual-goals'] });
      resetGoal();
      setShowGoalForm(false);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to create spiritual goal');
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SpiritualGoalForm> }) =>
      api.put(`/spiritual-goals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spiritual-goals'] });
      resetGoal();
      setShowGoalForm(false);
      setIsEditing(false);
      setSelectedGoal(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to update spiritual goal');
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/spiritual-goals/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['spiritual-goals'] });
      if (selectedGoal?.id === id) {
        setSelectedGoal(null);
      }
      alert('Spiritual goal deleted successfully!');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to delete spiritual goal');
    },
  });

  // Prayer mutations
  const createPrayerMutation = useMutation({
    mutationFn: (data: PrayerLogForm) => api.post('/prayer-logs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-logs'] });
      queryClient.invalidateQueries({ queryKey: ['prayer-summary'] });
      resetPrayer();
      setShowPrayerForm(false);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to create prayer log');
    },
  });

  const updatePrayerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PrayerLogForm> }) =>
      api.put(`/prayer-logs/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prayer-logs'] });
      queryClient.invalidateQueries({ queryKey: ['prayer-summary'] });
      resetPrayer();
      setShowPrayerForm(false);
      setIsEditing(false);
      setSelectedPrayer(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to update prayer log');
    },
  });

  const deletePrayerMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/prayer-logs/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['prayer-logs'] });
      queryClient.invalidateQueries({ queryKey: ['prayer-summary'] });
      if (selectedPrayer?.id === id) {
        setSelectedPrayer(null);
      }
      alert('Prayer log deleted successfully!');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to delete prayer log');
    },
  });

  // Scripture mutations
  const createScriptureMutation = useMutation({
    mutationFn: (data: ScriptureForm) => {
      const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      return api.post('/scriptures', { ...data, tags: tagsArray });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scriptures'] });
      resetScripture();
      setShowScriptureForm(false);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to create scripture');
    },
  });

  const updateScriptureMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScriptureForm> }) => {
      const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      return api.put(`/scriptures/${id}`, { ...data, tags: tagsArray });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scriptures'] });
      resetScripture();
      setShowScriptureForm(false);
      setIsEditing(false);
      setSelectedScripture(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to update scripture');
    },
  });

  const deleteScriptureMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/scriptures/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['scriptures'] });
      if (selectedScripture?.id === id) {
        setSelectedScripture(null);
      }
      alert('Scripture deleted successfully!');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to delete scripture');
    },
  });

  // Reflection mutations
  const createReflectionMutation = useMutation({
    mutationFn: (data: ReflectionForm) => api.post('/spiritual-reflections', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spiritual-reflections'] });
      resetReflection();
      setShowReflectionForm(false);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to create reflection');
    },
  });

  const updateReflectionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ReflectionForm> }) =>
      api.put(`/spiritual-reflections/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spiritual-reflections'] });
      resetReflection();
      setShowReflectionForm(false);
      setIsEditing(false);
      setSelectedReflection(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to update reflection');
    },
  });

  const deleteReflectionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/spiritual-reflections/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['spiritual-reflections'] });
      if (selectedReflection?.id === id) {
        setSelectedReflection(null);
      }
      alert('Reflection deleted successfully!');
    },
    onError: (err: any) => {
      alert(err?.response?.data?.error || 'Failed to delete reflection');
    },
  });

  // Handlers
  const handleCreateGoal = () => {
    setShowGoalForm(true);
    setIsEditing(false);
    setSelectedGoal(null);
    resetGoal({
      title: '',
      description: '',
      goal_type: 'daily',
      target_value: 0,
      current_value: 0,
      target_date: '',
      status: 'active',
    });
  };

  const handleEditGoal = (goal: SpiritualGoal) => {
    setSelectedGoal(goal);
    setIsEditing(true);
    setShowGoalForm(true);
    setGoalValue('title', goal.title);
    setGoalValue('description', goal.description || '');
    setGoalValue('goal_type', goal.goal_type);
    setGoalValue('target_value', goal.target_value || 0);
    setGoalValue('current_value', goal.current_value);
    setGoalValue('target_date', goal.target_date || '');
    setGoalValue('status', goal.status);
  };

  const handleCreatePrayer = () => {
    setShowPrayerForm(true);
    setIsEditing(false);
    setSelectedPrayer(null);
    resetPrayer({
      type: 'prayer',
      duration_minutes: 0,
      notes: '',
      scripture_reference: '',
      logged_on: new Date().toISOString().split('T')[0],
    });
  };

  const handleEditPrayer = (prayer: PrayerLog) => {
    setSelectedPrayer(prayer);
    setIsEditing(true);
    setShowPrayerForm(true);
    setPrayerValue('type', prayer.type);
    setPrayerValue('duration_minutes', prayer.duration_minutes || 0);
    setPrayerValue('notes', prayer.notes || '');
    setPrayerValue('scripture_reference', prayer.scripture_reference || '');
    setPrayerValue('logged_on', prayer.logged_on);
  };

  const handleCreateScripture = () => {
    setShowScriptureForm(true);
    setIsEditing(false);
    setSelectedScripture(null);
    resetScripture({
      type: 'scripture',
      title: '',
      content: '',
      reference: '',
      category: '',
      tags: '',
      is_favorite: false,
    });
  };

  const handleEditScripture = (scripture: Scripture) => {
    setSelectedScripture(scripture);
    setIsEditing(true);
    setShowScriptureForm(true);
    setScriptureValue('type', scripture.type);
    setScriptureValue('title', scripture.title || '');
    setScriptureValue('content', scripture.content);
    setScriptureValue('reference', scripture.reference || '');
    setScriptureValue('category', scripture.category || '');
    setScriptureValue('tags', scripture.tags?.join(', ') || '');
    setScriptureValue('is_favorite', scripture.is_favorite);
  };

  const handleCreateReflection = () => {
    setShowReflectionForm(true);
    setIsEditing(false);
    setSelectedReflection(null);
    resetReflection({
      reflection_type: 'daily',
      content: '',
      reflection_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleEditReflection = (reflection: Reflection) => {
    setSelectedReflection(reflection);
    setIsEditing(true);
    setShowReflectionForm(true);
    setReflectionValue('reflection_type', reflection.reflection_type);
    setReflectionValue('content', reflection.content);
    setReflectionValue('reflection_date', reflection.reflection_date);
  };

  const onGoalSubmit = (data: SpiritualGoalForm) => {
    if (isEditing && selectedGoal) {
      updateGoalMutation.mutate({ id: selectedGoal.id, data });
    } else {
      createGoalMutation.mutate(data);
    }
  };

  const onPrayerSubmit = (data: PrayerLogForm) => {
    if (isEditing && selectedPrayer) {
      updatePrayerMutation.mutate({ id: selectedPrayer.id, data });
    } else {
      createPrayerMutation.mutate(data);
    }
  };

  const onScriptureSubmit = (data: ScriptureForm) => {
    if (isEditing && selectedScripture) {
      updateScriptureMutation.mutate({ id: selectedScripture.id, data });
    } else {
      createScriptureMutation.mutate(data);
    }
  };

  const onReflectionSubmit = (data: ReflectionForm) => {
    if (isEditing && selectedReflection) {
      updateReflectionMutation.mutate({ id: selectedReflection.id, data });
    } else {
      createReflectionMutation.mutate(data);
    }
  };

  return (
    <div className="spiritual">
      <div className="page-header">
        <h1>Spiritual Life</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
              onClick={() => setViewMode('prayers')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'prayers' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'prayers' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Prayers
            </button>
            <button
              onClick={() => setViewMode('scriptures')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'scriptures' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'scriptures' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Scriptures
            </button>
            <button
              onClick={() => setViewMode('reflections')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'reflections' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'reflections' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Reflections
            </button>
          </div>
          {viewMode === 'goals' && (
            <button onClick={handleCreateGoal} className="btn-primary">
              + New Goal
            </button>
          )}
          {viewMode === 'prayers' && (
            <button onClick={handleCreatePrayer} className="btn-primary">
              + Log Prayer
            </button>
          )}
          {viewMode === 'scriptures' && (
            <button onClick={handleCreateScripture} className="btn-primary">
              + Add Scripture
            </button>
          )}
          {viewMode === 'reflections' && (
            <button onClick={handleCreateReflection} className="btn-primary">
              + New Reflection
            </button>
          )}
        </div>
      </div>

      {/* Goals View */}
      {viewMode === 'goals' && (
        <>
          {showGoalForm && (
            <form onSubmit={handleGoalSubmit(onGoalSubmit)} className="spiritual-form">
              <h3>{isEditing ? 'Edit Spiritual Goal' : 'New Spiritual Goal'}</h3>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" {...registerGoal('title', { required: true })} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} {...registerGoal('description')} />
              </div>
              <div className="form-group">
                <label>Goal Type *</label>
                <select {...registerGoal('goal_type', { required: true })}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="form-group">
                <label>Target Value</label>
                <input type="number" min="1" {...registerGoal('target_value', { valueAsNumber: true })} />
              </div>
              <div className="form-group">
                <label>Current Value</label>
                <input type="number" min="0" {...registerGoal('current_value', { valueAsNumber: true })} />
              </div>
              <div className="form-group">
                <label>Target Date</label>
                <input type="date" {...registerGoal('target_date')} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select {...registerGoal('status')}>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="paused">Paused</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createGoalMutation.isPending || updateGoalMutation.isPending}>
                  {isEditing ? 'Update' : 'Create'} Goal
                </button>
                <button type="button" onClick={() => { setShowGoalForm(false); setIsEditing(false); setSelectedGoal(null); resetGoal(); }} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {goalsLoading ? (
            <LoadingSpinner message="Loading spiritual goals..." size="large" />
          ) : goalsError ? (
            <ErrorMessage
              message={goalsError instanceof Error ? goalsError.message : 'Failed to load spiritual goals'}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['spiritual-goals'] })}
            />
          ) : goals && goals.length > 0 ? (
            <div className="goals-list">
              {goals.map((goal) => {
                const progress = goal.target_value ? (goal.current_value / goal.target_value) * 100 : 0;
                return (
                  <div key={goal.id} className="goal-card">
                    <div className="goal-header">
                      <div>
                        <h3>{goal.title}</h3>
                        <span style={{ fontSize: '0.875rem', color: '#666', textTransform: 'capitalize' }}>
                          {goal.goal_type} • {goal.status}
                        </span>
                      </div>
                      <span style={{
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
                    {goal.description && (
                      <p style={{ marginTop: '0.5rem', color: '#666' }}>{goal.description}</p>
                    )}
                    {goal.target_value && (
                      <div style={{ marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span>Progress:</span>
                          <span><strong>{goal.current_value} / {goal.target_value}</strong></span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: progress >= 100 ? '#10b981' : '#667eea', transition: 'width 0.3s' }} />
                        </div>
                        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                          {progress.toFixed(1)}% complete
                        </p>
                      </div>
                    )}
                    {goal.target_date && (
                      <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                        Target: {new Date(goal.target_date).toLocaleDateString()}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button onClick={() => handleEditGoal(goal)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>
                        Edit
                      </button>
                      <button onClick={() => { if (confirm('Are you sure?')) deleteGoalMutation.mutate(goal.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="🎯"
              title="No spiritual goals yet"
              message="Set your first spiritual goal to start tracking your growth."
              actionLabel="Create Goal"
              onAction={handleCreateGoal}
            />
          )}
        </>
      )}

      {/* Prayers View */}
      {viewMode === 'prayers' && (
        <>
          {showPrayerForm && (
            <form onSubmit={handlePrayerSubmit(onPrayerSubmit)} className="spiritual-form">
              <h3>{isEditing ? 'Edit Prayer Log' : 'Log Prayer/Meditation'}</h3>
              <div className="form-group">
                <label>Type *</label>
                <select {...registerPrayer('type', { required: true })}>
                  <option value="prayer">Prayer</option>
                  <option value="meditation">Meditation</option>
                  <option value="worship">Worship</option>
                  <option value="devotion">Devotion</option>
                </select>
              </div>
              <div className="form-group">
                <label>Duration (minutes)</label>
                <input type="number" min="0" {...registerPrayer('duration_minutes', { valueAsNumber: true })} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={4} {...registerPrayer('notes')} placeholder="What did you pray about? What did you learn?" />
              </div>
              <div className="form-group">
                <label>Scripture Reference</label>
                <input type="text" {...registerPrayer('scripture_reference')} placeholder="e.g., John 3:16" />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input type="date" {...registerPrayer('logged_on', { required: true })} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createPrayerMutation.isPending || updatePrayerMutation.isPending}>
                  {isEditing ? 'Update' : 'Log'} Prayer
                </button>
                <button type="button" onClick={() => { setShowPrayerForm(false); setIsEditing(false); setSelectedPrayer(null); resetPrayer(); }} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Prayer Summary */}
          {prayerSummary && prayerSummary.length > 0 && (
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginTop: 0 }}>Prayer Summary</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                {prayerSummary.map((summary: any) => (
                  <div key={summary.type} style={{ background: '#f0f9ff', padding: '1rem', borderRadius: '4px' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', textTransform: 'capitalize' }}>{summary.type}</h4>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>
                      {summary.count} sessions • {summary.total_minutes} minutes • {summary.days_logged} days
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}>
              <option value="all">All Types</option>
              <option value="prayer">Prayer</option>
              <option value="meditation">Meditation</option>
              <option value="worship">Worship</option>
              <option value="devotion">Devotion</option>
            </select>
            {filterType !== 'all' && (
              <button onClick={() => setFilterType('all')} className="btn-secondary">
                Clear Filter
              </button>
            )}
          </div>

          {prayersLoading ? (
            <LoadingSpinner message="Loading prayer logs..." size="large" />
          ) : prayersError ? (
            <ErrorMessage
              message={prayersError instanceof Error ? prayersError.message : 'Failed to load prayer logs'}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['prayer-logs'] })}
            />
          ) : prayers && prayers.length > 0 ? (
            <div className="prayers-list">
              {prayers.map((prayer) => (
                <div key={prayer.id} className="prayer-card">
                  <div className="prayer-header">
                    <div>
                      <h3 style={{ textTransform: 'capitalize', margin: 0 }}>{prayer.type}</h3>
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        {new Date(prayer.logged_on).toLocaleDateString()}
                      </span>
                    </div>
                    {prayer.duration_minutes && (
                      <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#667eea' }}>
                        {prayer.duration_minutes} min
                      </span>
                    )}
                  </div>
                  {prayer.notes && (
                    <p style={{ marginTop: '0.5rem', color: '#666' }}>{prayer.notes}</p>
                  )}
                  {prayer.scripture_reference && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#667eea', fontStyle: 'italic' }}>
                      📖 {prayer.scripture_reference}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditPrayer(prayer)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>
                      Edit
                    </button>
                    <button onClick={() => { if (confirm('Are you sure?')) deletePrayerMutation.mutate(prayer.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="🙏"
              title="No prayer logs yet"
              message="Start tracking your prayer and meditation time."
              actionLabel="Log Prayer"
              onAction={handleCreatePrayer}
            />
          )}
        </>
      )}

      {/* Scriptures View */}
      {viewMode === 'scriptures' && (
        <>
          {showScriptureForm && (
            <form onSubmit={handleScriptureSubmit(onScriptureSubmit)} className="spiritual-form">
              <h3>{isEditing ? 'Edit Scripture' : 'Add Scripture/Affirmation'}</h3>
              <div className="form-group">
                <label>Type *</label>
                <select {...registerScripture('type', { required: true })}>
                  <option value="scripture">Scripture</option>
                  <option value="affirmation">Affirmation</option>
                  <option value="quote">Quote</option>
                  <option value="prayer">Prayer</option>
                </select>
              </div>
              <div className="form-group">
                <label>Title</label>
                <input type="text" {...registerScripture('title')} />
              </div>
              <div className="form-group">
                <label>Content *</label>
                <textarea rows={6} {...registerScripture('content', { required: true })} placeholder="Enter the scripture, affirmation, quote, or prayer..." />
              </div>
              <div className="form-group">
                <label>Reference</label>
                <input type="text" {...registerScripture('reference')} placeholder="e.g., John 3:16" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input type="text" {...registerScripture('category')} placeholder="e.g., Faith, Hope, Love" />
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input type="text" {...registerScripture('tags')} placeholder="e.g., encouragement, strength, peace" />
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" {...registerScripture('is_favorite')} />
                  Mark as favorite
                </label>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createScriptureMutation.isPending || updateScriptureMutation.isPending}>
                  {isEditing ? 'Update' : 'Add'} Scripture
                </button>
                <button type="button" onClick={() => { setShowScriptureForm(false); setIsEditing(false); setSelectedScripture(null); resetScripture(); }} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={filterScriptureType} onChange={(e) => setFilterScriptureType(e.target.value as any)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}>
              <option value="all">All Types</option>
              <option value="scripture">Scripture</option>
              <option value="affirmation">Affirmation</option>
              <option value="quote">Quote</option>
              <option value="prayer">Prayer</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={showFavoritesOnly} onChange={(e) => setShowFavoritesOnly(e.target.checked)} />
              Show favorites only
            </label>
            {(filterScriptureType !== 'all' || showFavoritesOnly) && (
              <button onClick={() => { setFilterScriptureType('all'); setShowFavoritesOnly(false); }} className="btn-secondary">
                Clear Filters
              </button>
            )}
          </div>

          {scripturesLoading ? (
            <LoadingSpinner message="Loading scriptures..." size="large" />
          ) : scripturesError ? (
            <ErrorMessage
              message={scripturesError instanceof Error ? scripturesError.message : 'Failed to load scriptures'}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['scriptures'] })}
            />
          ) : scriptures && scriptures.length > 0 ? (
            <div className="scriptures-list">
              {scriptures.map((scripture) => (
                <div key={scripture.id} className="scripture-card" style={{ borderLeft: scripture.is_favorite ? '4px solid #fbbf24' : '4px solid #e5e7eb' }}>
                  <div className="scripture-header">
                    <div>
                      <h3 style={{ margin: 0, textTransform: 'capitalize' }}>
                        {scripture.title || scripture.type}
                        {scripture.is_favorite && <span style={{ marginLeft: '0.5rem', color: '#fbbf24' }}>⭐</span>}
                      </h3>
                      {scripture.reference && (
                        <span style={{ fontSize: '0.875rem', color: '#667eea', fontStyle: 'italic' }}>
                          {scripture.reference}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#666', textTransform: 'capitalize', padding: '0.25rem 0.5rem', background: '#f3f4f6', borderRadius: '4px' }}>
                      {scripture.type}
                    </span>
                  </div>
                  <p style={{ marginTop: '0.75rem', color: '#333', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {scripture.content}
                  </p>
                  {(scripture.category || (scripture.tags && scripture.tags.length > 0)) && (
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.875rem', color: '#666' }}>
                      {scripture.category && <span>📁 {scripture.category}</span>}
                      {scripture.tags && scripture.tags.length > 0 && <span>🏷️ {scripture.tags.join(', ')}</span>}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditScripture(scripture)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>
                      Edit
                    </button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteScriptureMutation.mutate(scripture.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="📖"
              title="No scriptures yet"
              message="Start building your collection of scriptures, affirmations, and quotes."
              actionLabel="Add Scripture"
              onAction={handleCreateScripture}
            />
          )}
        </>
      )}

      {/* Reflections View */}
      {viewMode === 'reflections' && (
        <>
          {showReflectionForm && (
            <form onSubmit={handleReflectionSubmit(onReflectionSubmit)} className="spiritual-form">
              <h3>{isEditing ? 'Edit Reflection' : 'New Reflection'}</h3>
              <div className="form-group">
                <label>Reflection Type *</label>
                <select {...registerReflection('reflection_type', { required: true })}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Content *</label>
                <textarea rows={8} {...registerReflection('content', { required: true })} placeholder="What are you reflecting on today? What did you learn? How did you grow?" />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input type="date" {...registerReflection('reflection_date', { required: true })} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createReflectionMutation.isPending || updateReflectionMutation.isPending}>
                  {isEditing ? 'Update' : 'Create'} Reflection
                </button>
                <button type="button" onClick={() => { setShowReflectionForm(false); setIsEditing(false); setSelectedReflection(null); resetReflection(); }} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {reflectionsLoading ? (
            <LoadingSpinner message="Loading reflections..." size="large" />
          ) : reflectionsError ? (
            <ErrorMessage
              message={reflectionsError instanceof Error ? reflectionsError.message : 'Failed to load reflections'}
              onRetry={() => queryClient.invalidateQueries({ queryKey: ['spiritual-reflections'] })}
            />
          ) : reflections && reflections.length > 0 ? (
            <div className="reflections-list">
              {reflections.map((reflection) => (
                <div key={reflection.id} className="reflection-card">
                  <div className="reflection-header">
                    <div>
                      <h3 style={{ margin: 0, textTransform: 'capitalize' }}>{reflection.reflection_type} Reflection</h3>
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        {new Date(reflection.reflection_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p style={{ marginTop: '0.75rem', color: '#333', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {reflection.content}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditReflection(reflection)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>
                      Edit
                    </button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteReflectionMutation.mutate(reflection.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon="💭"
              title="No reflections yet"
              message="Start reflecting on your spiritual journey."
              actionLabel="Create Reflection"
              onAction={handleCreateReflection}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Spiritual;
