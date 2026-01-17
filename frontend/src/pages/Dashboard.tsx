import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import './Dashboard.css';

// Helper function to format date in local timezone
const formatDateLocal = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Invalid Date';
  const parts = dateString.split('-');
  if (parts.length !== 3) return 'Invalid Date';
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return 'Invalid Date';
  if (month < 1 || month > 12) return 'Invalid Date';
  if (day < 1 || day > 31) return 'Invalid Date';
  
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  return date.toLocaleDateString();
};

const Dashboard = () => {
  const navigate = useNavigate();

  // Profile data
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profiles').then(res => res.data),
  });

  // Vision data
  const { data: visionBoards } = useQuery({
    queryKey: ['vision-boards'],
    queryFn: () => api.get('/vision-boards').then(res => res.data),
    enabled: !!profile,
  });

  // Tasks data - fetch all tasks (both archived and non-archived) to filter for today
  const { data: tasksNonArchived } = useQuery({
    queryKey: ['tasks', 'non-archived'],
    queryFn: () => api.get('/tasks').then(res => res.data),
    enabled: !!profile,
  });

  const { data: tasksArchived } = useQuery({
    queryKey: ['tasks', 'archived'],
    queryFn: () => api.get('/tasks?archived=true').then(res => res.data),
    enabled: !!profile,
  });

  // Combine archived and non-archived tasks
  const tasks = tasksNonArchived && tasksArchived 
    ? [...tasksNonArchived, ...tasksArchived]
    : tasksNonArchived || tasksArchived || [];

  // Habits data
  const { data: habits } = useQuery({
    queryKey: ['habits'],
    queryFn: () => api.get('/habits').then(res => res.data),
    enabled: !!profile,
  });

  // Health data
  const { data: healthLogs } = useQuery({
    queryKey: ['health-logs', 'recent'],
    queryFn: () => api.get('/health?limit=7').then(res => res.data),
    enabled: !!profile,
  });

  // Journals data
  const { data: journals } = useQuery({
    queryKey: ['journals', 'recent'],
    queryFn: () => api.get('/journals?limit=1').then(res => res.data),
    enabled: !!profile,
  });

  // Reviews data
  const { data: reviews } = useQuery({
    queryKey: ['reviews', 'weekly'],
    queryFn: () => api.get('/reviews?type=weekly&limit=1').then(res => res.data),
    enabled: !!profile,
  });

  // Financial data
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

  const { data: savingsGoals } = useQuery({
    queryKey: ['savings-goals'],
    queryFn: () => api.get('/savings-goals?status=active').then(res => res.data),
    enabled: !!profile,
  });

  // Career data
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then(res => res.data),
    enabled: !!profile,
  });

  const { data: skills } = useQuery({
    queryKey: ['skills'],
    queryFn: () => api.get('/skills').then(res => res.data),
    enabled: !!profile,
  });

  // Technical Growth data
  const { data: practiceSummary } = useQuery({
    queryKey: ['practice-summary'],
    queryFn: () => api.get('/practice-sessions/summary').then(res => res.data),
    enabled: !!profile,
  });

  const { data: engineeringDocs } = useQuery({
    queryKey: ['engineering-docs', 'recent'],
    queryFn: () => api.get('/engineering-docs?limit=5').then(res => res.data),
    enabled: !!profile,
  });

  const { data: engineeringWins } = useQuery({
    queryKey: ['engineering-wins', 'recent'],
    queryFn: () => api.get('/engineering-wins?limit=5').then(res => res.data),
    enabled: !!profile,
  });

  // Relational Patterns data
  const { data: relationshipJournals } = useQuery({
    queryKey: ['relationship-journal', 'recent'],
    queryFn: () => api.get('/relationship-journal?limit=1').then(res => res.data),
    enabled: !!profile,
  });

  // Books data
  const { data: books } = useQuery({
    queryKey: ['books'],
    queryFn: () => api.get('/books').then(res => res.data),
    enabled: !!profile,
  });

  // Immigration data
  const { data: deadlines } = useQuery({
    queryKey: ['deadlines-reminders', 'upcoming'],
    queryFn: () => api.get('/deadlines-reminders?upcoming=true').then(res => res.data),
    enabled: !!profile,
  });

  const { data: milestones } = useQuery({
    queryKey: ['visa-milestones'],
    queryFn: () => api.get('/visa-milestones?status=pending').then(res => res.data),
    enabled: !!profile,
  });

  if (profileLoading) {
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

  // Calculate habit streak and completion
  const habitStreak = habits?.reduce((max: number, habit: any) => Math.max(max, habit.currentStreak || 0), 0) || 0;
  const habitCompletion = habits?.length > 0 
    ? Math.round((habits.filter((h: any) => (h.currentStreak || 0) > 0).length / habits.length) * 100)
    : 0;

  // Get today's tasks - include tasks due today, overdue tasks, active tasks without due dates, and done tasks (including archived)
  const today = new Date().toISOString().split('T')[0];
  const todayTasks = tasks?.filter((task: any) => {
    // Include tasks due today (regardless of status - includes done and archived tasks)
    if (task.due_date === today) return true;
    
    // Include overdue tasks (due_date < today) - include both done and not done (including archived)
    if (task.due_date && task.due_date < today) return true;
    
    // Include active tasks without due dates (backlog or in_progress) - exclude archived
    if (!task.due_date && (task.status === 'backlog' || task.status === 'in_progress') && !task.archived_at) return true;
    
    // Include done tasks without due dates (completed today or recently) - include archived done tasks
    if (!task.due_date && task.status === 'done') return true;
    
    return false;
  }) || [];
  const completedTasks = todayTasks.filter((t: any) => t.status === 'done').length;
  const totalTasks = todayTasks.length;

  // Get latest health data
  const latestHealth = healthLogs?.[0] || null;
  const steps = latestHealth?.steps || 0;
  const sleep = latestHealth?.sleep_hours || 0;
  const energy = latestHealth?.energy_level || 0;

  // Get short-term and long-term vision
  const shortTermVision = visionBoards?.find((v: any) => v.vision_type === 'short');
  const longTermVision = visionBoards?.find((v: any) => v.vision_type === 'long');

  // Get latest journal
  const latestJournal = journals?.[0] || null;

  // Get latest weekly review
  const latestReview = reviews?.[0] || null;

  // Calculate financial metrics
  const netWorthValue = netWorth ? parseFloat(netWorth.total_assets || '0') - parseFloat(netWorth.total_liabilities || '0') : 0;
  
  // Get savings rate from dashboard
  const savingsRate = financialDashboard?.health_indicators?.savings_rate || 0;
  
  // Calculate current savings from savings goals
  const currentSavings = savingsGoals?.reduce((sum: number, goal: any) => sum + parseFloat(goal.current_amount || '0'), 0) || 0;
  const totalSavingsTarget = savingsGoals?.reduce((sum: number, goal: any) => sum + parseFloat(goal.target_amount || '0'), 0) || 0;
  
  // Use savings rate if available, otherwise calculate from goals
  const savingsPercentage = savingsRate > 0 ? Math.round(savingsRate) : (totalSavingsTarget > 0 ? Math.round((currentSavings / totalSavingsTarget) * 100) : 0);
  
  // Get monthly budget (current month)
  const monthlyBudget = financialDashboard?.budgets?.find((b: any) => b.period === 'monthly' || !b.period) || financialDashboard?.budgets?.[0] || null;
  const monthlyBudgetAmount = monthlyBudget ? parseFloat(monthlyBudget.budget_amount || '0') : 0;
  
  // Calculate pie chart data from financial dashboard overview
  const income = financialDashboard?.overview?.income || 0;
  const expenses = financialDashboard?.overview?.expenses || 0;
  const savings = financialDashboard?.overview?.savings || 0;
  
  // Pie chart segments - use income as base if available, otherwise use expenses + savings
  const totalForChart = income > 0 ? income : (expenses + savings > 0 ? expenses + savings : 1);
  const savingsSegment = totalForChart > 0 ? (savings / totalForChart) * 100 : 0;
  const expensesSegment = totalForChart > 0 ? (expenses / totalForChart) * 100 : 0;
  const otherSegment = Math.max(0, 100 - savingsSegment - expensesSegment);

  // Get current role from roles table
  const currentRoleData = roles?.find((r: any) => r.role_type === 'current');
  const currentRole = currentRoleData ? `${currentRoleData.title}${currentRoleData.company ? ` at ${currentRoleData.company}` : ''}` : 'Not set';
  const skillsProgress = skills?.filter((s: any) => {
    const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
    const currentIndex = levels.indexOf(s.proficiency_level);
    return currentIndex >= 2; // advanced or expert
  }).length || 0;
  const totalSkills = skills?.length || 0;

  // Technical Growth metrics
  const practiceSessions = practiceSummary?.reduce((sum: number, p: any) => sum + (parseInt(p.session_count) || 0), 0) || 0;
  const docsAdded = engineeringDocs?.length || 0;
  const winsLogged = engineeringWins?.length || 0;

  // Get currently reading book
  const currentlyReading = books?.find((b: any) => b.status === 'currently_reading') || null;
  const readingProgress = currentlyReading?.progress || 0;

  // Get next immigration deadline and milestone
  const nextDeadline = deadlines?.find((d: any) => !d.completed && d.deadline_date >= today) || null;
  const nextMilestone = milestones?.find((m: any) => m.status === 'pending') || null;
  
  // Calculate days until deadline
  const daysUntilDeadline = nextDeadline ? Math.ceil((new Date(nextDeadline.deadline_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        {/* Vision Snapshot */}
        <div className="dashboard-widget widget-vision" onClick={() => navigate('/dashboard/vision')}>
          <div className="widget-header">
            <h3>Vision Snapshot</h3>
          </div>
          <div className="widget-content">
            {shortTermVision && (
              <div className="vision-item">
                <strong>Short-Term:</strong> {shortTermVision.vision_current_focus_theme || shortTermVision.vision_short_term || 'No short-term vision set'}
              </div>
            )}
            {longTermVision && (
              <div className="vision-item">
                <strong>Long-Term:</strong> {longTermVision.vision_long_term || 'No long-term vision set'}
              </div>
            )}
            {!shortTermVision && !longTermVision && (
              <div className="vision-empty">No vision set yet</div>
            )}
          </div>
          <button className="widget-action-btn">View Vision</button>
        </div>

        {/* Today's Tasks */}
        <div className="dashboard-widget widget-tasks" onClick={() => navigate('/dashboard/tasks')}>
          <div className="widget-header">
            <h3>Today's Tasks</h3>
          </div>
          <div className="widget-content">
            {todayTasks.length > 0 ? (
              <>
                {todayTasks.slice(0, 3).map((task: any) => (
                  <div key={task.id} className="task-item">
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      readOnly
                      className="task-checkbox"
                    />
                    <span className={task.status === 'done' ? 'task-completed' : ''}>
                      {task.title}
                    </span>
                  </div>
                ))}
                {todayTasks.length > 3 && (
                  <div className="task-more">+{todayTasks.length - 3} more tasks</div>
                )}
                <div className="task-progress">
                  {completedTasks} / {totalTasks} tasks completed
                </div>
              </>
            ) : (
              <div className="widget-empty">No tasks for today</div>
            )}
          </div>
        </div>

        {/* Habit Streaks */}
        <div className="dashboard-widget widget-habits" onClick={() => navigate('/dashboard/habits')}>
          <div className="widget-header">
            <h3>Habit Streak</h3>
          </div>
          <div className="widget-content habit-streak-content">
            <div className="habit-streak-circle">
              <div className="streak-number">{habitStreak}</div>
              <div className="streak-label">Days</div>
            </div>
            <div className="habit-completion">
              <div className="completion-bar">
                <div 
                  className="completion-fill" 
                  style={{ width: `${habitCompletion}%` }}
                ></div>
              </div>
              <div className="completion-text">{habitCompletion}% weekly done</div>
            </div>
          </div>
        </div>

        {/* Health Summary */}
        <div className="dashboard-widget widget-health" onClick={() => navigate('/dashboard/health')}>
          <div className="widget-header">
            <h3>Health Summary</h3>
          </div>
          <div className="widget-content">
            <div className="health-metric">
              <span className="metric-label">Steps</span>
              <span className="metric-value">{steps.toLocaleString()}</span>
            </div>
            <div className="health-metric">
              <span className="metric-label">Sleep</span>
              <span className="metric-value">{sleep}h {Math.round((sleep % 1) * 60)}m</span>
            </div>
            <div className="health-metric">
              <span className="metric-label">Energy</span>
              <span className="metric-value">{energy}/10</span>
            </div>
          </div>
        </div>

        {/* Journal Quick Note */}
        <div className="dashboard-widget widget-journal" onClick={() => navigate('/dashboard/journals')}>
          <div className="widget-header">
            <h3>Journal Quick Note</h3>
          </div>
          <div className="widget-content">
            {latestJournal ? (
              <>
                <div className="journal-preview">
                  <strong>Last Entry: {latestJournal.title || 'Untitled'}</strong>
                  <div className="journal-mood">
                    {latestJournal.mood || '😊'}
                  </div>
                </div>
                <div className="journal-date">
                  {formatDateLocal(latestJournal.created_at?.split('T')[0])}
                </div>
              </>
            ) : (
              <div className="widget-empty">No journal entries yet</div>
            )}
          </div>
          <button className="widget-action-btn">Go to Journal</button>
        </div>

        {/* Weekly Review */}
        <div className="dashboard-widget widget-review" onClick={() => navigate('/dashboard/reviews')}>
          <div className="widget-header">
            <h3>Weekly Review</h3>
          </div>
          <div className="widget-content review-content">
            {latestReview ? (
              <>
                <div className="review-wins">
                  <div className="review-label">Wins</div>
                  <div className="review-progress-bar">
                    <div className="review-progress-fill" style={{ width: '80%' }}></div>
                  </div>
                  <div className="review-percentage">80%</div>
                </div>
                <div className="review-lessons">
                  <div className="review-label">Lessons Learned</div>
                  <div className="review-progress-bar">
                    <div className="review-progress-fill lessons" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </>
            ) : (
              <div className="widget-empty">No weekly review yet</div>
            )}
          </div>
        </div>

        {/* Financial Snapshot */}
        <div className="dashboard-widget widget-financial" onClick={() => navigate('/dashboard/financial')}>
          <div className="widget-header">
            <h3>Financial Snapshot</h3>
          </div>
          <div className="widget-content financial-content-layout">
            <div className="financial-text-side">
              <div className="financial-networth">
                <strong>Net Worth</strong>
                <div className="networth-value">${netWorthValue.toLocaleString()}</div>
              </div>
              <div className="financial-metrics">
                <div className="financial-metric">
                  <span>Savings</span>
                  <span className="metric-percentage">{savingsPercentage}%</span>
                </div>
                {monthlyBudgetAmount > 0 && (
                  <div className="financial-metric">
                    <span>Monthly Budget</span>
                    <span>${monthlyBudgetAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Pie Chart */}
            {totalForChart > 0 && (savingsSegment > 0 || expensesSegment > 0) && (
              <div className="financial-pie-chart">
                <svg viewBox="0 0 100 100" className="pie-svg">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#ecf0f1"
                    strokeWidth="20"
                  />
                  {/* Savings segment */}
                  {savingsSegment > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#27ae60"
                      strokeWidth="20"
                      strokeDasharray={`${(savingsSegment / 100) * 251.3} 251.3`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                      className="pie-segment savings"
                    />
                  )}
                  {/* Expenses segment */}
                  {expensesSegment > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e74c3c"
                      strokeWidth="20"
                      strokeDasharray={`${(expensesSegment / 100) * 251.3} 251.3`}
                      strokeDashoffset={`-${(savingsSegment / 100) * 251.3}`}
                      transform="rotate(-90 50 50)"
                      className="pie-segment expenses"
                    />
                  )}
                  {/* Other segment */}
                  {otherSegment > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#3498db"
                      strokeWidth="20"
                      strokeDasharray={`${(otherSegment / 100) * 251.3} 251.3`}
                      strokeDashoffset={`-${((savingsSegment + expensesSegment) / 100) * 251.3}`}
                      transform="rotate(-90 50 50)"
                      className="pie-segment other"
                    />
                  )}
                </svg>
                <div className="pie-legend">
                  {savingsSegment > 0 && (
                    <div className="legend-item">
                      <span className="legend-color" style={{ background: '#27ae60' }}></span>
                      <span>Savings {Math.round(savingsSegment)}%</span>
                    </div>
                  )}
                  {expensesSegment > 0 && (
                    <div className="legend-item">
                      <span className="legend-color" style={{ background: '#e74c3c' }}></span>
                      <span>Expenses {Math.round(expensesSegment)}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Career Progress */}
        <div className="dashboard-widget widget-career" onClick={() => navigate('/dashboard/career')}>
          <div className="widget-header">
            <h3>Career Progress</h3>
          </div>
          <div className="widget-content">
            <div className="career-role">
              <strong>Current Role:</strong> {currentRole}
            </div>
            <div className="career-skills">
              <div className="skill-progress-item">
                <span>Skills Mastery</span>
                <div className="skill-progress-bar">
                  <div 
                    className="skill-progress-fill" 
                    style={{ width: `${totalSkills > 0 ? (skillsProgress / totalSkills) * 100 : 0}%` }}
                  ></div>
                </div>
                <span>{skillsProgress}/{totalSkills}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Growth */}
        <div className="dashboard-widget widget-technical" onClick={() => navigate('/dashboard/technical-growth')}>
          <div className="widget-header">
            <h3>Technical Growth</h3>
          </div>
          <div className="widget-content">
            <div className="technical-metric">
              <span>Practice Sessions</span>
              <span className="metric-value">{practiceSessions}</span>
            </div>
            <div className="technical-metric">
              <span>Docs Added</span>
              <span className="metric-value">{docsAdded}</span>
            </div>
            <div className="technical-metric">
              <span>Wins Logged</span>
              <span className="metric-value">{winsLogged}</span>
            </div>
          </div>
        </div>

        {/* Relational Insights */}
        <div className="dashboard-widget widget-relational" onClick={() => navigate('/dashboard/relational-patterns')}>
          <div className="widget-header">
            <h3>Relational Insights</h3>
          </div>
          <div className="widget-content">
            {relationshipJournals && relationshipJournals.length > 0 ? (
              <>
                <div className="relational-recent">
                  <strong>Recent:</strong> {relationshipJournals[0].title || relationshipJournals[0].context || 'Relationship Note'}
                </div>
                <div className="relational-mood">
                  Mood Trend: {relationshipJournals[0].mood || '😊'}
                </div>
              </>
            ) : (
              <div className="widget-empty">No relationship notes yet</div>
            )}
          </div>
        </div>

        {/* Reading Progress */}
        <div className="dashboard-widget widget-books" onClick={() => navigate('/dashboard/books')}>
          <div className="widget-header">
            <h3>Reading Progress</h3>
          </div>
          <div className="widget-content">
            {currentlyReading ? (
              <>
                <div className="book-info">
                  <strong>Reading:</strong> {currentlyReading.title}
                </div>
                <div className="book-progress">
                  <div className="book-progress-bar">
                    <div 
                      className="book-progress-fill" 
                      style={{ width: `${readingProgress}%` }}
                    ></div>
                  </div>
                  <span className="book-progress-text">{readingProgress}% Complete</span>
                </div>
              </>
            ) : (
              <div className="widget-empty">No book currently reading</div>
            )}
          </div>
        </div>

        {/* Immigration Timeline */}
        <div className="dashboard-widget widget-immigration" onClick={() => navigate('/dashboard/immigration')}>
          <div className="widget-header">
            <h3>Immigration Timeline</h3>
          </div>
          <div className="widget-content">
            {nextDeadline ? (
              <>
                <div className="immigration-next">
                  <strong>Next Deadline:</strong> {nextDeadline.title}
                  {nextDeadline.is_critical && <span style={{ color: '#e74c3c', marginLeft: '0.5rem' }}>⚠️ Critical</span>}
                </div>
                <div className="immigration-date">
                  {formatDateLocal(nextDeadline.deadline_date)}
                  {daysUntilDeadline !== null && (
                    <span style={{ marginLeft: '0.5rem', color: daysUntilDeadline <= 7 ? '#e74c3c' : daysUntilDeadline <= 30 ? '#f39c12' : '#27ae60' }}>
                      ({daysUntilDeadline === 0 ? 'Today' : daysUntilDeadline === 1 ? 'Tomorrow' : `${daysUntilDeadline} days`})
                    </span>
                  )}
                </div>
                {nextDeadline.description && (
                  <div className="immigration-description" style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                    {nextDeadline.description}
                  </div>
                )}
              </>
            ) : nextMilestone ? (
              <>
                <div className="immigration-next">
                  <strong>Next Milestone:</strong> {nextMilestone.milestone_name}
                </div>
                {nextMilestone.milestone_date && (
                  <div className="immigration-date">
                    {formatDateLocal(nextMilestone.milestone_date.split('T')[0])}
                  </div>
                )}
              </>
            ) : (
              <div className="widget-empty">No upcoming deadlines or milestones</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
