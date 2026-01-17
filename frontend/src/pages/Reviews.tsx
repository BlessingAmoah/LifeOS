import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import './Reviews.css';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface ReviewForm {
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  wins: string;
  challenges: string;
  lessons: string;
  next_focus: string;
  template_used?: string;
  goal_progress?: string;
  habit_analysis?: string;
  life_balance_scores?: {
    health?: number;
    career?: number;
    relationships?: number;
    spiritual?: number;
    financial?: number;
    personal_growth?: number;
  };
  strategic_adjustments?: string;
}

const Reviews = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'compare' | 'radar'>('list');
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [selectedReviewForRadar, setSelectedReviewForRadar] = useState<string>('');
  const queryClient = useQueryClient();

  // Fetch habits for habit analysis
  const { data: habits } = useQuery({
    queryKey: ['habits'],
    queryFn: () => api.get('/habits').then(res => res.data),
  });

  // Review templates
  const templates: Record<string, Partial<ReviewForm>> = {
    daily: {
      wins: 'What went well today?',
      challenges: 'What was challenging?',
      lessons: 'What did I learn?',
      next_focus: 'What will I focus on tomorrow?',
    },
    weekly: {
      wins: 'What were my wins this week?',
      challenges: 'What challenges did I face?',
      lessons: 'What lessons did I learn?',
      next_focus: 'What will I focus on next week?',
    },
    monthly: {
      wins: 'What were my major wins this month?',
      challenges: 'What were the main challenges?',
      lessons: 'What were the key lessons?',
      next_focus: 'What are my priorities for next month?',
    },
    quarterly: {
      wins: 'What were my biggest wins this quarter?',
      challenges: 'What were the significant challenges?',
      lessons: 'What were the most important lessons?',
      next_focus: 'What are my strategic priorities for next quarter?',
    },
  };

  const { data: reviews, isLoading, error } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => api.get('/reviews').then(res => res.data),
  });

  const { register, handleSubmit, reset, setValue, watch } = useForm<ReviewForm>({
    defaultValues: { type: 'weekly' },
  });

  const reviewType = watch('type');

  // Apply template when type or template changes
  const applyTemplate = (type: string, templateName?: string) => {
    const template = templates[type];
    if (template) {
      setValue('wins', template.wins || '');
      setValue('challenges', template.challenges || '');
      setValue('lessons', template.lessons || '');
      setValue('next_focus', template.next_focus || '');
      if (templateName) {
        setValue('template_used', templateName);
      }
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: ReviewForm) => api.post('/reviews', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      reset();
      setShowForm(false);
    },
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading reviews..." size="large" />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error instanceof Error ? error.message : 'Failed to load reviews'}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['reviews'] })}
      />
    );
  }

  return (
    <div className="reviews">
      <div className="page-header">
        <h1>Reviews</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => {
                setViewMode('list');
                setSelectedReviews([]);
              }}
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
              onClick={() => setViewMode('compare')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'compare' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'compare' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Compare
            </button>
            <button
              onClick={() => setViewMode('radar')}
              style={{
                padding: '0.5rem 1rem',
                background: viewMode === 'radar' ? '#667eea' : '#f0f0f0',
                color: viewMode === 'radar' ? 'white' : '#333',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Life Balance
            </button>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'New Review'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit((data) => {
        const submitData = {
          ...data,
          template_used: selectedTemplate || data.template_used || undefined,
          // Filter out empty life_balance_scores
          life_balance_scores: data.life_balance_scores && Object.values(data.life_balance_scores).some((v: any) => v !== undefined && v !== null && v !== '') 
            ? data.life_balance_scores 
            : undefined,
        };
        createMutation.mutate(submitData);
        })} className="review-form">
          <div className="form-group">
            <label>Review Type</label>
            <select {...register('type', { required: true, onChange: (e) => applyTemplate(e.target.value) })}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
          <div className="form-group">
            <label>Template (optional)</label>
            <select
              value={selectedTemplate}
              onChange={(e) => {
                setSelectedTemplate(e.target.value);
                if (e.target.value) {
                  applyTemplate(reviewType, e.target.value);
                }
              }}
            >
              <option value="">No template</option>
              <option value="default">Default Template</option>
              <option value="minimal">Minimal Template</option>
              <option value="detailed">Detailed Template</option>
            </select>
          </div>
          <div className="form-group">
            <label>Wins</label>
            <textarea
              rows={4}
              placeholder="What went well?"
              {...register('wins')}
            />
          </div>
          <div className="form-group">
            <label>Challenges</label>
            <textarea
              rows={4}
              placeholder="What was challenging?"
              {...register('challenges')}
            />
          </div>
          <div className="form-group">
            <label>Lessons</label>
            <textarea
              rows={4}
              placeholder="What did you learn?"
              {...register('lessons')}
            />
          </div>
          <div className="form-group">
            <label>Next Focus</label>
            <textarea
              rows={4}
              placeholder="What will you focus on next?"
              {...register('next_focus')}
            />
          </div>
          <div className="form-group">
            <label>Goal Progress (optional)</label>
            <textarea
              rows={3}
              placeholder="Track progress toward your goals..."
              {...register('goal_progress')}
            />
          </div>
          <div className="form-group">
            <label>Habit Analysis (optional)</label>
            {habits && habits.length > 0 && (
              <div style={{ marginBottom: '0.5rem', padding: '0.75rem', background: '#f8f9fa', borderRadius: '4px', fontSize: '0.875rem' }}>
                <strong>Current Habits:</strong>
                <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                  {habits.map((habit: any) => (
                    <li key={habit.id}>
                      {habit.name}: {habit.currentStreak || 0} day streak, {habit.weeklySuccessRate || 0}% success rate
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <textarea
              rows={3}
              placeholder="Analyze your habit performance and effectiveness..."
              {...register('habit_analysis')}
            />
          </div>
          <div className="form-group">
            <label>Life Balance Scores (optional)</label>
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>
              Rate each area from 1-10 (1 = needs attention, 10 = thriving)
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Health</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="1-10"
                  {...register('life_balance_scores.health', { valueAsNumber: true })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Career</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="1-10"
                  {...register('life_balance_scores.career', { valueAsNumber: true })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Relationships</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="1-10"
                  {...register('life_balance_scores.relationships', { valueAsNumber: true })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Spiritual</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="1-10"
                  {...register('life_balance_scores.spiritual', { valueAsNumber: true })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Financial</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="1-10"
                  {...register('life_balance_scores.financial', { valueAsNumber: true })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Personal Growth</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="1-10"
                  {...register('life_balance_scores.personal_growth', { valueAsNumber: true })}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Strategic Adjustments (optional)</label>
            <textarea
              rows={4}
              placeholder="What strategic changes or adjustments will you make based on this review? (e.g., 'Focus more on health by exercising 3x/week', 'Reduce work hours to improve relationships')"
              {...register('strategic_adjustments')}
            />
          </div>
          <button type="submit" className="btn-primary">Save Review</button>
        </form>
      )}

      {viewMode === 'radar' ? (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Life Balance Radar Chart</h2>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Select a review to view its life balance scores
          </p>
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Select Review:</label>
            <select
              value={selectedReviewForRadar}
              onChange={(e) => setSelectedReviewForRadar(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #ddd',
                minWidth: '300px',
                fontSize: '1rem'
              }}
            >
              <option value="">-- Select a review --</option>
              {reviews && reviews.length > 0 ? (
                reviews
                  .filter((r: any) => r.life_balance_scores && typeof r.life_balance_scores === 'object')
                  .map((review: any) => (
                    <option key={review.id} value={review.id}>
                      {review.type.toUpperCase()} - {new Date(review.created_at).toLocaleDateString()}
                    </option>
                  ))
              ) : null}
            </select>
          </div>
          {selectedReviewForRadar && reviews && (() => {
            const selectedReview = reviews.find((r: any) => r.id === selectedReviewForRadar);
            if (!selectedReview || !selectedReview.life_balance_scores) {
              return (
                <EmptyState
                  icon="📊"
                  title="No life balance scores"
                  message="This review doesn't have life balance scores. Add scores when creating or editing a review."
                />
              );
            }
            const scores = typeof selectedReview.life_balance_scores === 'string' 
              ? JSON.parse(selectedReview.life_balance_scores) 
              : selectedReview.life_balance_scores;
            
            const chartData = {
              labels: ['Health', 'Career', 'Relationships', 'Spiritual', 'Financial', 'Personal Growth'],
              datasets: [
                {
                  label: 'Life Balance',
                  data: [
                    scores.health || 0,
                    scores.career || 0,
                    scores.relationships || 0,
                    scores.spiritual || 0,
                    scores.financial || 0,
                    scores.personal_growth || 0,
                  ],
                  backgroundColor: 'rgba(102, 126, 234, 0.2)',
                  borderColor: 'rgba(102, 126, 234, 1)',
                  borderWidth: 2,
                  pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                  pointBorderColor: '#fff',
                  pointHoverBackgroundColor: '#fff',
                  pointHoverBorderColor: 'rgba(102, 126, 234, 1)',
                },
              ],
            };
            
            const chartOptions = {
              scales: {
                r: {
                  beginAtZero: true,
                  max: 10,
                  min: 0,
                  ticks: {
                    stepSize: 2,
                  },
                },
              },
              plugins: {
                legend: {
                  display: true,
                  position: 'top' as const,
                },
                tooltip: {
                  callbacks: {
                    label: (context: any) => {
                      return `${context.label}: ${context.parsed.r}/10`;
                    },
                  },
                },
              },
            };

            return (
              <div style={{ 
                background: 'white', 
                padding: '2rem', 
                borderRadius: '12px', 
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                maxWidth: '800px',
                margin: '0 auto'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>
                    {selectedReview.type.toUpperCase()} Review - {new Date(selectedReview.created_at).toLocaleDateString()}
                  </h3>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                  <div style={{ width: '100%', maxWidth: '600px' }}>
                    <Radar data={chartData} options={chartOptions} />
                  </div>
                </div>
                {selectedReview.strategic_adjustments && (
                  <div style={{ 
                    marginTop: '2rem', 
                    padding: '1rem', 
                    background: '#f0f4ff', 
                    borderRadius: '8px',
                    borderLeft: '4px solid #667eea'
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#667eea' }}>Strategic Adjustments</h4>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{selectedReview.strategic_adjustments}</p>
                  </div>
                )}
              </div>
            );
          })()}
          {!selectedReviewForRadar && (
            <EmptyState
              icon="📊"
              title="Select a review"
              message="Choose a review from the dropdown above to view its life balance radar chart."
            />
          )}
        </div>
      ) : viewMode === 'compare' ? (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Compare Reviews</h2>
          <p style={{ marginBottom: '1rem', color: '#666' }}>
            Select up to 3 reviews to compare side-by-side
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {reviews && reviews.length > 0 ? (
              reviews.map((review: any) => (
                <div
                  key={review.id}
                  style={{
                    padding: '1rem',
                    border: selectedReviews.includes(review.id) ? '2px solid #667eea' : '1px solid #ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: selectedReviews.includes(review.id) ? '#f0f4ff' : 'white'
                  }}
                  onClick={() => {
                    if (selectedReviews.includes(review.id)) {
                      setSelectedReviews(selectedReviews.filter(id => id !== review.id));
                    } else if (selectedReviews.length < 3) {
                      setSelectedReviews([...selectedReviews, review.id]);
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong>{review.type.toUpperCase()}</strong>
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedReviews.includes(review.id) && (
                    <span style={{ fontSize: '0.75rem', color: '#667eea' }}>✓ Selected</span>
                  )}
                </div>
              ))
            ) : (
              <p>No reviews to compare</p>
            )}
          </div>
          {selectedReviews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${selectedReviews.length}, 1fr)`, gap: '1rem' }}>
              {selectedReviews.map((reviewId) => {
                const review = reviews?.find((r: any) => r.id === reviewId);
                if (!review) return null;
                return (
                  <div key={reviewId} className="review-card" style={{ border: '2px solid #667eea' }}>
                    <div className="review-header">
                      <h3>{review.type.toUpperCase()} Review</h3>
                      <span className="review-date">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {review.wins && (
                      <div className="review-section">
                        <h4>Wins</h4>
                        <p>{review.wins}</p>
                      </div>
                    )}
                    {review.challenges && (
                      <div className="review-section">
                        <h4>Challenges</h4>
                        <p>{review.challenges}</p>
                      </div>
                    )}
                    {review.lessons && (
                      <div className="review-section">
                        <h4>Lessons</h4>
                        <p>{review.lessons}</p>
                      </div>
                    )}
                    {review.next_focus && (
                      <div className="review-section">
                        <h4>Next Focus</h4>
                        <p>{review.next_focus}</p>
                      </div>
                    )}
                    {review.goal_progress && (
                      <div className="review-section" style={{ background: '#e0f2fe', padding: '1rem', borderRadius: '4px' }}>
                        <h4>Goal Progress</h4>
                        <p>{review.goal_progress}</p>
                      </div>
                    )}
                    {review.habit_analysis && (
                      <div className="review-section" style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '4px' }}>
                        <h4>Habit Analysis</h4>
                        <p>{typeof review.habit_analysis === 'string' ? review.habit_analysis : JSON.stringify(review.habit_analysis)}</p>
                      </div>
                    )}
                    {review.strategic_adjustments && (
                      <div className="review-section" style={{ background: '#fff3cd', padding: '1rem', borderRadius: '4px', borderLeft: '4px solid #ffc107' }}>
                        <h4>Strategic Adjustments</h4>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{review.strategic_adjustments}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
      <div className="reviews-list">
        {reviews && reviews.length > 0 ? (
          reviews.map((review: any) => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <h3>{review.type.toUpperCase()} Review</h3>
                <span className="review-date">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              {review.wins && (
                <div className="review-section">
                  <h4>Wins</h4>
                  <p>{review.wins}</p>
                </div>
              )}
              {review.challenges && (
                <div className="review-section">
                  <h4>Challenges</h4>
                  <p>{review.challenges}</p>
                </div>
              )}
              {review.lessons && (
                <div className="review-section">
                  <h4>Lessons</h4>
                  <p>{review.lessons}</p>
                </div>
              )}
              {review.next_focus && (
                <div className="review-section">
                  <h4>Next Focus</h4>
                  <p>{review.next_focus}</p>
                </div>
              )}
              {review.goal_progress && (
                <div className="review-section" style={{ background: '#e0f2fe', padding: '1rem', borderRadius: '4px' }}>
                  <h4>Goal Progress</h4>
                  <p>{review.goal_progress}</p>
                </div>
              )}
              {review.habit_analysis && (
                <div className="review-section" style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '4px' }}>
                  <h4>Habit Analysis</h4>
                  <p>{typeof review.habit_analysis === 'string' ? review.habit_analysis : JSON.stringify(review.habit_analysis)}</p>
                </div>
              )}
              {review.strategic_adjustments && (
                <div className="review-section" style={{ background: '#fff3cd', padding: '1rem', borderRadius: '4px', borderLeft: '4px solid #ffc107' }}>
                  <h4>Strategic Adjustments</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{review.strategic_adjustments}</p>
                </div>
              )}
              {review.life_balance_scores && (
                <div className="review-section" style={{ background: '#e0f2fe', padding: '1rem', borderRadius: '4px' }}>
                  <h4>Life Balance Scores</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', fontSize: '0.875rem' }}>
                    {(() => {
                      const scores = typeof review.life_balance_scores === 'string' 
                        ? JSON.parse(review.life_balance_scores) 
                        : review.life_balance_scores;
                      return Object.entries(scores).map(([key, value]: [string, any]) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ textTransform: 'capitalize' }}>{key.replace('_', ' ')}:</span>
                          <strong>{value}/10</strong>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
              {review.template_used && (
                <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                  Template: {review.template_used}
                </div>
              )}
            </div>
          ))
        ) : (
          <EmptyState
            icon="🔍"
            title="No reviews yet"
            message="Start reflecting by creating your first review."
            actionLabel="Create Review"
            onAction={() => setShowForm(true)}
          />
        )}
      </div>
      )}
    </div>
  );
};

export default Reviews;