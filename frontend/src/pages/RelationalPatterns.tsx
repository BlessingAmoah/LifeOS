import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import './RelationalPatterns.css';

interface JournalEntryForm {
  content: string;
  entry_date: string;
  relationship_type: string;
  emotion_tag: string;
  tags: string;
}

interface ConflictReflectionForm {
  trigger: string;
  my_response: string;
  conflict_date: string;
  their_response: string;
  outcome: string;
  what_i_would_do_differently: string;
  relationship_type: string;
  tags: string;
}

interface CommunicationPatternForm {
  pattern_type: 'listening' | 'avoidance' | 'defensiveness' | 'assertiveness' | 'over_explaining' | 'other';
  pattern_date: string;
  notes: string;
  relationship_type: string;
  tags: string;
}

interface BoundaryNoteForm {
  boundary_type: 'set' | 'violated' | 'held' | 'compromised';
  description: string;
  boundary_date: string;
  with_whom: string;
  result: string;
  emotional_impact: string;
  relationship_type: string;
  tags: string;
}

interface LessonForm {
  lesson: string;
  learned_date: string;
  source_type: string;
  tags: string;
}

interface JournalEntry {
  id: string;
  content: string;
  entry_date: string;
  relationship_type: string | null;
  emotion_tag: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface ConflictReflection {
  id: string;
  trigger: string;
  my_response: string;
  conflict_date: string;
  their_response: string | null;
  outcome: string | null;
  what_i_would_do_differently: string | null;
  relationship_type: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface CommunicationPattern {
  id: string;
  pattern_type: 'listening' | 'avoidance' | 'defensiveness' | 'assertiveness' | 'over_explaining' | 'other';
  pattern_date: string;
  notes: string | null;
  relationship_type: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface BoundaryNote {
  id: string;
  boundary_type: 'set' | 'violated' | 'held' | 'compromised';
  description: string;
  boundary_date: string;
  with_whom: string | null;
  result: string | null;
  emotional_impact: string | null;
  relationship_type: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface RelationalLesson {
  id: string;
  lesson: string;
  learned_date: string;
  source_type: string | null;
  source_id: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const RelationalPatterns = () => {
  const [viewMode, setViewMode] = useState<'dashboard' | 'journal' | 'conflicts' | 'patterns' | 'boundaries' | 'lessons'>('dashboard');
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [showConflictForm, setShowConflictForm] = useState(false);
  const [showPatternForm, setShowPatternForm] = useState(false);
  const [showBoundaryForm, setShowBoundaryForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<ConflictReflection | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<CommunicationPattern | null>(null);
  const [selectedBoundary, setSelectedBoundary] = useState<BoundaryNote | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<RelationalLesson | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  // Queries
  const { data: journalEntries, isLoading: journalLoading } = useQuery<JournalEntry[]>({
    queryKey: ['relationship-journal'],
    queryFn: () => api.get('/relationship-journal').then(res => res.data),
    enabled: viewMode === 'journal' || viewMode === 'dashboard',
  });

  const { data: conflicts, isLoading: conflictsLoading } = useQuery<ConflictReflection[]>({
    queryKey: ['conflict-reflections'],
    queryFn: () => api.get('/conflict-reflections').then(res => res.data),
    enabled: viewMode === 'conflicts' || viewMode === 'dashboard',
  });

  const { data: patterns, isLoading: patternsLoading } = useQuery<CommunicationPattern[]>({
    queryKey: ['communication-patterns'],
    queryFn: () => api.get('/communication-patterns').then(res => res.data),
    enabled: viewMode === 'patterns' || viewMode === 'dashboard',
  });

  const { data: patternsSummary } = useQuery({
    queryKey: ['communication-patterns-summary'],
    queryFn: () => api.get('/communication-patterns/summary').then(res => res.data),
    enabled: viewMode === 'dashboard',
  });

  const { data: boundaries, isLoading: boundariesLoading } = useQuery<BoundaryNote[]>({
    queryKey: ['boundaries-notes'],
    queryFn: () => api.get('/boundaries-notes').then(res => res.data),
    enabled: viewMode === 'boundaries' || viewMode === 'dashboard',
  });

  const { data: boundariesSummary } = useQuery({
    queryKey: ['boundaries-summary'],
    queryFn: () => api.get('/boundaries-notes/summary').then(res => res.data),
    enabled: viewMode === 'dashboard',
  });

  const { data: lessons, isLoading: lessonsLoading } = useQuery<RelationalLesson[]>({
    queryKey: ['relational-lessons'],
    queryFn: () => api.get('/relational-lessons').then(res => res.data),
    enabled: viewMode === 'lessons' || viewMode === 'dashboard',
  });

  // Forms
  const { register: registerJournal, handleSubmit: handleJournalSubmit, reset: resetJournal, setValue: setJournalValue } = useForm<JournalEntryForm>({
    defaultValues: {
      content: '',
      entry_date: new Date().toISOString().split('T')[0],
      relationship_type: '',
      emotion_tag: '',
      tags: '',
    },
  });

  const { register: registerConflict, handleSubmit: handleConflictSubmit, reset: resetConflict, setValue: setConflictValue } = useForm<ConflictReflectionForm>({
    defaultValues: {
      trigger: '',
      my_response: '',
      conflict_date: new Date().toISOString().split('T')[0],
      their_response: '',
      outcome: '',
      what_i_would_do_differently: '',
      relationship_type: '',
      tags: '',
    },
  });

  const { register: registerPattern, handleSubmit: handlePatternSubmit, reset: resetPattern, setValue: setPatternValue } = useForm<CommunicationPatternForm>({
    defaultValues: {
      pattern_type: 'listening',
      pattern_date: new Date().toISOString().split('T')[0],
      notes: '',
      relationship_type: '',
      tags: '',
    },
  });

  const { register: registerBoundary, handleSubmit: handleBoundarySubmit, reset: resetBoundary, setValue: setBoundaryValue } = useForm<BoundaryNoteForm>({
    defaultValues: {
      boundary_type: 'set',
      description: '',
      boundary_date: new Date().toISOString().split('T')[0],
      with_whom: '',
      result: '',
      emotional_impact: '',
      relationship_type: '',
      tags: '',
    },
  });

  const { register: registerLesson, handleSubmit: handleLessonSubmit, reset: resetLesson, setValue: setLessonValue } = useForm<LessonForm>({
    defaultValues: {
      lesson: '',
      learned_date: new Date().toISOString().split('T')[0],
      source_type: '',
      tags: '',
    },
  });

  // Mutations
  const createJournalMutation = useMutation({
    mutationFn: (data: JournalEntryForm) => {
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      return api.post('/relationship-journal', {
        ...data,
        relationship_type: data.relationship_type || null,
        emotion_tag: data.emotion_tag || null,
        tags: tagsArray,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-journal'] });
      resetJournal();
      setShowJournalForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create journal entry'),
  });

  const updateJournalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JournalEntryForm> }) => {
      const payload: any = { ...data };
      if (data.tags) {
        payload.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      if (data.relationship_type === '') payload.relationship_type = null;
      if (data.emotion_tag === '') payload.emotion_tag = null;
      return api.put(`/relationship-journal/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-journal'] });
      resetJournal();
      setShowJournalForm(false);
      setIsEditing(false);
      setSelectedJournal(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update journal entry'),
  });

  const deleteJournalMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/relationship-journal/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relationship-journal'] });
      alert('Journal entry deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete journal entry'),
  });

  const createConflictMutation = useMutation({
    mutationFn: (data: ConflictReflectionForm) => {
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      return api.post('/conflict-reflections', {
        ...data,
        their_response: data.their_response || null,
        outcome: data.outcome || null,
        what_i_would_do_differently: data.what_i_would_do_differently || null,
        relationship_type: data.relationship_type || null,
        tags: tagsArray,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conflict-reflections'] });
      resetConflict();
      setShowConflictForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create conflict reflection'),
  });

  const updateConflictMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ConflictReflectionForm> }) => {
      const payload: any = { ...data };
      if (data.tags) {
        payload.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      if (data.their_response === '') payload.their_response = null;
      if (data.outcome === '') payload.outcome = null;
      if (data.what_i_would_do_differently === '') payload.what_i_would_do_differently = null;
      if (data.relationship_type === '') payload.relationship_type = null;
      return api.put(`/conflict-reflections/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conflict-reflections'] });
      resetConflict();
      setShowConflictForm(false);
      setIsEditing(false);
      setSelectedConflict(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update conflict reflection'),
  });

  const deleteConflictMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/conflict-reflections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conflict-reflections'] });
      alert('Conflict reflection deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete conflict reflection'),
  });

  const createPatternMutation = useMutation({
    mutationFn: (data: CommunicationPatternForm) => {
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      return api.post('/communication-patterns', {
        ...data,
        notes: data.notes || null,
        relationship_type: data.relationship_type || null,
        tags: tagsArray,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-patterns'] });
      queryClient.invalidateQueries({ queryKey: ['communication-patterns-summary'] });
      resetPattern();
      setShowPatternForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create communication pattern'),
  });

  const updatePatternMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CommunicationPatternForm> }) => {
      const payload: any = { ...data };
      if (data.tags) {
        payload.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      if (data.notes === '') payload.notes = null;
      if (data.relationship_type === '') payload.relationship_type = null;
      return api.put(`/communication-patterns/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-patterns'] });
      queryClient.invalidateQueries({ queryKey: ['communication-patterns-summary'] });
      resetPattern();
      setShowPatternForm(false);
      setIsEditing(false);
      setSelectedPattern(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update communication pattern'),
  });

  const deletePatternMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/communication-patterns/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communication-patterns'] });
      queryClient.invalidateQueries({ queryKey: ['communication-patterns-summary'] });
      alert('Communication pattern deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete communication pattern'),
  });

  const createBoundaryMutation = useMutation({
    mutationFn: (data: BoundaryNoteForm) => {
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      return api.post('/boundaries-notes', {
        ...data,
        with_whom: data.with_whom || null,
        result: data.result || null,
        emotional_impact: data.emotional_impact || null,
        relationship_type: data.relationship_type || null,
        tags: tagsArray,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boundaries-notes'] });
      queryClient.invalidateQueries({ queryKey: ['boundaries-summary'] });
      resetBoundary();
      setShowBoundaryForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create boundary note'),
  });

  const updateBoundaryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BoundaryNoteForm> }) => {
      const payload: any = { ...data };
      if (data.tags) {
        payload.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      if (data.with_whom === '') payload.with_whom = null;
      if (data.result === '') payload.result = null;
      if (data.emotional_impact === '') payload.emotional_impact = null;
      if (data.relationship_type === '') payload.relationship_type = null;
      return api.put(`/boundaries-notes/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boundaries-notes'] });
      queryClient.invalidateQueries({ queryKey: ['boundaries-summary'] });
      resetBoundary();
      setShowBoundaryForm(false);
      setIsEditing(false);
      setSelectedBoundary(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update boundary note'),
  });

  const deleteBoundaryMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/boundaries-notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boundaries-notes'] });
      queryClient.invalidateQueries({ queryKey: ['boundaries-summary'] });
      alert('Boundary note deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete boundary note'),
  });

  const createLessonMutation = useMutation({
    mutationFn: (data: LessonForm) => {
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      return api.post('/relational-lessons', {
        ...data,
        source_type: data.source_type || null,
        tags: tagsArray,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relational-lessons'] });
      resetLesson();
      setShowLessonForm(false);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to create lesson'),
  });

  const updateLessonMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LessonForm> }) => {
      const payload: any = { ...data };
      if (data.tags) {
        payload.tags = data.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
      if (data.source_type === '') payload.source_type = null;
      return api.put(`/relational-lessons/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relational-lessons'] });
      resetLesson();
      setShowLessonForm(false);
      setIsEditing(false);
      setSelectedLesson(null);
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to update lesson'),
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/relational-lessons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relational-lessons'] });
      alert('Lesson deleted successfully!');
    },
    onError: (err: any) => alert(err?.response?.data?.error || 'Failed to delete lesson'),
  });

  // Handlers
  const handleEditJournal = (entry: JournalEntry) => {
    setSelectedJournal(entry);
    setIsEditing(true);
    setShowJournalForm(true);
    setJournalValue('content', entry.content);
    setJournalValue('entry_date', entry.entry_date);
    setJournalValue('relationship_type', entry.relationship_type || '');
    setJournalValue('emotion_tag', entry.emotion_tag || '');
    setJournalValue('tags', entry.tags?.join(', ') || '');
  };

  const handleEditConflict = (conflict: ConflictReflection) => {
    setSelectedConflict(conflict);
    setIsEditing(true);
    setShowConflictForm(true);
    setConflictValue('trigger', conflict.trigger);
    setConflictValue('my_response', conflict.my_response);
    setConflictValue('conflict_date', conflict.conflict_date);
    setConflictValue('their_response', conflict.their_response || '');
    setConflictValue('outcome', conflict.outcome || '');
    setConflictValue('what_i_would_do_differently', conflict.what_i_would_do_differently || '');
    setConflictValue('relationship_type', conflict.relationship_type || '');
    setConflictValue('tags', conflict.tags?.join(', ') || '');
  };

  const handleEditPattern = (pattern: CommunicationPattern) => {
    setSelectedPattern(pattern);
    setIsEditing(true);
    setShowPatternForm(true);
    setPatternValue('pattern_type', pattern.pattern_type);
    setPatternValue('pattern_date', pattern.pattern_date);
    setPatternValue('notes', pattern.notes || '');
    setPatternValue('relationship_type', pattern.relationship_type || '');
    setPatternValue('tags', pattern.tags?.join(', ') || '');
  };

  const handleEditBoundary = (boundary: BoundaryNote) => {
    setSelectedBoundary(boundary);
    setIsEditing(true);
    setShowBoundaryForm(true);
    setBoundaryValue('boundary_type', boundary.boundary_type);
    setBoundaryValue('description', boundary.description);
    setBoundaryValue('boundary_date', boundary.boundary_date);
    setBoundaryValue('with_whom', boundary.with_whom || '');
    setBoundaryValue('result', boundary.result || '');
    setBoundaryValue('emotional_impact', boundary.emotional_impact || '');
    setBoundaryValue('relationship_type', boundary.relationship_type || '');
    setBoundaryValue('tags', boundary.tags?.join(', ') || '');
  };

  const handleEditLesson = (lesson: RelationalLesson) => {
    setSelectedLesson(lesson);
    setIsEditing(true);
    setShowLessonForm(true);
    setLessonValue('lesson', lesson.lesson);
    setLessonValue('learned_date', lesson.learned_date);
    setLessonValue('source_type', lesson.source_type || '');
    setLessonValue('tags', lesson.tags?.join(', ') || '');
  };

  const onJournalSubmit = (data: JournalEntryForm) => {
    if (isEditing && selectedJournal) {
      updateJournalMutation.mutate({ id: selectedJournal.id, data });
    } else {
      createJournalMutation.mutate(data);
    }
  };

  const onConflictSubmit = (data: ConflictReflectionForm) => {
    if (isEditing && selectedConflict) {
      updateConflictMutation.mutate({ id: selectedConflict.id, data });
    } else {
      createConflictMutation.mutate(data);
    }
  };

  const onPatternSubmit = (data: CommunicationPatternForm) => {
    if (isEditing && selectedPattern) {
      updatePatternMutation.mutate({ id: selectedPattern.id, data });
    } else {
      createPatternMutation.mutate(data);
    }
  };

  const onBoundarySubmit = (data: BoundaryNoteForm) => {
    if (isEditing && selectedBoundary) {
      updateBoundaryMutation.mutate({ id: selectedBoundary.id, data });
    } else {
      createBoundaryMutation.mutate(data);
    }
  };

  const onLessonSubmit = (data: LessonForm) => {
    if (isEditing && selectedLesson) {
      updateLessonMutation.mutate({ id: selectedLesson.id, data });
    } else {
      createLessonMutation.mutate(data);
    }
  };

  // Dashboard calculations
  const recentReflections = useMemo(() => {
    const items: Array<{ type: string; text: string; date: string }> = [];
    if (conflicts && conflicts.length > 0) {
      conflicts.slice(0, 2).forEach(c => {
        items.push({ type: 'Conflict', text: c.trigger, date: c.conflict_date });
      });
    }
    if (journalEntries && journalEntries.length > 0) {
      journalEntries.slice(0, 2).forEach(j => {
        items.push({ type: 'Journal', text: j.content.substring(0, 50) + '...', date: j.entry_date });
      });
    }
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 3);
  }, [conflicts, journalEntries]);

  const commonPatterns = useMemo(() => {
    if (!patternsSummary || patternsSummary.length === 0) return [];
    return patternsSummary.slice(0, 3).map((p: any) => ({
      type: p.pattern_type.replace('_', ' '),
      count: p.pattern_count,
    }));
  }, [patternsSummary]);

  return (
    <div className="relational-patterns">
      <div className="page-header">
        <h1>Relational Patterns</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => setViewMode('dashboard')} className={`view-mode-btn ${viewMode === 'dashboard' ? 'active' : ''}`}>Dashboard</button>
            <button onClick={() => setViewMode('journal')} className={`view-mode-btn ${viewMode === 'journal' ? 'active' : ''}`}>Journal</button>
            <button onClick={() => setViewMode('conflicts')} className={`view-mode-btn ${viewMode === 'conflicts' ? 'active' : ''}`}>Conflicts</button>
            <button onClick={() => setViewMode('patterns')} className={`view-mode-btn ${viewMode === 'patterns' ? 'active' : ''}`}>Patterns</button>
            <button onClick={() => setViewMode('boundaries')} className={`view-mode-btn ${viewMode === 'boundaries' ? 'active' : ''}`}>Boundaries</button>
            <button onClick={() => setViewMode('lessons')} className={`view-mode-btn ${viewMode === 'lessons' ? 'active' : ''}`}>Lessons</button>
          </div>
          {viewMode === 'journal' && <button onClick={() => { setShowJournalForm(true); setIsEditing(false); setSelectedJournal(null); resetJournal(); }} className="btn-primary">+ New Entry</button>}
          {viewMode === 'conflicts' && <button onClick={() => { setShowConflictForm(true); setIsEditing(false); setSelectedConflict(null); resetConflict(); }} className="btn-primary">+ Add Reflection</button>}
          {viewMode === 'patterns' && <button onClick={() => { setShowPatternForm(true); setIsEditing(false); setSelectedPattern(null); resetPattern(); }} className="btn-primary">+ Log Pattern</button>}
          {viewMode === 'boundaries' && <button onClick={() => { setShowBoundaryForm(true); setIsEditing(false); setSelectedBoundary(null); resetBoundary(); }} className="btn-primary">+ Add Boundary</button>}
          {viewMode === 'lessons' && <button onClick={() => { setShowLessonForm(true); setIsEditing(false); setSelectedLesson(null); resetLesson(); }} className="btn-primary">+ Add Lesson</button>}
        </div>
      </div>

      {/* Dashboard View */}
      {viewMode === 'dashboard' && (
        <div className="patterns-dashboard">
          {/* Recent Reflections */}
          <div className="dashboard-section">
            <h2>Recent Reflections</h2>
            {journalLoading || conflictsLoading ? (
              <LoadingSpinner size="small" />
            ) : recentReflections.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {recentReflections.map((item, idx) => (
                  <div key={idx} style={{ fontSize: '0.875rem', color: '#666' }}>
                    • {item.type}: {item.text} ({new Date(item.date).toLocaleDateString()})
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>No reflections yet</p>
            )}
          </div>

          {/* Common Patterns */}
          <div className="dashboard-section">
            <h2>Common Patterns (Last 30 Days)</h2>
            {patternsLoading ? (
              <LoadingSpinner size="small" />
            ) : commonPatterns.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {commonPatterns.map((p: { type: string; count: number }, idx: number) => (
                  <div key={idx} style={{ fontSize: '0.875rem', color: '#666', textTransform: 'capitalize' }}>
                    • {p.type} ({p.count} times)
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>No patterns logged yet</p>
            )}
          </div>

          {/* Boundaries */}
          <div className="dashboard-section">
            <h2>Boundaries</h2>
            {boundariesLoading ? (
              <LoadingSpinner size="small" />
            ) : boundariesSummary ? (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>
                  Boundaries set: {boundariesSummary.set || 0} • Boundaries held: {boundariesSummary.held || 0}
                </p>
                {(boundariesSummary.violated || 0) > 0 && (
                  <p style={{ fontSize: '0.875rem', color: '#dc2626', marginTop: '0.5rem' }}>
                    Boundaries violated: {boundariesSummary.violated}
                  </p>
                )}
              </div>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>No boundaries tracked yet</p>
            )}
          </div>

          {/* Growth Insight */}
          <div className="dashboard-section">
            <h2>Growth Insight</h2>
            {lessonsLoading ? (
              <LoadingSpinner size="small" />
            ) : lessons && lessons.length > 0 ? (
              <div style={{ padding: '0.75rem', background: '#f0f9ff', borderRadius: '4px', fontStyle: 'italic', color: '#666' }}>
                "{lessons[0].lesson}"
              </div>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>No lessons captured yet</p>
            )}
          </div>
        </div>
      )}

      {/* Journal View */}
      {viewMode === 'journal' && (
        <>
          {showJournalForm && (
            <form onSubmit={handleJournalSubmit(onJournalSubmit)} className="patterns-form">
              <h3>{isEditing ? 'Edit Journal Entry' : 'New Journal Entry'}</h3>
              <div className="form-group">
                <label>Content *</label>
                <textarea rows={6} {...registerJournal('content', { required: true })} placeholder="What happened in your relationships?" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Entry Date</label>
                  <input type="date" {...registerJournal('entry_date')} />
                </div>
                <div className="form-group">
                  <label>Relationship Type</label>
                  <input type="text" {...registerJournal('relationship_type')} placeholder="e.g., family, partner, friend, work" />
                </div>
                <div className="form-group">
                  <label>Emotion Tag</label>
                  <input type="text" {...registerJournal('emotion_tag')} placeholder="Optional emotion" />
                </div>
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input type="text" {...registerJournal('tags')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createJournalMutation.isPending || updateJournalMutation.isPending}>
                  {isEditing ? 'Update' : 'Create'} Entry
                </button>
                <button type="button" onClick={() => { setShowJournalForm(false); setIsEditing(false); setSelectedJournal(null); resetJournal(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {journalLoading ? (
            <LoadingSpinner message="Loading journal entries..." size="large" />
          ) : journalEntries && journalEntries.length > 0 ? (
            <div className="journal-list">
              {journalEntries.map((entry) => (
                <div key={entry.id} className="journal-card">
                  <div className="journal-header">
                    <div>
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        {new Date(entry.entry_date).toLocaleDateString()}
                        {entry.relationship_type && ` • ${entry.relationship_type}`}
                        {entry.emotion_tag && ` • ${entry.emotion_tag}`}
                      </span>
                    </div>
                  </div>
                  <p style={{ marginTop: '0.5rem', color: '#666' }}>{entry.content}</p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Tags:</strong> {entry.tags.join(', ')}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditJournal(entry)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteJournalMutation.mutate(entry.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="📝" title="No journal entries yet" message="Start reflecting on your relationships." actionLabel="New Entry" onAction={() => { setShowJournalForm(true); setIsEditing(false); setSelectedJournal(null); resetJournal(); }} />
          )}
        </>
      )}

      {/* Conflicts View */}
      {viewMode === 'conflicts' && (
        <>
          {showConflictForm && (
            <form onSubmit={handleConflictSubmit(onConflictSubmit)} className="patterns-form">
              <h3>{isEditing ? 'Edit Conflict Reflection' : 'New Conflict Reflection'}</h3>
              <div className="form-group">
                <label>Trigger *</label>
                <textarea rows={2} {...registerConflict('trigger', { required: true })} placeholder="What triggered the conflict?" />
              </div>
              <div className="form-group">
                <label>My Response *</label>
                <textarea rows={3} {...registerConflict('my_response', { required: true })} placeholder="How did I respond?" />
              </div>
              <div className="form-group">
                <label>Their Response</label>
                <textarea rows={2} {...registerConflict('their_response')} placeholder="How did they respond? (optional)" />
              </div>
              <div className="form-group">
                <label>Outcome</label>
                <textarea rows={2} {...registerConflict('outcome')} placeholder="What happened?" />
              </div>
              <div className="form-group">
                <label>What I Would Do Differently</label>
                <textarea rows={3} {...registerConflict('what_i_would_do_differently')} placeholder="Reflection on what could be different" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Conflict Date</label>
                  <input type="date" {...registerConflict('conflict_date')} />
                </div>
                <div className="form-group">
                  <label>Relationship Type</label>
                  <input type="text" {...registerConflict('relationship_type')} placeholder="e.g., family, partner, work" />
                </div>
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input type="text" {...registerConflict('tags')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createConflictMutation.isPending || updateConflictMutation.isPending}>
                  {isEditing ? 'Update' : 'Add'} Reflection
                </button>
                <button type="button" onClick={() => { setShowConflictForm(false); setIsEditing(false); setSelectedConflict(null); resetConflict(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {conflictsLoading ? (
            <LoadingSpinner message="Loading conflict reflections..." size="large" />
          ) : conflicts && conflicts.length > 0 ? (
            <div className="conflicts-list">
              {conflicts.map((conflict) => (
                <div key={conflict.id} className="conflict-card">
                  <div className="conflict-header">
                    <div>
                      <h3>Conflict: {conflict.trigger.substring(0, 50)}...</h3>
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        {new Date(conflict.conflict_date).toLocaleDateString()}
                        {conflict.relationship_type && ` • ${conflict.relationship_type}`}
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>My Response:</strong> <span style={{ color: '#666' }}>{conflict.my_response}</span>
                  </div>
                  {conflict.their_response && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong>Their Response:</strong> <span style={{ color: '#666' }}>{conflict.their_response}</span>
                    </div>
                  )}
                  {conflict.outcome && (
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '4px' }}>
                      <strong>Outcome:</strong> {conflict.outcome}
                    </div>
                  )}
                  {conflict.what_i_would_do_differently && (
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#d1fae5', borderRadius: '4px' }}>
                      <strong>What I'd Do Differently:</strong> {conflict.what_i_would_do_differently}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditConflict(conflict)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteConflictMutation.mutate(conflict.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="💭" title="No conflict reflections yet" message="Reflect on how you handle conflicts." actionLabel="Add Reflection" onAction={() => { setShowConflictForm(true); setIsEditing(false); setSelectedConflict(null); resetConflict(); }} />
          )}
        </>
      )}

      {/* Patterns View */}
      {viewMode === 'patterns' && (
        <>
          {showPatternForm && (
            <form onSubmit={handlePatternSubmit(onPatternSubmit)} className="patterns-form">
              <h3>{isEditing ? 'Edit Communication Pattern' : 'Log Communication Pattern'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Pattern Type *</label>
                  <select {...registerPattern('pattern_type', { required: true })}>
                    <option value="listening">Listening</option>
                    <option value="avoidance">Avoidance</option>
                    <option value="defensiveness">Defensiveness</option>
                    <option value="assertiveness">Assertiveness</option>
                    <option value="over_explaining">Over-explaining</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Pattern Date</label>
                  <input type="date" {...registerPattern('pattern_date')} />
                </div>
                <div className="form-group">
                  <label>Relationship Type</label>
                  <input type="text" {...registerPattern('relationship_type')} placeholder="e.g., family, partner, work" />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={4} {...registerPattern('notes')} placeholder="Additional context about this pattern" />
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input type="text" {...registerPattern('tags')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createPatternMutation.isPending || updatePatternMutation.isPending}>
                  {isEditing ? 'Update' : 'Log'} Pattern
                </button>
                <button type="button" onClick={() => { setShowPatternForm(false); setIsEditing(false); setSelectedPattern(null); resetPattern(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {patternsLoading ? (
            <LoadingSpinner message="Loading communication patterns..." size="large" />
          ) : patterns && patterns.length > 0 ? (
            <div className="patterns-list">
              {patterns.map((pattern) => (
                <div key={pattern.id} className="pattern-card">
                  <div className="pattern-header">
                    <div>
                      <h3 style={{ textTransform: 'capitalize' }}>{pattern.pattern_type.replace('_', ' ')}</h3>
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        {new Date(pattern.pattern_date).toLocaleDateString()}
                        {pattern.relationship_type && ` • ${pattern.relationship_type}`}
                      </span>
                    </div>
                  </div>
                  {pattern.notes && <p style={{ marginTop: '0.5rem', color: '#666' }}>{pattern.notes}</p>}
                  {pattern.tags && pattern.tags.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Tags:</strong> {pattern.tags.join(', ')}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditPattern(pattern)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deletePatternMutation.mutate(pattern.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🔄" title="No communication patterns yet" message="Track your communication patterns over time." actionLabel="Log Pattern" onAction={() => { setShowPatternForm(true); setIsEditing(false); setSelectedPattern(null); resetPattern(); }} />
          )}
        </>
      )}

      {/* Boundaries View */}
      {viewMode === 'boundaries' && (
        <>
          {showBoundaryForm && (
            <form onSubmit={handleBoundarySubmit(onBoundarySubmit)} className="patterns-form">
              <h3>{isEditing ? 'Edit Boundary Note' : 'Add Boundary Note'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Boundary Type *</label>
                  <select {...registerBoundary('boundary_type', { required: true })}>
                    <option value="set">Set</option>
                    <option value="violated">Violated</option>
                    <option value="held">Held</option>
                    <option value="compromised">Compromised</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Boundary Date</label>
                  <input type="date" {...registerBoundary('boundary_date')} />
                </div>
                <div className="form-group">
                  <label>With Whom (optional, anonymized)</label>
                  <input type="text" {...registerBoundary('with_whom')} placeholder="e.g., colleague, family member" />
                </div>
                <div className="form-group">
                  <label>Relationship Type</label>
                  <input type="text" {...registerBoundary('relationship_type')} placeholder="e.g., family, partner, work" />
                </div>
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea rows={3} {...registerBoundary('description', { required: true })} placeholder="Describe the boundary" />
              </div>
              <div className="form-group">
                <label>Result</label>
                <textarea rows={2} {...registerBoundary('result')} placeholder="What happened?" />
              </div>
              <div className="form-group">
                <label>Emotional Impact</label>
                <textarea rows={2} {...registerBoundary('emotional_impact')} placeholder="How did it feel?" />
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input type="text" {...registerBoundary('tags')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createBoundaryMutation.isPending || updateBoundaryMutation.isPending}>
                  {isEditing ? 'Update' : 'Add'} Boundary
                </button>
                <button type="button" onClick={() => { setShowBoundaryForm(false); setIsEditing(false); setSelectedBoundary(null); resetBoundary(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {boundariesLoading ? (
            <LoadingSpinner message="Loading boundaries..." size="large" />
          ) : boundaries && boundaries.length > 0 ? (
            <div className="boundaries-list">
              {boundaries.map((boundary) => (
                <div key={boundary.id} className="boundary-card">
                  <div className="boundary-header">
                    <div>
                      <h3 style={{ textTransform: 'capitalize' }}>{boundary.boundary_type} Boundary</h3>
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        {new Date(boundary.boundary_date).toLocaleDateString()}
                        {boundary.with_whom && ` • with ${boundary.with_whom}`}
                        {boundary.relationship_type && ` • ${boundary.relationship_type}`}
                      </span>
                    </div>
                  </div>
                  <p style={{ marginTop: '0.5rem', color: '#666' }}>{boundary.description}</p>
                  {boundary.result && (
                    <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '4px' }}>
                      <strong>Result:</strong> {boundary.result}
                    </div>
                  )}
                  {boundary.emotional_impact && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Emotional Impact:</strong> {boundary.emotional_impact}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditBoundary(boundary)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteBoundaryMutation.mutate(boundary.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="🛡️" title="No boundaries tracked yet" message="Track boundaries to protect your energy." actionLabel="Add Boundary" onAction={() => { setShowBoundaryForm(true); setIsEditing(false); setSelectedBoundary(null); resetBoundary(); }} />
          )}
        </>
      )}

      {/* Lessons View */}
      {viewMode === 'lessons' && (
        <>
          {showLessonForm && (
            <form onSubmit={handleLessonSubmit(onLessonSubmit)} className="patterns-form">
              <h3>{isEditing ? 'Edit Lesson' : 'Add Lesson'}</h3>
              <div className="form-group">
                <label>Lesson *</label>
                <textarea rows={3} {...registerLesson('lesson', { required: true })} placeholder="Short reflective takeaway" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label>Learned Date</label>
                  <input type="date" {...registerLesson('learned_date')} />
                </div>
                <div className="form-group">
                  <label>Source Type</label>
                  <input type="text" {...registerLesson('source_type')} placeholder="e.g., journal, conflict, boundary" />
                </div>
              </div>
              <div className="form-group">
                <label>Tags (comma-separated)</label>
                <input type="text" {...registerLesson('tags')} />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={createLessonMutation.isPending || updateLessonMutation.isPending}>
                  {isEditing ? 'Update' : 'Add'} Lesson
                </button>
                <button type="button" onClick={() => { setShowLessonForm(false); setIsEditing(false); setSelectedLesson(null); resetLesson(); }} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {lessonsLoading ? (
            <LoadingSpinner message="Loading lessons..." size="large" />
          ) : lessons && lessons.length > 0 ? (
            <div className="lessons-list">
              {lessons.map((lesson) => (
                <div key={lesson.id} className="lesson-card">
                  <div className="lesson-header">
                    <div>
                      <h3>{lesson.lesson}</h3>
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        {new Date(lesson.learned_date).toLocaleDateString()}
                        {lesson.source_type && ` • from ${lesson.source_type}`}
                      </span>
                    </div>
                  </div>
                  {lesson.tags && lesson.tags.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Tags:</strong> {lesson.tags.join(', ')}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <button onClick={() => handleEditLesson(lesson)} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}>Edit</button>
                    <button onClick={() => { if (confirm('Are you sure?')) deleteLessonMutation.mutate(lesson.id); }} className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#fee2e2', color: '#dc2626' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="💡" title="No lessons yet" message="Capture insights from your relational experiences." actionLabel="Add Lesson" onAction={() => { setShowLessonForm(true); setIsEditing(false); setSelectedLesson(null); resetLesson(); }} />
          )}
        </>
      )}
    </div>
  );
};

export default RelationalPatterns;
