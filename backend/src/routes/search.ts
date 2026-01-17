import express, { Request, Response } from 'express';
import pool from '../config/db';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

// Global Search across all modules
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { q, modules } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchTerm = `%${q.trim()}%`;
    const moduleList: string[] = modules 
      ? (typeof modules === 'string' ? modules.split(',') : Array.isArray(modules) ? modules.map(m => String(m)) : [])
      : [];
    
    const results: any = {
      journals: [],
      tasks: [],
      habits: [],
      reviews: [],
      health: [],
      documents: [],
      projects: [],
      financial: [],
      career: [],
      technical: [],
      books: [],
    };

    // Search Journals
    if (moduleList.length === 0 || moduleList.includes('journals')) {
      const journalsResult = await pool.query(
        `SELECT id, title, content, created_at, 'journal' as type 
         FROM journal_entries 
         WHERE user_id = $1 AND (title ILIKE $2 OR content ILIKE $2)
         ORDER BY created_at DESC LIMIT 10`,
        [userId, searchTerm]
      );
      results.journals = journalsResult.rows;
    }

    // Search Tasks
    if (moduleList.length === 0 || moduleList.includes('tasks')) {
      const tasksResult = await pool.query(
        `SELECT id, title, description, status, created_at, 'task' as type 
         FROM tasks 
         WHERE user_id = $1 AND (title ILIKE $2 OR description ILIKE $2)
         ORDER BY created_at DESC LIMIT 10`,
        [userId, searchTerm]
      );
      results.tasks = tasksResult.rows;
    }

    // Search Habits
    if (moduleList.length === 0 || moduleList.includes('habits')) {
      const habitsResult = await pool.query(
        `SELECT id, name, category, created_at, 'habit' as type 
         FROM habits 
         WHERE user_id = $1 AND (name ILIKE $2 OR category ILIKE $2)
         ORDER BY created_at DESC LIMIT 10`,
        [userId, searchTerm]
      );
      results.habits = habitsResult.rows;
    }

    // Search Reviews
    if (moduleList.length === 0 || moduleList.includes('reviews')) {
      const reviewsResult = await pool.query(
        `SELECT id, review_type, wins, challenges, created_at, 'review' as type 
         FROM reviews 
         WHERE user_id = $1 AND (wins ILIKE $2 OR challenges ILIKE $2 OR lessons ILIKE $2)
         ORDER BY created_at DESC LIMIT 10`,
        [userId, searchTerm]
      );
      results.reviews = reviewsResult.rows;
    }

    // Search Documents
    if (moduleList.length === 0 || moduleList.includes('documents')) {
      const documentsResult = await pool.query(
        `SELECT id, name, content, created_at, 'document' as type 
         FROM documents 
         WHERE user_id = $1 AND (name ILIKE $2 OR content ILIKE $2)
         ORDER BY created_at DESC LIMIT 10`,
        [userId, searchTerm]
      );
      results.documents = documentsResult.rows;
    }

    // Search Projects
    if (moduleList.length === 0 || moduleList.includes('projects')) {
      const projectsResult = await pool.query(
        `SELECT id, name, description, status, created_at, 'project' as type 
         FROM projects 
         WHERE user_id = $1 AND (name ILIKE $2 OR description ILIKE $2)
         ORDER BY created_at DESC LIMIT 10`,
        [userId, searchTerm]
      );
      results.projects = projectsResult.rows;
    }

    // Search Financial Transactions
    if (moduleList.length === 0 || moduleList.includes('financial')) {
      const financialResult = await pool.query(
        `SELECT id, description, category, type, transaction_date as created_at, 'transaction' as type 
         FROM transactions 
         WHERE user_id = $1 AND (description ILIKE $2 OR category ILIKE $2)
         ORDER BY transaction_date DESC LIMIT 10`,
        [userId, searchTerm]
      );
      results.financial = financialResult.rows;
    }

    // Search Career Goals & Skills
    if (moduleList.length === 0 || moduleList.includes('career')) {
      const careerGoalsResult = await pool.query(
        `SELECT id, title, description, created_at, 'career_goal' as type 
         FROM career_goals 
         WHERE user_id = $1 AND (title ILIKE $2 OR description ILIKE $2)
         ORDER BY created_at DESC LIMIT 5`,
        [userId, searchTerm]
      );
      const careerSkillsResult = await pool.query(
        `SELECT id, name, category, created_at, 'skill' as type 
         FROM skills 
         WHERE user_id = $1 AND (name ILIKE $2 OR category ILIKE $2)
         ORDER BY created_at DESC LIMIT 5`,
        [userId, searchTerm]
      );
      results.career = [...careerGoalsResult.rows, ...careerSkillsResult.rows];
    }

    // Search Technical Growth
    if (moduleList.length === 0 || moduleList.includes('technical')) {
      const technicalResult = await pool.query(
        `SELECT id, topic, notes, session_date as created_at, 'practice' as type 
         FROM practice_sessions 
         WHERE user_id = $1 AND (topic ILIKE $2 OR notes ILIKE $2)
         ORDER BY session_date DESC LIMIT 10`,
        [userId, searchTerm]
      );
      results.technical = technicalResult.rows;
    }

    // Search Books
    if (moduleList.length === 0 || moduleList.includes('books')) {
      const booksResult = await pool.query(
        `SELECT id, title, author, created_at, 'book' as type 
         FROM books 
         WHERE user_id = $1 AND (title ILIKE $2 OR author ILIKE $2)
         ORDER BY created_at DESC LIMIT 10`,
        [userId, searchTerm]
      );
      results.books = booksResult.rows;
    }

    // Calculate total results
    const totalResults = Object.values(results).reduce((sum: number, arr: any) => sum + arr.length, 0);

    res.json({
      query: q,
      total_results: totalResults,
      results,
    });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

export default router;
