import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import './TechnicalGrowth.css';

interface PracticeSessionForm {
  practice_type: 'dsa' | 'system_design' | 'coding_challenge' | 'algorithm' | 'data_structure' | 'other';
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  confidence_level: number | '';
  time_spent_minutes: number | '';
  session_date: string;
  notes: string;
  resources: string;
  problem_url: string;
  solution_url: string;
  tags: string;
}

interface EngineeringDocForm {
  doc_type: 'architecture_note' | 'adr' | 'design_decision' | 'learning_summary' | 'code_snippet' | 'markdown_doc' | 'other';
  title: string;
  content: string;
  content_format: 'markdown' | 'plain_text' | 'code';
  category: string;
  tags: string;
  related_resources: string;
}

interface EngineeringWinForm {
  title: string;
  description: string;
  win_type: 'problem_solved' | 'feature_shipped' | 'bug_fixed' | 'performance_improvement' | 'code_quality' | 'learning' | 'other';
  impact: string;
  problem_solved: string;
  lessons_learned: string;
  confidence_level: number | '';
  win_date: string;
  tags: string;
}

interface PracticeSession {
  id: string;
  practice_type: 'dsa' | 'system_design' | 'coding_challenge' | 'algorithm' | 'data_structure' | 'other';
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  confidence_level: number | null;
  time_spent_minutes: number | null;
  session_date: string;
  notes: string | null;
  resources: string[];
  problem_url: string | null;
  solution_url: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface EngineeringDoc {
  id: string;
  doc_type: 'architecture_note' | 'adr' | 'design_decision' | 'learning_summary' | 'code_snippet' | 'markdown_doc' | 'other';
  title: string;
  content: string;
  content_format: 'markdown' | 'plain_text' | 'code';
  category: string | null;
  tags: string[];
  related_resources: string[];
  created_at: string;
  updated_at: string;
}

interface EngineeringWin {
  id: string;
  title: string;
  description: string;
  win_type: 'problem_solved' | 'feature_shipped' | 'bug_fixed' | 'performance_improvement' | 'code_quality' | 'learning' | 'other';
  impact: string | null;
  problem_solved: string | null;
  lessons_learned: string | null;
  confidence_level: number | null;
  win_date: string;
  tags: string[];
  related_practice_id: string | null;
  related_doc_id: string | null;
  created_at: string;
  updated_at: string;
}

const TechnicalGrowth = () => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'practice' | 'docs' | 'wins'>('dashboard');
  const [showPracticeForm, setShowPracticeForm] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
  const [showWinForm, setShowWinForm] = useState(false);
  const [selectedPractice, setSelectedPractice] = useState<PracticeSession | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<EngineeringDoc | null>(null);
  const [selectedWin, setSelectedWin] = useState<EngineeringWin | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Queries
  const { data: practiceSessions, isLoading: practiceLoading, error: practiceError } = useQuery<PracticeSession[]>({
    queryKey: ['practice-sessions'],
    queryFn: () => api.get('/practice-sessions').then(res => res.data),
    enabled: viewMode === 'practice' || viewMode === 'dashboard',
  });

  const { data: practiceSummary } = useQuery({
    queryKey: ['practice-summary'],
    queryFn: () => api.get('/practice-sessions/summary').then(res => res.data),
    enabled: viewMode === 'dashboard',
  });

  const { data: docs, isLoading: docsLoading, error: docsError } = useQuery<EngineeringDoc[]>({
    queryKey: ['engineering-docs'],
    queryFn: () => api.get('/engineering-docs').then(res => res.data),
    enabled: viewMode === 'docs' || viewMode === 'dashboard',
  });

  const { data: wins, isLoading: winsLoading, error: winsError } = useQuery<EngineeringWin[]>({
    queryKey: ['engineering-wins'],
    queryFn: () => api.get('/engineering-wins').then(res => res.data),
    enabled: viewMode === 'wins' || viewMode === 'dashboard',
  });

  const { data: winsSummary } = useQuery({
    queryKey: ['wins-summary'],
    queryFn: () => api.get('/engineering-wins/summary').then(res => res.data),
    enabled: viewMode === 'dashboard',
  });

  // Forms
  const { register: registerPractice, handleSubmit: handlePracticeSubmit, reset: resetPractice, setValue: setPracticeValue } = useForm<PracticeSessionForm>({
    defaultValues: {
      practice_type: 'dsa',
      topic: '',
      difficulty: 'medium',
      confidence_level: '',
      time_spent_minutes: '',
      session_date: new Date().toISOString().split('T')[0],
      notes: '',
      resources: '',
      problem_url: '',
      solution_url: '',
      tags: '',
    },
  });

  const { register: registerDoc, handleSubmit: handleDocSubmit, reset: resetDoc, setValue: setDocValue } = useForm<EngineeringDocForm>({
    defaultValues: {
      doc_type: 'learning_summary',
      title: '',
      content: '',
      content_format: 'markdown',
      category: '',
      tags: '',
      related_resources: '',
    },
  });

  const { register: registerWin, handleSubmit: handleWinSubmit, reset: resetWin, setValue: setWinValue } = useForm<EngineeringWinForm>({
    defaultValues: {
      title: '',
      description: '',
      win_type: 'problem_solved',
      impact: '',
      problem_solved: '',
      lessons_learned: '',
      confidence_level: '',
      win_date: new Date().toISOString().split('T')[0],
      tags: '',
    },
  });

  // Mutations
  const createPracticeMutation = useMutation({
    mutationFn: (data: PracticeSessionForm) => {
      const resourcesArray = data.resources ? data.resources.split(',').map(r => r.trim()).filter(Boolean) : [];
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      return api.post('/practice-sessions', {
        ...data,
        confidence_level: data.confidence_level === '' ? null : data.confidence_level,
        time_spent_minutes: data.time_spent_minutes === '' ? null : data.time_spent_minutes,
        resources: resourcesArray,
        tags: tagsArray,
        problem_url: data.problem_url || null,
        solution_url: data.solution_url || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['practice-summary'] });
      resetPractice();
      setShowPracticeForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create practice session'),
  });

  const updatePracticeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PracticeSessionForm> }) => {
      const payload: any = { ...data };
      if (data.resources) {
        payload.resources = data.resources.split(',').map(r => r.trim()).filter(Boolean);
      }
      if (data.tags) {
        payload.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      if (data.confidence_level === '') payload.confidence_level = null;
      if (data.time_spent_minutes === '') payload.time_spent_minutes = null;
      if (data.problem_url === '') payload.problem_url = null;
      if (data.solution_url === '') payload.solution_url = null;
      return api.put(`/practice-sessions/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['practice-summary'] });
      resetPractice();
      setShowPracticeForm(false);
      setIsEditing(false);
      setSelectedPractice(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update practice session'),
  });

  const deletePracticeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/practice-sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['practice-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['practice-summary'] });
      alert('Practice session deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete practice session'),
  });

  const createDocMutation = useMutation({
    mutationFn: (data: EngineeringDocForm) => {
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const resourcesArray = data.related_resources ? data.related_resources.split(',').map(r => r.trim()).filter(Boolean) : [];
      return api.post('/engineering-docs', {
        ...data,
        category: data.category || null,
        tags: tagsArray,
        related_resources: resourcesArray,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engineering-docs'] });
      resetDoc();
      setShowDocForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create engineering doc'),
  });

  const updateDocMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EngineeringDocForm> }) => {
      const payload: any = { ...data };
      if (data.tags) {
        payload.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      if (data.related_resources) {
        payload.related_resources = data.related_resources.split(',').map(r => r.trim()).filter(Boolean);
      }
      if (data.category === '') payload.category = null;
      return api.put(`/engineering-docs/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engineering-docs'] });
      resetDoc();
      setShowDocForm(false);
      setIsEditing(false);
      setSelectedDoc(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update engineering doc'),
  });

  const deleteDocMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/engineering-docs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engineering-docs'] });
      alert('Engineering doc deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete engineering doc'),
  });

  const createWinMutation = useMutation({
    mutationFn: (data: EngineeringWinForm) => {
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      return api.post('/engineering-wins', {
        ...data,
        impact: data.impact || null,
        problem_solved: data.problem_solved || null,
        lessons_learned: data.lessons_learned || null,
        confidence_level: data.confidence_level === '' ? null : data.confidence_level,
        tags: tagsArray,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engineering-wins'] });
      queryClient.invalidateQueries({ queryKey: ['wins-summary'] });
      resetWin();
      setShowWinForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create engineering win'),
  });

  const updateWinMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<EngineeringWinForm> }) => {
      const payload: any = { ...data };
      if (data.tags) {
        payload.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      if (data.confidence_level === '') payload.confidence_level = null;
      if (data.impact === '') payload.impact = null;
      if (data.problem_solved === '') payload.problem_solved = null;
      if (data.lessons_learned === '') payload.lessons_learned = null;
      return api.put(`/engineering-wins/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engineering-wins'] });
      queryClient.invalidateQueries({ queryKey: ['wins-summary'] });
      resetWin();
      setShowWinForm(false);
      setIsEditing(false);
      setSelectedWin(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update engineering win'),
  });

  const deleteWinMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/engineering-wins/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engineering-wins'] });
      queryClient.invalidateQueries({ queryKey: ['wins-summary'] });
      alert('Engineering win deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete engineering win'),
  });

  // Handlers
  const handleEditPractice = (practice: PracticeSession) => {
    setSelectedPractice(practice);
    setIsEditing(true);
    setShowPracticeForm(true);
    setPracticeValue('practice_type', practice.practice_type);
    setPracticeValue('topic', practice.topic);
    setPracticeValue('difficulty', practice.difficulty);
    setPracticeValue('confidence_level', practice.confidence_level || '');
    setPracticeValue('time_spent_minutes', practice.time_spent_minutes || '');
    setPracticeValue('session_date', practice.session_date);
    setPracticeValue('notes', practice.notes || '');
    setPracticeValue('resources', practice.resources?.join(', ') || '');
    setPracticeValue('problem_url', practice.problem_url || '');
    setPracticeValue('solution_url', practice.solution_url || '');
    setPracticeValue('tags', practice.tags?.join(', ') || '');
  };

  const handleEditDoc = (doc: EngineeringDoc) => {
    setSelectedDoc(doc);
    setIsEditing(true);
    setShowDocForm(true);
    setDocValue('doc_type', doc.doc_type);
    setDocValue('title', doc.title);
    setDocValue('content', doc.content);
    setDocValue('content_format', doc.content_format);
    setDocValue('category', doc.category || '');
    setDocValue('tags', doc.tags?.join(', ') || '');
    setDocValue('related_resources', doc.related_resources?.join(', ') || '');
  };

  const handleEditWin = (win: EngineeringWin) => {
    setSelectedWin(win);
    setIsEditing(true);
    setShowWinForm(true);
    setWinValue('title', win.title);
    setWinValue('description', win.description);
    setWinValue('win_type', win.win_type);
    setWinValue('impact', win.impact || '');
    setWinValue('problem_solved', win.problem_solved || '');
    setWinValue('lessons_learned', win.lessons_learned || '');
    setWinValue('confidence_level', win.confidence_level || '');
    setWinValue('win_date', win.win_date);
    setWinValue('tags', win.tags?.join(', ') || '');
  };

  const onPracticeSubmit = (data: PracticeSessionForm) => {
    if (isEditing && selectedPractice) {
      updatePracticeMutation.mutate({ id: selectedPractice.id, data });
    } else {
      createPracticeMutation.mutate(data);
    }
  };

  const onDocSubmit = (data: EngineeringDocForm) => {
    if (isEditing && selectedDoc) {
      updateDocMutation.mutate({ id: selectedDoc.id, data });
    } else {
      createDocMutation.mutate(data);
    }
  };

  const onWinSubmit = (data: EngineeringWinForm) => {
    if (isEditing && selectedWin) {
      updateWinMutation.mutate({ id: selectedWin.id, data });
    } else {
      createWinMutation.mutate(data);
    }
  };

  // Dashboard calculations
  const thisWeekPractice = useMemo(() => {
    if (!practiceSessions) return { count: 0, minutes: 0 };
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSessions = practiceSessions.filter(p => new Date(p.session_date) >= weekAgo);
    return {
      count: weekSessions.length,
      minutes: weekSessions.reduce((sum, p) => sum + (p.time_spent_minutes || 0), 0),
    };
  }, [practiceSessions]);

  return (
    <div className="technical-growth">
      <div className="page-header">
        <h1>Technical Growth</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => setViewMode('dashboard')} className={`view-mode-btn ${viewMode === 'dashboard' ? 'active' : ''}`}>Dashboard</button>
            <button onClick={() => setViewMode('practice')} className={`view-mode-btn ${viewMode === 'practice' ? 'active' : ''}`}>Practice</button>
            <button onClick={() => setViewMode('docs')} className={`view-mode-btn ${viewMode === 'docs' ? 'active' : ''}`}>Documentation</button>
            <button onClick={() => setViewMode('wins')} className={`view-mode-btn ${viewMode === 'wins' ? 'active' : ''}`}>Wins</button>
          </div>
          {viewMode === 'practice' && <button onClick={() => { setShowPracticeForm(true); setIsEditing(false); setSelectedPractice(null); resetPractice(); }} className="btn-primary">+ Log Practice</button>}
          {viewMode === 'docs' && <button onClick={() => { setShowDocForm(true); setIsEditing(false); setSelectedDoc(null); resetDoc(); }} className="btn-primary">+ New Doc</button>}
          {viewMode === 'wins' && <button onClick={() => { setShowWinForm(true); setIsEditing(false); setSelectedWin(null); resetWin(); }} className="btn-primary">+ Add Win</button>}
        </div>
      </div>

      {/* Dashboard View */}
      {viewMode === 'dashboard' && (
        <div className="growth-dashboard">
          {/* Practice This Week */}
          <div className="dashboard-section">
            <h2>Practice This Week</h2>
            {practiceLoading ? (
              <LoadingSpinner size="small" />
            ) : practiceSessions && practiceSessions.length > 0 ? (
              <div>
                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  {thisWeekPractice.count} sessions • {Math.round(thisWeekPractice.minutes / 60)}h {thisWeekPractice.minutes % 60}m
                </p>
                {practiceSummary && practiceSummary.length > 0 && (
                  <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.75rem' }}>
                    {practiceSummary.slice(0, 3).map((summary: any) => (
                      <div key={summary.practice_type} style={{ fontSize: '0.875rem', color: '#666' }}>
                        • {summary.practice_type.replace('_', ' ')}: {summary.session_count} sessions
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>No practice sessions this week</p>
            )}
          </div>

          {/* Knowledge Captured */}
          <div className="dashboard-section">
            <h2>Knowledge Captured</h2>
            {docsLoading ? (
              <LoadingSpinner size="small" />
            ) : docs && docs.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {docs.slice(0, 3).map((doc) => (
                  <div key={doc.id} style={{ fontSize: '0.875rem', color: '#666' }}>
                    • {doc.title} ({doc.doc_type.replace('_', ' ')})
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>No docs created yet</p>
            )}
          </div>

          {/* Wins & Evidence */}
          <div className="dashboard-section">
            <h2>Wins & Evidence</h2>
            {winsLoading ? (
              <LoadingSpinner size="small" />
            ) : wins && wins.length > 0 ? (
              <div>
                {winsSummary && (
                  <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.75rem' }}>
                    {winsSummary.total_wins} wins • {winsSummary.problems_solved} problems solved • Avg confidence: {winsSummary.avg_confidence ? Math.round(winsSummary.avg_confidence) : 0}%
                  </p>
                )}
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {wins.slice(0, 3).map((win) => (
                    <div key={win.id} style={{ fontSize: '0.875rem' }}>
                      ✔ {win.title}
                      {win.confidence_level && (
                        <span style={{ marginLeft: '0.5rem', color: '#666' }}>({win.confidence_level}% confidence)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>No wins logged yet</p>
            )}
          </div>
        </div>
      )}

      {/* Practice View */}
      {viewMode === 'practice' && (
        <>
          {showPracticeForm && (
            <form onSubmit={handlePracticeSubmit(onPracticeSubmit)} className="growth-form">
              <h3>{isEditing ? 'Edit Practice Session' : 'Log Practice Session'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Practice Type *</label>
                  <select {...registerPractice('practice_type', { required: true })}>
                    <option value="dsa">DSA</option>
                    <option value="system_design">System Design</option>
                    <option value="coding_challenge">Coding Challenge</option>
                    <option value="algorithm">Algorithm</option>
                    <option value="data_structure">Data Structure</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Topic *</label>
                  <input type="text" {...registerPractice('topic', { required: true })} placeholder="e.g., Graphs, Rate Limiter" />
                </div>
                <div className="form-group">
                  <label>Difficulty</label>
                  <select {...registerPractice('difficulty')}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Session Date</label>
                  <input type="date" {...registerPractice('session_date')} />
                </div>
                <div className="form-group">
                  <label>Time Spent (minutes)</label>
                  <input type="number" {...registerPractice('time_spent_minutes')} min="0" />
                </div>
                <div className="form-group">
                  <label>Confidence Level (0-100)</label>
                  <input type="number" {...registerPractice('confidence_level')} min="0" max="100" />
                </div>
              </div>
              <div className="form-group">
                <label>Problem URL</label>
                <input type="url" {...registerPractice('problem_url')} placeholder="LeetCode, HackerRank, etc." />
              </div>
              <div className="form-group">
                <label>Solution URL</label>
                <input type="url" {...registerPractice('solution_url')} placeholder="Link to your solution" />
              </div>
              <div className="form-group">
                <label>Resources (comma-separated)</label>
                <input type="text" {...registerPractice('resources')} placeholder="Links to notes, repos, etc." />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={4} {...registerPractice('notes')} placeholder="What did you learn? What was challenging?" />
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input type="text" {...registerPractice('tags')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createPracticeMutation.isPending || updatePracticeMutation.isPending}>
                  {isEditing ? 'Update' : 'Log'} Session
                </button>
                <button type="button" onClick={() => { setShowPracticeForm(false); setIsEditing(false); setSelectedPractice(null); resetPractice(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {practiceLoading ? (
            <LoadingSpinner message="Loading practice sessions..." size="large" />
          ) : practiceError ? (
            <ErrorMessage message={practiceError instanceof Error ? practiceError.message : 'Failed to load practice sessions'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['practice-sessions'] })} />
          ) : practiceSessions && practiceSessions.length > 0 ? (
            <div className="practice-list">
              {practiceSessions.map((session) => (
                <div key={session.id} className="practice-card">
                  <div className="practice-header">
                    <div>
                      <h3>{session.topic}</h3>
                      <span style={{ fontSize: '0.875rem', color: '#666', textTransform: 'capitalize' }}>
                        {session.practice_type.replace('_', ' ')} • {session.difficulty} • {new Date(session.session_date).toLocaleDateString()}
                        {session.time_spent_minutes && ` • ${Math.floor(session.time_spent_minutes / 60)}h ${session.time_spent_minutes % 60}m`}
                      </span>
                    </div>
                  </div>
                  {session.notes && <p style={{ marginTop: '0.5rem', color: '#666' }}>{session.notes}</p>}
                  {session.confidence_level && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Confidence:</strong> {session.confidence_level}%
                    </div>
                  )}
                  {session.problem_url && (
                    <a href={session.problem_url} target="_blank" rel="noopener noreferrer" style={{ marginTop: '0.5rem', display: 'inline-block', color: '#667eea' }}>
                      View Problem →
                    </a>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditPractice(session)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deletePracticeMutation.mutate(session.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="💻" title="No practice sessions yet" message="Start logging your technical practice to track your growth." actionLabel="Log Practice" onAction={() => { setShowPracticeForm(true); setIsEditing(false); setSelectedPractice(null); resetPractice(); }} />
          )}
        </>
      )}

      {/* Documentation View */}
      {viewMode === 'docs' && (
        <>
          {showDocForm && (
            <form onSubmit={handleDocSubmit(onDocSubmit)} className="growth-form">
              <h3>{isEditing ? 'Edit Documentation' : 'New Documentation'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Document Type *</label>
                  <select {...registerDoc('doc_type', { required: true })}>
                    <option value="architecture_note">Architecture Note</option>
                    <option value="adr">ADR (Architecture Decision Record)</option>
                    <option value="design_decision">Design Decision</option>
                    <option value="learning_summary">Learning Summary</option>
                    <option value="code_snippet">Code Snippet</option>
                    <option value="markdown_doc">Markdown Doc</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Content Format</label>
                  <select {...registerDoc('content_format')}>
                    <option value="markdown">Markdown</option>
                    <option value="plain_text">Plain Text</option>
                    <option value="code">Code</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" {...registerDoc('title', { required: true })} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input type="text" {...registerDoc('category')} placeholder="e.g., Backend, Frontend, Infrastructure" />
              </div>
              <div className="form-group">
                <label>Content *</label>
                <textarea rows={10} {...registerDoc('content', { required: true })} placeholder="Write your documentation here..." />
              </div>
              <div className="form-group">
                <label>Related Resources (comma-separated)</label>
                <input type="text" {...registerDoc('related_resources')} placeholder="Links to related docs, repos, etc." />
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input type="text" {...registerDoc('tags')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createDocMutation.isPending || updateDocMutation.isPending}>
                  {isEditing ? 'Update' : 'Create'} Doc
                </button>
                <button type="button" onClick={() => { setShowDocForm(false); setIsEditing(false); setSelectedDoc(null); resetDoc(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {docsLoading ? (
            <LoadingSpinner message="Loading documentation..." size="large" />
          ) : docsError ? (
            <ErrorMessage message={docsError instanceof Error ? docsError.message : 'Failed to load documentation'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['engineering-docs'] })} />
          ) : docs && docs.length > 0 ? (
            <div className="docs-list">
              {docs.map((doc) => (
                <div key={doc.id} className="doc-card">
                  <div className="doc-header">
                    <div>
                      <h3>{doc.title}</h3>
                      <span style={{ fontSize: '0.875rem', color: '#666', textTransform: 'capitalize' }}>
                        {doc.doc_type.replace('_', ' ')}
                        {doc.category && ` • ${doc.category}`}
                        {` • Updated: ${new Date(doc.updated_at).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '4px', maxHeight: '200px', overflow: 'auto' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.875rem' }}>{doc.content.substring(0, 500)}{doc.content.length > 500 ? '...' : ''}</pre>
                  </div>
                  {doc.tags && doc.tags.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Tags:</strong> {doc.tags.join(', ')}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditDoc(doc)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteDocMutation.mutate(doc.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="📚" title="No documentation yet" message="Capture your engineering knowledge and decisions." actionLabel="Create Doc" onAction={() => { setShowDocForm(true); setIsEditing(false); setSelectedDoc(null); resetDoc(); }} />
          )}
        </>
      )}

      {/* Wins View */}
      {viewMode === 'wins' && (
        <>
          {showWinForm && (
            <form onSubmit={handleWinSubmit(onWinSubmit)} className="growth-form">
              <h3>{isEditing ? 'Edit Engineering Win' : 'Add Engineering Win'}</h3>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" {...registerWin('title', { required: true })} placeholder="e.g., Solved rate-limiter design" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Win Type</label>
                  <select {...registerWin('win_type')}>
                    <option value="problem_solved">Problem Solved</option>
                    <option value="feature_shipped">Feature Shipped</option>
                    <option value="bug_fixed">Bug Fixed</option>
                    <option value="performance_improvement">Performance Improvement</option>
                    <option value="code_quality">Code Quality</option>
                    <option value="learning">Learning</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Win Date</label>
                  <input type="date" {...registerWin('win_date')} />
                </div>
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea rows={4} {...registerWin('description', { required: true })} placeholder="What did you accomplish?" />
              </div>
              <div className="form-group">
                <label>Problem Solved</label>
                <textarea rows={2} {...registerWin('problem_solved')} placeholder="What problem did you solve?" />
              </div>
              <div className="form-group">
                <label>Impact</label>
                <textarea rows={2} {...registerWin('impact')} placeholder="What was the impact?" />
              </div>
              <div className="form-group">
                <label>Lessons Learned</label>
                <textarea rows={3} {...registerWin('lessons_learned')} placeholder="What did you learn?" />
              </div>
              <div className="form-group">
                <label>Confidence Level (0-100)</label>
                <input type="number" {...registerWin('confidence_level')} min="0" max="100" />
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input type="text" {...registerWin('tags')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createWinMutation.isPending || updateWinMutation.isPending}>
                  {isEditing ? 'Update' : 'Add'} Win
                </button>
                <button type="button" onClick={() => { setShowWinForm(false); setIsEditing(false); setSelectedWin(null); resetWin(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {winsLoading ? (
            <LoadingSpinner message="Loading engineering wins..." size="large" />
          ) : winsError ? (
            <ErrorMessage message={winsError instanceof Error ? winsError.message : 'Failed to load engineering wins'} onRetry={() => queryClient.invalidateQueries({ queryKey: ['engineering-wins'] })} />
          ) : wins && wins.length > 0 ? (
            <div className="wins-list">
              {wins.map((win) => (
                <div key={win.id} className="win-card">
                  <div className="win-header">
                    <div>
                      <h3>{win.title}</h3>
                      <span style={{ fontSize: '0.875rem', color: '#666', textTransform: 'capitalize' }}>
                        {win.win_type.replace('_', ' ')} • {new Date(win.win_date).toLocaleDateString()}
                        {win.confidence_level && ` • ${win.confidence_level}% confidence`}
                      </span>
                    </div>
                  </div>
                  <p style={{ marginTop: '0.5rem', color: '#666' }}>{win.description}</p>
                  {win.problem_solved && (
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '4px' }}>
                      <strong>Problem Solved:</strong> {win.problem_solved}
                    </div>
                  )}
                  {win.impact && (
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#d1fae5', borderRadius: '4px' }}>
                      <strong>Impact:</strong> {win.impact}
                    </div>
                  )}
                  {win.lessons_learned && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Lessons:</strong> {win.lessons_learned}
                    </div>
                  )}
                  {win.tags && win.tags.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Tags:</strong> {win.tags.join(', ')}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditWin(win)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteWinMutation.mutate(win.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🏆" title="No engineering wins yet" message="Track your engineering achievements and growth." actionLabel="Add Win" onAction={() => { setShowWinForm(true); setIsEditing(false); setSelectedWin(null); resetWin(); }} />
          )}
        </>
      )}
    </div>
  );
};

export default TechnicalGrowth;
