import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
// TODO: Migrate these to modules structure
import journalRoutes from './routes/journals';
import habitRoutes from './routes/habits';
import taskRoutes from './routes/tasks';
import reviewRoutes from './routes/reviews';
import healthRoutes from './routes/health';
import documentRoutes from './routes/documents';
import healthGoalsRoutes from './routes/health-goals';
import visionBoardsRoutes from './routes/vision-boards';
import projectsRoutes from './routes/projects';
import transactionsRoutes from './routes/transactions';
import budgetsRoutes from './routes/budgets';
import savingsGoalsRoutes from './routes/savings-goals';
import investmentsRoutes from './routes/investments';
import netWorthRoutes from './routes/net-worth';
import financialDashboardRoutes from './routes/financial-dashboard';
import transactionsImportRoutes from './routes/transactions-import';
import spiritualGoalsRoutes from './routes/spiritual-goals';
import prayerLogsRoutes from './routes/prayer-logs';
import scripturesRoutes from './routes/scriptures';
import spiritualReflectionsRoutes from './routes/spiritual-reflections';
import careerGoalsRoutes from './routes/career-goals';
import skillsRoutes from './routes/skills';
import rolesRoutes from './routes/roles';
import feedbackNotesRoutes from './routes/feedback-notes';
import resumeVersionsRoutes from './routes/resume-versions';
import interviewPrepRoutes from './routes/interview-prep';
import careerMilestonesRoutes from './routes/career-milestones';
import careerProfileRoutes from './routes/career-profile';
import impactNotesRoutes from './routes/impact-notes';
import applicationsRoutes from './routes/applications';
import practiceSessionsRoutes from './routes/practice-sessions';
import engineeringDocsRoutes from './routes/engineering-docs';
import engineeringWinsRoutes from './routes/engineering-wins';
import relationshipJournalRoutes from './routes/relationship-journal';
import conflictReflectionsRoutes from './routes/conflict-reflections';
import communicationPatternsRoutes from './routes/communication-patterns';
import boundariesNotesRoutes from './routes/boundaries-notes';
import relationalLessonsRoutes from './routes/relational-lessons';
import booksRoutes from './routes/books';
import bookNotesRoutes from './routes/book-notes';
import bookQuotesRoutes from './routes/book-quotes';
import bookTakeawaysRoutes from './routes/book-takeaways';
import readingGoalsRoutes from './routes/reading-goals';
import statusTimelineRoutes from './routes/status-timeline';
import documentChecklistRoutes from './routes/document-checklist';
import deadlinesRemindersRoutes from './routes/deadlines-reminders';
import caseNotesRoutes from './routes/case-notes';
import uploadedDocumentsRoutes from './routes/uploaded-documents';
import visaMilestonesRoutes from './routes/visa-milestones';
import financialPlansRoutes from './routes/financial-plans';
import analyticsRoutes from './routes/analytics';
import searchRoutes from './routes/search';
import notificationsRoutes from './routes/notifications';

const app = express();

// Debug: Log registered routes on startup (production-safe)
if (config.nodeEnv === 'production') {
  app.on('mount', () => {
    const routes = app._router?.stack
      ?.filter((r: any) => r.route)
      .map((r: any) => r.route.path) || [];
    console.log('✓ Registered routes:', routes.slice(0, 10).join(', '), routes.length > 10 ? '...' : '');
  });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (_req, res) => {
  res.status(200).json({
    service: 'LifeOS Backend API',
    version: '1.0.0',
    environment: config.nodeEnv || 'production',
    status: 'running',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      profiles: '/api/profiles',
      journals: '/api/journals',
      habits: '/api/habits',
      tasks: '/api/tasks',
      reviews: '/api/reviews',
      documents: '/api/documents',
      transactions: '/api/transactions',
      budgets: '/api/budgets',
      savingsGoals: '/api/savings-goals',
      financialPlans: '/api/financial-plans',
      investments: '/api/investments',
      netWorth: '/api/net-worth',
      spiritualGoals: '/api/spiritual-goals',
      prayerLogs: '/api/prayer-logs',
      scriptures: '/api/scriptures',
      spiritualReflections: '/api/spiritual-reflections',
      careerGoals: '/api/career-goals',
      skills: '/api/skills',
      roles: '/api/roles',
      feedbackNotes: '/api/feedback-notes',
      resumeVersions: '/api/resume-versions',
      interviewPrep: '/api/interview-prep',
      careerMilestones: '/api/career-milestones',
      careerProfile: '/api/career-profile',
      impactNotes: '/api/impact-notes',
      applications: '/api/applications',
      practiceSessions: '/api/practice-sessions',
      engineeringDocs: '/api/engineering-docs',
      engineeringWins: '/api/engineering-wins',
      relationshipJournal: '/api/relationship-journal',
      conflictReflections: '/api/conflict-reflections',
      communicationPatterns: '/api/communication-patterns',
      boundariesNotes: '/api/boundaries-notes',
      relationalLessons: '/api/relational-lessons',
      books: '/api/books',
      bookNotes: '/api/book-notes',
      bookQuotes: '/api/book-quotes',
      bookTakeaways: '/api/book-takeaways',
      readingGoals: '/api/reading-goals',
      statusTimeline: '/api/status-timeline',
      documentChecklist: '/api/document-checklist',
      deadlinesReminders: '/api/deadlines-reminders',
      caseNotes: '/api/case-notes',
      uploadedDocuments: '/api/uploaded-documents',
      visaMilestones: '/api/visa-milestones',
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API root route
app.get('/api', (_req, res) => {
  res.status(200).json({
    service: 'LifeOS Backend API',
    version: '1.0.0',
    environment: config.nodeEnv || 'production',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      profiles: '/api/profiles',
      journals: '/api/journals',
      habits: '/api/habits',
      tasks: '/api/tasks',
      reviews: '/api/reviews',
      documents: '/api/documents',
      health: '/api/health',
      transactions: '/api/transactions',
      budgets: '/api/budgets',
      savingsGoals: '/api/savings-goals',
      investments: '/api/investments',
      netWorth: '/api/net-worth',
    },
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', usersRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/health', healthRoutes);
    app.use('/api/health-goals', healthGoalsRoutes);
    app.use('/api/vision-boards', visionBoardsRoutes);
    app.use('/api/documents', documentRoutes);
    app.use('/api/projects', projectsRoutes);
    app.use('/api/transactions', transactionsRoutes);
    app.use('/api/budgets', budgetsRoutes);
    app.use('/api/savings-goals', savingsGoalsRoutes);
    app.use('/api/financial-plans', financialPlansRoutes);
    app.use('/api/investments', investmentsRoutes);
    app.use('/api/net-worth', netWorthRoutes);
    app.use('/api/financial-dashboard', financialDashboardRoutes);
    app.use('/api/transactions-import', transactionsImportRoutes);
    app.use('/api/spiritual-goals', spiritualGoalsRoutes);
    app.use('/api/prayer-logs', prayerLogsRoutes);
    app.use('/api/scriptures', scripturesRoutes);
    app.use('/api/spiritual-reflections', spiritualReflectionsRoutes);
    app.use('/api/career-goals', careerGoalsRoutes);
    app.use('/api/skills', skillsRoutes);
    app.use('/api/roles', rolesRoutes);
    app.use('/api/feedback-notes', feedbackNotesRoutes);
    app.use('/api/resume-versions', resumeVersionsRoutes);
    app.use('/api/interview-prep', interviewPrepRoutes);
    app.use('/api/career-milestones', careerMilestonesRoutes);
    app.use('/api/career-profile', careerProfileRoutes);
    app.use('/api/impact-notes', impactNotesRoutes);
    app.use('/api/applications', applicationsRoutes);
    app.use('/api/practice-sessions', practiceSessionsRoutes);
    app.use('/api/engineering-docs', engineeringDocsRoutes);
    app.use('/api/engineering-wins', engineeringWinsRoutes);
    app.use('/api/relationship-journal', relationshipJournalRoutes);
    app.use('/api/conflict-reflections', conflictReflectionsRoutes);
    app.use('/api/communication-patterns', communicationPatternsRoutes);
    app.use('/api/boundaries-notes', boundariesNotesRoutes);
    app.use('/api/relational-lessons', relationalLessonsRoutes);
    app.use('/api/books', booksRoutes);
    app.use('/api/book-notes', bookNotesRoutes);
    app.use('/api/book-quotes', bookQuotesRoutes);
    app.use('/api/book-takeaways', bookTakeawaysRoutes);
    app.use('/api/reading-goals', readingGoalsRoutes);
    app.use('/api/status-timeline', statusTimelineRoutes);
    app.use('/api/document-checklist', documentChecklistRoutes);
    app.use('/api/deadlines-reminders', deadlinesRemindersRoutes);
    app.use('/api/case-notes', caseNotesRoutes);
    app.use('/api/uploaded-documents', uploadedDocumentsRoutes);
    app.use('/api/visa-milestones', visaMilestonesRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/search', searchRoutes);
    app.use('/api/notifications', notificationsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
