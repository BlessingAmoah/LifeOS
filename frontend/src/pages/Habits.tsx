import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { PREDEFINED_HABITS, HABIT_CATEGORIES, HABIT_STATUS_OPTIONS } from '../data/predefinedHabits';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { exportHabitsToCSV, exportToPDF } from '../utils/exportUtils';
import './Habits.css';

interface HabitForm {
  name: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  identity_link: string;
}

const Habits = () => {
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [filterIdentity, setFilterIdentity] = useState('');
  const queryClient = useQueryClient();

  const { data: habits, isLoading, error } = useQuery({
    queryKey: ['habits', filterIdentity],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filterIdentity) params.append('identity_link', filterIdentity);
      return api.get(`/habits?${params.toString()}`).then(res => res.data);
    },
  });

  const { register, handleSubmit, reset, setValue } = useForm<HabitForm>();

  const createMutation = useMutation({
    mutationFn: (data: HabitForm) => api.post('/habits', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      reset();
      setShowForm(false);
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to create habit';
      alert(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (habitId: string) => api.delete(`/habits/${habitId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      alert('Habit deleted successfully!');
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to delete habit';
      alert(errorMessage);
    },
  });

  const logMutation = useMutation({
    mutationFn: ({ habitId, status, completedOn }: { habitId: string; status: string; completedOn?: string }) =>
      api.post(`/habits/${habitId}/logs`, { status, completed_on: completedOn }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.error || 'Failed to log habit';
      alert(errorMessage);
    },
  });

  return (
    <div className="habits">
      <div className="page-header">
        <h1>Habits</h1>
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
              onClick={() => setViewMode('calendar')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'calendar' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'calendar' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Calendar
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setShowForm(!showForm)} className="btn-primary">
              {showForm ? 'Cancel' : 'New Habit'}
            </button>
            {habits && habits.length > 0 && (
              <>
                <button 
                  onClick={() => exportHabitsToCSV(habits)} 
                  className="btn-secondary"
                  title="Export to CSV"
                >
                  📥 CSV
                </button>
                <button 
                  onClick={() => exportToPDF(
                    'Habits',
                    habits,
                    [
                      { key: 'name', label: 'Name' },
                      { key: 'category', label: 'Category' },
                      { key: 'frequency', label: 'Frequency' },
                      { key: 'current_streak', label: 'Streak' },
                    ],
                    'habits-export'
                  )} 
                  className="btn-secondary"
                  title="Export to PDF"
                >
                  📄 PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Identity Filter */}
      {viewMode === 'list' && (
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
            Filter by Identity Link:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Enter identity link to filter habits..."
              value={filterIdentity}
              onChange={(e) => setFilterIdentity(e.target.value)}
              style={{
                flex: 1,
                maxWidth: '400px',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.875rem'
              }}
            />
            {filterIdentity && (
              <button
                onClick={() => setFilterIdentity('')}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="habit-form">
          <div className="form-group">
            <label>Select from predefined habits or type custom:</label>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  setValue('name', e.target.value);
                  e.target.value = '';
                }
              }}
              className="predefined-habits-select"
            >
              <option value="">Select a predefined habit...</option>
              {PREDEFINED_HABITS.map((habit) => (
                <option key={habit} value={habit}>
                  {habit}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Or type custom habit name"
              {...register('name', { required: true })}
            />
          </div>
          <div className="form-group">
            <label>Frequency *</label>
            <select {...register('frequency', { required: true })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="form-group">
            <label>Category</label>
            <select {...register('category')}>
              <option value="">Select category (optional)</option>
              {HABIT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Identity Link (optional)</label>
            <textarea
              rows={3}
              placeholder="How does this habit connect to your identity?"
              {...register('identity_link')}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn-primary">Create Habit</button>
            <button type="button" onClick={() => { setShowForm(false); reset(); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <LoadingSpinner message="Loading habits..." size="large" />
      ) : error ? (
        <ErrorMessage
          message={error instanceof Error ? error.message : 'Failed to load habits'}
          onRetry={() => queryClient.invalidateQueries({ queryKey: ['habits'] })}
        />
      ) : viewMode === 'list' && (
        <div className="habits-list">
          {habits && habits.length > 0 ? (
            habits.map((habit: any) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onLog={(status: string) => {
                  // Format today's date as YYYY-MM-DD in local timezone
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = String(today.getMonth() + 1).padStart(2, '0');
                  const day = String(today.getDate()).padStart(2, '0');
                  const todayLocal = `${year}-${month}-${day}`;
                  logMutation.mutate({ habitId: habit.id, status, completedOn: todayLocal });
                }}
                onDelete={() => {
                  if (confirm(`Are you sure you want to delete "${habit.name}"?`)) {
                    deleteMutation.mutate(habit.id);
                  }
                }}
                isLogging={logMutation.isPending}
              />
            ))
          ) : (
            <EmptyState
              icon="✅"
              title="No habits yet"
              message={filterIdentity 
                ? "No habits match your filter. Try adjusting your search criteria."
                : "Start building good habits by creating your first one."}
              actionLabel={filterIdentity ? undefined : "Create Habit"}
              onAction={filterIdentity ? undefined : () => setShowForm(true)}
            />
          )}
        </div>
      )}

      {viewMode === 'calendar' && (
        <HabitsCalendarView
          habits={habits || []}
          selectedHabit={selectedHabit}
          onSelectHabit={setSelectedHabit}
          onLogHabit={(habitId: string, status: string, completedOn?: string) => logMutation.mutate({ habitId, status, completedOn })}
        />
      )}
    </div>
  );
};

// Calendar View Component
const HabitsCalendarView = ({ habits, selectedHabit, onSelectHabit, onLogHabit }: {
  habits: any[];
  selectedHabit: string | null;
  onSelectHabit: (id: string | null) => void;
  onLogHabit: (id: string, status: string, completedOn?: string) => void;
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedHabitForLog, setSelectedHabitForLog] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  if (habits.length === 0) {
    return <p className="empty-state">No habits yet. Create one to see the calendar view.</p>;
  }

  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

  const days = [];
  const currentDate = new Date(startDate);

  while (currentDate <= monthEnd || currentDate.getDay() !== 0) {
    days.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
    if (days.length >= 42) break; // 6 weeks max
  }

  const getCompletionStatus = (habitId: string, date: Date) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit || !habit.calendarDataWithStatus) return null;
    // Format date as YYYY-MM-DD in local timezone (not UTC)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const log = habit.calendarDataWithStatus.find((l: any) => l.date === dateStr);
    return log ? log.status : null;
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'completed':
        return { bg: '#10b981', color: 'white' };
      case 'not_completed':
        return { bg: '#ef4444', color: 'white' };
      case 'partial':
        return { bg: '#f59e0b', color: 'white' };
      case 'not_today':
        return { bg: '#9ca3af', color: 'white' };
      default:
        return { bg: '#e5e7eb', color: '#666' };
    }
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth() && date.getFullYear() === currentMonth.getFullYear();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    // Compare year, month, and day in local timezone
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <div className="habits-calendar">
      <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button onClick={prevMonth} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>← Prev</button>
        <h2 style={{ margin: 0 }}>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h2>
        <button onClick={nextMonth} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Next →</button>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Select Habit:</label>
        <select
          value={selectedHabit || ''}
          onChange={(e) => onSelectHabit(e.target.value || null)}
          style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', width: '100%', maxWidth: '300px' }}
        >
          <option value="">All Habits</option>
          {habits.map(habit => (
            <option key={habit.id} value={habit.id}>{habit.name}</option>
          ))}
        </select>
      </div>

      <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
        {dayNames.map(day => (
          <div key={day} style={{ textAlign: 'center', fontWeight: 600, padding: '0.5rem', color: '#666' }}>
            {day}
          </div>
        ))}
        {days.map((date, idx) => {
          const displayHabits = selectedHabit ? habits.filter(h => h.id === selectedHabit) : habits;
          const isCurrentMonthDay = isCurrentMonth(date);
          const isTodayDate = isToday(date);

          return (
            <div
              key={idx}
              style={{
                minHeight: '80px',
                padding: '0.5rem',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                background: isCurrentMonthDay ? 'white' : '#f8f9fa',
                opacity: isCurrentMonthDay ? 1 : 0.5,
                position: 'relative',
                borderWidth: isTodayDate ? '2px' : '1px',
                borderColor: isTodayDate ? '#667eea' : '#e2e8f0',
              }}
            >
              <div style={{ fontSize: '0.875rem', fontWeight: isTodayDate ? 600 : 400, marginBottom: '0.25rem' }}>
                {date.getDate()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {displayHabits.map(habit => {
                  const status = getCompletionStatus(habit.id, date);
                  const colors = getStatusColor(status);
                  return (
                    <div
                      key={habit.id}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.25rem',
                        borderRadius: '3px',
                        background: colors.bg,
                        color: colors.color,
                        cursor: 'pointer',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => {
                        // Format date as YYYY-MM-DD in local timezone
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        setSelectedDate(`${year}-${month}-${day}`);
                        setSelectedHabitForLog(habit.id);
                      }}
                      title={status ? `${habit.name} - ${HABIT_STATUS_OPTIONS.find(o => o.value === status)?.label || status}` : `${habit.name} - Click to log`}
                    >
                      {habit.name.substring(0, 8)}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Selection Modal */}
      {selectedDate && selectedHabitForLog && (
        <div className="status-modal-overlay" onClick={() => { setSelectedDate(null); setSelectedHabitForLog(null); }}>
          <div className="status-modal" onClick={(e) => e.stopPropagation()}>
            <div className="status-modal-header">
              <h3>Log Habit Status</h3>
              <button onClick={() => { setSelectedDate(null); setSelectedHabitForLog(null); }} className="close-status-menu">×</button>
            </div>
            <div className="status-options">
              {HABIT_STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onLogHabit(selectedHabitForLog, option.value, selectedDate || undefined);
                    setSelectedDate(null);
                    setSelectedHabitForLog(null);
                  }}
                  className={`status-btn status-${option.value}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', fontSize: '0.875rem' }}>
        <p style={{ margin: 0, color: '#666' }}>
          <strong>Legend:</strong> Green = Yes, Red = No, Yellow = Partially complete, Gray = Not today's task. Click on today's date to log a habit.
        </p>
      </div>
    </div>
  );
};

// Habit Card Component with Status Selection
const HabitCard = ({
  habit,
  onLog,
  onDelete,
  isLogging,
}: {
  habit: any;
  onLog: (status: string) => void;
  onDelete: () => void;
  isLogging: boolean;
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  return (
    <div className="habit-card">
      <div className="habit-header">
        <h3>{habit.name}</h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="habit-frequency">{habit.frequency}</span>
          <button
            onClick={onDelete}
            className="habit-delete-btn"
            title="Delete habit"
          >
            🗑️
          </button>
        </div>
      </div>
      {habit.category && (
        <div className="habit-category">
          <span className="category-badge">{habit.category}</span>
        </div>
      )}
      {habit.identity_link && (
        <p className="habit-identity">{habit.identity_link}</p>
      )}
                <div className="habit-stats">
                  <div className="stat-item">
                    <span className="stat-label">Streak:</span>
                    <span className="stat-value streak">{habit.currentStreak || 0} 🔥</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Success Rate:</span>
                    <span className="stat-value">{habit.weeklySuccessRate || 0}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Completed:</span>
                    <span className="stat-value" style={{ color: '#10b981' }}>{habit.totalCompletions || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Not Completed:</span>
                    <span className="stat-value" style={{ color: '#ef4444' }}>{habit.totalNotCompleted || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Total Tracked:</span>
                    <span className="stat-value">{habit.totalTracked || 0}</span>
                  </div>
                </div>
      <div className="habit-log-section">
        {showStatusMenu ? (
          <div className="status-menu">
            <div className="status-menu-header">
              <span>Log Status:</span>
              <button
                onClick={() => setShowStatusMenu(false)}
                className="close-status-menu"
              >
                ×
              </button>
            </div>
            <div className="status-options">
              {HABIT_STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onLog(option.value);
                    setShowStatusMenu(false);
                  }}
                  className={`status-btn status-${option.value}`}
                  disabled={isLogging}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowStatusMenu(true)}
            className="btn-log"
            disabled={isLogging}
          >
            Log Today
          </button>
        )}
      </div>
    </div>
  );
};

export default Habits;
