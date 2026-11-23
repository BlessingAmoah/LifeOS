import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
// TODO: Migrate these to modules structure
import habitRoutes from './routes/habits';
import healthRoutes from './routes/health';
import documentRoutes from './routes/documents';
import healthGoalsRoutes from './routes/health-goals';
import visionBoardsRoutes from './routes/vision-boards';
import transactionsRoutes from './routes/transactions';
import savingsGoalsRoutes from './routes/savings-goals';
import investmentsRoutes from './routes/investments';
import netWorthRoutes from './routes/net-worth';
import financialDashboardRoutes from './routes/financial-dashboard';
import transactionsImportRoutes from './routes/transactions-import';
import spiritualGoalsRoutes from './routes/spiritual-goals';
import prayerLogsRoutes from './routes/prayer-logs';
import scripturesRoutes from './routes/scriptures';
import spiritualReflectionsRoutes from './routes/spiritual-reflections';
import statusTimelineRoutes from './routes/status-timeline';
import documentChecklistRoutes from './routes/document-checklist';
import deadlinesRemindersRoutes from './routes/deadlines-reminders';
import caseNotesRoutes from './routes/case-notes';
import uploadedDocumentsRoutes from './routes/uploaded-documents';
import visaMilestonesRoutes from './routes/visa-milestones';
import financialPlansRoutes from './routes/financial-plans';
import searchRoutes from './routes/search';
import notificationsRoutes from './routes/notifications';
import stewardshipRoutes from './modules/stewardship/stewardship.routes';

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
      habits: '/api/habits',
      documents: '/api/documents',
      transactions: '/api/transactions',
      savingsGoals: '/api/savings-goals',
      financialPlans: '/api/financial-plans',
      investments: '/api/investments',
      netWorth: '/api/net-worth',
      spiritualGoals: '/api/spiritual-goals',
      prayerLogs: '/api/prayer-logs',
      scriptures: '/api/scriptures',
      spiritualReflections: '/api/spiritual-reflections',
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
      habits: '/api/habits',
      documents: '/api/documents',
      health: '/api/health',
      transactions: '/api/transactions',
      savingsGoals: '/api/savings-goals',
      investments: '/api/investments',
      netWorth: '/api/net-worth',
    },
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profiles', usersRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/health', healthRoutes);
    app.use('/api/health-goals', healthGoalsRoutes);
    app.use('/api/vision-boards', visionBoardsRoutes);
    app.use('/api/documents', documentRoutes);
    app.use('/api/transactions', transactionsRoutes);
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
    app.use('/api/status-timeline', statusTimelineRoutes);
    app.use('/api/document-checklist', documentChecklistRoutes);
    app.use('/api/deadlines-reminders', deadlinesRemindersRoutes);
    app.use('/api/case-notes', caseNotesRoutes);
    app.use('/api/uploaded-documents', uploadedDocumentsRoutes);
    app.use('/api/visa-milestones', visaMilestonesRoutes);
    app.use('/api/search', searchRoutes);
    app.use('/api/notifications', notificationsRoutes);
    app.use('/api/stewardship', stewardshipRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
