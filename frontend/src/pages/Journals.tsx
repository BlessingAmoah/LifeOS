import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import RichTextEditor from '../components/RichTextEditor';
import { exportJournalsToCSV, exportToPDF } from '../utils/exportUtils';
import './Journals.css';

interface JournalForm {
  title: string;
  content: string;
  mood: string;
  category: string;
  tags: string;
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  markdown_content?: string;
  mood: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const Journals = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMood, setFilterMood] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'mood'>('list');
  const [contentViewMode, setContentViewMode] = useState<'edit' | 'preview'>('edit');
  const [editorContent, setEditorContent] = useState('');
  const queryClient = useQueryClient();

  const { data: journals, isLoading, error } = useQuery<JournalEntry[]>({
    queryKey: ['journals', searchQuery, filterCategory, filterMood, startDate, endDate],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (filterCategory) params.append('category', filterCategory);
      if (filterMood) params.append('mood', filterMood);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      return api.get(`/journals?${params.toString()}`).then(res => res.data);
    },
  });

  const { register, handleSubmit, reset, watch, setValue } = useForm<JournalForm>({
    defaultValues: {
      title: '',
      content: '',
      mood: '',
      category: '',
      tags: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: JournalForm) => {
      const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      // Use editorContent if available (rich text), otherwise use data.content (markdown)
      const content = editorContent || data.content;
      return api.post('/journals', { ...data, content, markdown_content: content, tags: tagsArray });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
      reset();
      setEditorContent('');
      setShowForm(false);
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to create journal entry';
      alert(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<JournalForm> }) => {
      const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      // Use editorContent if available (rich text), otherwise use data.content (markdown)
      const content = editorContent || data.content;
      return api.put(`/journals/${id}`, { ...data, content, markdown_content: content, tags: tagsArray });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
      reset();
      setEditorContent('');
      setShowForm(false);
      setIsEditing(false);
      setSelectedJournal(null);
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to update journal entry';
      alert(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/journals/${id}`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
      if (selectedJournal?.id === id) {
        setSelectedJournal(null);
      }
      alert('Journal entry deleted successfully!');
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to delete journal entry';
      alert(errorMessage);
    },
  });

  const handleCreateNew = () => {
    setShowForm(true);
    setIsEditing(false);
    setSelectedJournal(null);
    setEditorContent('');
    reset({
      title: '',
      content: '',
      mood: '',
      category: '',
      tags: '',
    });
  };

  const handleEdit = (journal: JournalEntry) => {
    setSelectedJournal(journal);
    setIsEditing(true);
    setShowForm(true);
    setValue('title', journal.title || '');
    const content = journal.markdown_content || journal.content || '';
    setValue('content', content);
    setEditorContent(content);
    setValue('mood', journal.mood || '');
    setValue('category', journal.category || '');
    setValue('tags', journal.tags ? journal.tags.join(', ') : '');
  };

  const handleSelectJournal = (journal: JournalEntry) => {
    setSelectedJournal(journal);
    setShowForm(false);
    setIsEditing(false);
  };

  const handleCloseView = () => {
    setSelectedJournal(null);
  };

  const onSubmit = (data: JournalForm) => {
    if (isEditing && selectedJournal) {
      updateMutation.mutate({ id: selectedJournal.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatContent = (content: string) => {
    if (!content) return '';
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/\n/g, '<br/>');
  };

  if (isLoading) return <div className="journals-loading">Loading journals...</div>;

  return (
    <div className="journals">
      <div className="journals-header">
        <h1>Journals</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'list' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'list' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('mood')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'mood' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'mood' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Mood Tracking
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleCreateNew} className="btn-primary">
              + New Entry
            </button>
            {journals && journals.length > 0 && (
              <>
                <button 
                  onClick={() => exportJournalsToCSV(journals)} 
                  className="btn-secondary"
                  title="Export to CSV"
                >
                  📥 Export CSV
                </button>
                <button 
                  onClick={() => exportToPDF(
                    'Journal Entries',
                    journals,
                    [
                      { key: 'created_at', label: 'Date' },
                      { key: 'title', label: 'Title' },
                      { key: 'category', label: 'Category' },
                      { key: 'mood', label: 'Mood' },
                    ],
                    'journals-export'
                  )} 
                  className="btn-secondary"
                  title="Export to PDF"
                >
                  📄 Export PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="journal-filters">
        <input
          type="text"
          placeholder="Search journals..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="spiritual">Spiritual</option>
          <option value="health">Health</option>
          <option value="career">Career</option>
          <option value="reflection">Reflection</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
        </select>
        <input
          type="text"
          placeholder="Filter by mood..."
          value={filterMood}
          onChange={(e) => setFilterMood(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.875rem', color: '#666', whiteSpace: 'nowrap' }}>From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.875rem', color: '#666', whiteSpace: 'nowrap' }}>To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.875rem' }}
            min={startDate || undefined}
          />
        </div>
        {(searchQuery || filterCategory || filterMood || startDate || endDate) && (
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterCategory('');
              setFilterMood('');
              setStartDate('');
              setEndDate('');
            }}
            className="btn-clear-filters"
          >
            Clear Filters
          </button>
        )}
      </div>

      {isLoading ? (
        <LoadingSpinner message="Loading journals..." size="large" />
      ) : error ? (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Failed to load journals'}
          onRetry={() => queryClient.invalidateQueries({ queryKey: ['journals'] })}
        />
      ) : viewMode === 'mood' ? (
        <MoodTrackingView journals={journals || []} />
      ) : (
      <div className="journals-content">
        {/* Journal Cards Grid */}
        <div className="journals-grid">
          {journals && journals.length > 0 ? (
            journals.map((journal) => (
              <div
                key={journal.id}
                className={`journal-card ${selectedJournal?.id === journal.id ? 'selected' : ''}`}
                onClick={() => handleSelectJournal(journal)}
                onMouseEnter={(e) => e.currentTarget.classList.add('hovered')}
                onMouseLeave={(e) => e.currentTarget.classList.remove('hovered')}
              >
                <div className="journal-card-header">
                  <h3>{journal.title || 'Untitled'}</h3>
                  {journal.category && (
                    <span className="journal-card-category">{journal.category}</span>
                  )}
                </div>
                <div
                  className="journal-card-preview"
                  dangerouslySetInnerHTML={{
                    __html: formatContent((journal.markdown_content || journal.content || '').substring(0, 150)) + '...'
                  }}
                />
                <div className="journal-card-footer">
                  <span className="journal-card-date">
                    {new Date(journal.created_at).toLocaleDateString()}
                  </span>
                  {journal.mood && (
                    <span className="journal-card-mood">{journal.mood}</span>
                  )}
                </div>
                <div className="journal-card-actions">
                  <button
                    className="journal-card-edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(journal);
                    }}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    className="journal-card-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to delete this journal entry?')) {
                        deleteMutation.mutate(journal.id);
                      }
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              icon="📝"
              title="No journal entries"
              message={searchQuery || filterCategory || filterMood || startDate || endDate 
                ? "No journals match your filters. Try adjusting your search criteria."
                : "Start your journaling journey by creating your first entry."}
              actionLabel={searchQuery || filterCategory || filterMood || startDate || endDate ? undefined : "Create Journal Entry"}
              onAction={searchQuery || filterCategory || filterMood || startDate || endDate ? undefined : handleCreateNew}
            />
          )}
        </div>

        {/* Journal Form (shown when creating or editing) */}
        {showForm && (
          <div className="journal-form-container">
            <div className="journal-form-header">
              <h2>{isEditing ? 'Edit Journal Entry' : 'New Journal Entry'}</h2>
              <button onClick={() => { setShowForm(false); setIsEditing(false); setSelectedJournal(null); reset(); }} className="btn-secondary">
                Cancel
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="journal-form">
              <div className="form-group">
                <label>Title (optional)</label>
                <input type="text" {...register('title')} placeholder="Journal entry title" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select {...register('category')}>
                  <option value="">Select category</option>
                  <option value="spiritual">Spiritual</option>
                  <option value="health">Health</option>
                  <option value="career">Career</option>
                  <option value="reflection">Reflection</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <div className="form-group">
                <label>Content</label>
                <div className="view-mode-tabs">
                  <button
                    type="button"
                    onClick={() => setContentViewMode('edit')}
                    className={contentViewMode === 'edit' ? 'active' : ''}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentViewMode('preview')}
                    className={contentViewMode === 'preview' ? 'active' : ''}
                  >
                    Preview
                  </button>
                </div>
                {contentViewMode === 'edit' ? (
                  <RichTextEditor
                    value={editorContent}
                    onChange={(html) => {
                      setEditorContent(html);
                      setValue('content', html);
                    }}
                    placeholder="Write your thoughts... Use the toolbar above to format your text."
                  />
                ) : (
                  <div
                    className="markdown-preview"
                    dangerouslySetInnerHTML={{
                      __html: editorContent || watch('content') || ''
                    }}
                  />
                )}
              </div>
              <div className="form-group">
                <label>Mood (optional)</label>
                <input type="text" {...register('mood')} placeholder="How are you feeling?" />
              </div>
              <div className="form-group">
                <label>Tags (comma-separated, optional)</label>
                <input type="text" {...register('tags')} placeholder="gratitude, insight, reflection" />
              </div>
              <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEditing ? 'Update Entry' : 'Save Entry'}
              </button>
            </form>
          </div>
        )}

        {/* Journal Detail View (shown when a card is clicked) */}
        {selectedJournal && !showForm && (
          <div className="journal-detail-container">
            <div className="journal-detail-header">
              <h2>{selectedJournal.title || 'Untitled'}</h2>
              <div className="journal-detail-actions">
                <button onClick={() => handleEdit(selectedJournal)} className="btn-secondary">
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this journal entry?')) {
                      deleteMutation.mutate(selectedJournal.id);
                    }
                  }}
                  className="btn-danger"
                >
                  Delete
                </button>
                <button onClick={handleCloseView} className="btn-secondary">
                  Close
                </button>
              </div>
            </div>
            <div className="journal-detail-meta">
              <span className="journal-detail-date">
                {new Date(selectedJournal.created_at).toLocaleString()}
              </span>
              {selectedJournal.category && (
                <span className="journal-detail-category">{selectedJournal.category}</span>
              )}
              {selectedJournal.mood && (
                <span className="journal-detail-mood">Mood: {selectedJournal.mood}</span>
              )}
              {selectedJournal.tags && selectedJournal.tags.length > 0 && (
                <div className="journal-detail-tags">
                  {selectedJournal.tags.map((tag, index) => (
                    <span key={index} className="journal-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div
              className="journal-detail-content"
              dangerouslySetInnerHTML={{
                __html: formatContent(selectedJournal.markdown_content || selectedJournal.content || '')
              }}
            />
          </div>
        )}
      </div>
      )}
    </div>
  );
};

// Mood Tracking Visualization Component
const MoodTrackingView = ({ journals }: { journals: JournalEntry[] }) => {
  const moodData = journals
    .filter(j => j.mood)
    .map(j => ({
      date: new Date(j.created_at).toISOString().split('T')[0],
      mood: j.mood,
      category: j.category,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group by mood
  const moodCounts = moodData.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get last 30 days of mood data
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const moodTimeline = last30Days.map(date => {
    const entry = moodData.find(e => e.date === date);
    return { date, mood: entry?.mood || null, category: entry?.category || null };
  });

  const getMoodColor = (mood: string | null) => {
    if (!mood) return '#e5e7eb';
    const moodLower = mood.toLowerCase();
    if (moodLower.includes('happy') || moodLower.includes('joy') || moodLower.includes('great')) return '#10b981';
    if (moodLower.includes('good') || moodLower.includes('fine') || moodLower.includes('okay')) return '#84cc16';
    if (moodLower.includes('neutral') || moodLower.includes('meh')) return '#f59e0b';
    if (moodLower.includes('sad') || moodLower.includes('down') || moodLower.includes('low')) return '#ef4444';
    if (moodLower.includes('anxious') || moodLower.includes('stressed') || moodLower.includes('worried')) return '#f97316';
    return '#667eea';
  };

  return (
    <div className="mood-tracking-view">
      <div className="mood-stats-grid">
        <div className="mood-stat-card">
          <h3>Mood Distribution</h3>
          <div className="mood-distribution">
            {Object.entries(moodCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([mood, count]) => (
                <div key={mood} className="mood-item">
                  <div className="mood-bar">
                    <div
                      className="mood-bar-fill"
                      style={{
                        width: `${(count / moodData.length) * 100}%`,
                        background: getMoodColor(mood),
                      }}
                    />
                  </div>
                  <div className="mood-label">
                    <span className="mood-name">{mood}</span>
                    <span className="mood-count">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="mood-stat-card">
          <h3>Mood Timeline (Last 30 Days)</h3>
          <div className="mood-timeline">
            {moodTimeline.map((entry, idx) => (
              <div
                key={idx}
                className="mood-day"
                style={{
                  background: getMoodColor(entry.mood),
                  opacity: entry.mood ? 1 : 0.3,
                }}
                title={entry.mood ? `${entry.date}: ${entry.mood}` : entry.date}
              />
            ))}
          </div>
          <div className="mood-legend">
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#10b981' }} />
              <span>Positive</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#84cc16' }} />
              <span>Good</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#f59e0b' }} />
              <span>Neutral</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#ef4444' }} />
              <span>Low</span>
            </div>
            <div className="legend-item">
              <div className="legend-color" style={{ background: '#f97316' }} />
              <span>Stressed</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mood-entries-list">
        <h3>Recent Mood Entries</h3>
        <div className="mood-entries">
          {moodData.slice(-10).reverse().map((entry, idx) => (
            <div key={idx} className="mood-entry-card">
              <div
                className="mood-indicator"
                style={{ background: getMoodColor(entry.mood) }}
              />
              <div className="mood-entry-info">
                <span className="mood-entry-mood">{entry.mood}</span>
                <span className="mood-entry-date">{new Date(entry.date).toLocaleDateString()}</span>
                {entry.category && (
                  <span className="mood-entry-category">{entry.category}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Journals;
