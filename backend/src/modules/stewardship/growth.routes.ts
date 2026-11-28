import express from 'express';
import { body, param, validationResult } from 'express-validator';
import db from '../../config/db';
import { AuthRequest } from '../../middleware/auth.middleware';

const router = express.Router();
const fields: Record<string, string[]> = {
  christian_life: [
    'upward', 'inward', 'withward', 'outward', 'scripture_anchors',
    'intercession_legacy', 'work_altar',
  ],
  personal_growth: [
    'learning_themes', 'book_archive', 'relational_reflections', 'character_notes',
  ],
};
const pillarValidation = param('pillar').isIn(Object.keys(fields));

router.get('/:pillar', pillarValidation, async (req: AuthRequest, res) => {
  if (!validationResult(req).isEmpty()) {
    return res.status(400).json({ error: 'Invalid growth pillar' });
  }
  try {
    const result = await db.query(
      'SELECT content, updated_at FROM growth_content WHERE user_id = $1 AND pillar = $2',
      [req.userId, req.params.pillar]
    );
    res.json(result.rows[0] || { content: {}, updated_at: null });
  } catch (error) {
    console.error('Get growth content error:', error);
    res.status(500).json({ error: 'Failed to load growth content' });
  }
});

router.put(
  '/:pillar',
  pillarValidation,
  body('content').custom((content: unknown, { req }) => {
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      throw new Error('Content must be an object');
    }
    const allowed = fields[req.params?.pillar];
    if (!allowed || Object.entries(content).some(([key, value]) =>
      !allowed.includes(key) || typeof value !== 'string' || value.length > 5000
    )) {
      throw new Error('Content must use supported text fields of at most 5000 characters');
    }
    return true;
  }),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const result = await db.query(
        `INSERT INTO growth_content (user_id, pillar, content)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, pillar) DO UPDATE
         SET content = EXCLUDED.content, updated_at = CURRENT_TIMESTAMP
         RETURNING content, updated_at`,
        [req.userId, req.params.pillar, JSON.stringify(req.body.content)]
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Save growth content error:', error);
      res.status(500).json({ error: 'Failed to save growth content' });
    }
  }
);

export default router;
