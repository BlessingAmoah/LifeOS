import express from 'express';
import { body, param } from 'express-validator';
import { StewardshipController } from './stewardship.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { StewardshipService } from './stewardship.service';
import db from '../../config/db';

const router = express.Router();
const stewardshipService = new StewardshipService(db);
const stewardshipController = new StewardshipController(stewardshipService);

// All routes require authentication
router.use(authenticate);

// Current quarter info
router.get('/current-quarter', (req, res) => stewardshipController.getCurrentQuarter(req, res));

// Read-only check
router.get(
  '/read-only/:quarter/:year',
  [param('quarter').isIn(['Q1', 'Q2', 'Q3', 'Q4']), param('year').isInt()],
  (req, res) => stewardshipController.checkReadOnly(req, res)
);

// Evidence of Grace
router.get('/evidence-of-grace', (req, res) => stewardshipController.getEvidenceOfGrace(req, res));

router.post(
  '/evidence-of-grace',
  [
    body('pillar').isIn(['identity', 'employment', 'finance', 'immigration', 'health', 'christian_life', 'personal_growth']),
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
  ],
  (req, res) => stewardshipController.createEvidenceOfGrace(req, res)
);

// Identity Proofs
router.get('/identity-proofs', (req, res) => stewardshipController.getIdentityProofs(req, res));

router.post(
  '/identity-proofs',
  [
    body('pillar').isIn(['identity', 'employment', 'finance', 'immigration', 'health', 'christian_life', 'personal_growth']),
    body('imageUrl').notEmpty().isURL(),
  ],
  (req, res) => stewardshipController.createIdentityProof(req, res)
);

// Quarterly Audit
router.get(
  '/quarterly-audit/:pillar/:quarter/:year',
  [
    param('pillar').isIn(['identity', 'employment', 'finance', 'immigration', 'health', 'christian_life', 'personal_growth']),
    param('quarter').isIn(['Q1', 'Q2', 'Q3', 'Q4']),
    param('year').isInt(),
  ],
  (req, res) => stewardshipController.getQuarterlyAudit(req, res)
);

router.post(
  '/quarterly-audit/:pillar/:quarter/:year',
  [
    param('pillar').isIn(['identity', 'employment', 'finance', 'immigration', 'health', 'christian_life', 'personal_growth']),
    param('quarter').isIn(['Q1', 'Q2', 'Q3', 'Q4']),
    param('year').isInt(),
  ],
  (req, res) => stewardshipController.saveQuarterlyAudit(req, res)
);

router.post(
  '/quarterly-audit/:pillar/:quarter/:year/complete',
  [
    param('pillar').isIn(['identity', 'employment', 'finance', 'immigration', 'health', 'christian_life', 'personal_growth']),
    param('quarter').isIn(['Q1', 'Q2', 'Q3', 'Q4']),
    param('year').isInt(),
  ],
  (req, res) => stewardshipController.completeQuarterlyAudit(req, res)
);

export default router;
