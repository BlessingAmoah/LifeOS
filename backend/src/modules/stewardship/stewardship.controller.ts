import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { StewardshipService } from './stewardship.service';
import { getCurrentQuarter, Quarter } from '../../utils/quarterly';

export class StewardshipController {
  constructor(private stewardshipService: StewardshipService) {}

  /**
   * GET /api/stewardship/current-quarter
   * Get current quarter info and lock status
   */
  async getCurrentQuarter(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const quarterInfo = await this.stewardshipService.getCurrentQuarterInfo(userId);
      res.json(quarterInfo);
    } catch (error: any) {
      console.error('Error getting current quarter:', error);
      res.status(500).json({ error: error.message || 'Failed to get current quarter' });
    }
  }

  /**
   * GET /api/stewardship/read-only/:quarter/:year
   * Check if a quarter is read-only
   */
  async checkReadOnly(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { quarter, year } = req.params;
      const isReadOnly = await this.stewardshipService.isReadOnly(
        userId,
        quarter as Quarter,
        parseInt(year)
      );
      res.json({ isReadOnly });
    } catch (error: any) {
      console.error('Error checking read-only:', error);
      res.status(500).json({ error: error.message || 'Failed to check read-only status' });
    }
  }

  /**
   * GET /api/stewardship/evidence-of-grace
   * Get Evidence of Grace entries
   */
  async getEvidenceOfGrace(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { quarter, year, pillar } = req.query;
      const entries = await this.stewardshipService.getEvidenceOfGrace(
        userId,
        quarter as Quarter | undefined,
        year ? parseInt(year as string) : undefined,
        pillar as string | undefined
      );
      res.json(entries);
    } catch (error: any) {
      console.error('Error getting evidence of grace:', error);
      res.status(500).json({ error: error.message || 'Failed to get evidence of grace' });
    }
  }

  /**
   * POST /api/stewardship/evidence-of-grace
   * Create Evidence of Grace entry
   */
  async createEvidenceOfGrace(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { pillar, quarter, year, title, description, testimony } = req.body;
      const current = getCurrentQuarter();

      const entry = await this.stewardshipService.createEvidenceOfGrace(
        userId,
        pillar,
        (quarter || current.quarter) as Quarter,
        year || current.year,
        title,
        description,
        testimony
      );
      res.status(201).json(entry);
    } catch (error: any) {
      console.error('Error creating evidence of grace:', error);
      res.status(500).json({ error: error.message || 'Failed to create evidence of grace' });
    }
  }

  /**
   * GET /api/stewardship/identity-proofs
   * Get Identity Proofs
   */
  async getIdentityProofs(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { quarter, year, pillar } = req.query;
      const proofs = await this.stewardshipService.getIdentityProofs(
        userId,
        quarter as Quarter | undefined,
        year ? parseInt(year as string) : undefined,
        pillar as string | undefined
      );
      res.json(proofs);
    } catch (error: any) {
      console.error('Error getting identity proofs:', error);
      res.status(500).json({ error: error.message || 'Failed to get identity proofs' });
    }
  }

  /**
   * POST /api/stewardship/identity-proofs
   * Create Identity Proof
   */
  async createIdentityProof(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { pillar, quarter, year, imageUrl, description } = req.body;
      const current = getCurrentQuarter();

      const proof = await this.stewardshipService.createIdentityProof(
        userId,
        pillar,
        (quarter || current.quarter) as Quarter,
        year || current.year,
        imageUrl,
        description
      );
      res.status(201).json(proof);
    } catch (error: any) {
      console.error('Error creating identity proof:', error);
      res.status(500).json({ error: error.message || 'Failed to create identity proof' });
    }
  }

  /**
   * GET /api/stewardship/quarterly-audit/:pillar/:quarter/:year
   * Get Quarterly Audit for a pillar
   */
  async getQuarterlyAudit(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { pillar, quarter, year } = req.params;
      const audit = await this.stewardshipService.getQuarterlyAudit(
        userId,
        pillar,
        quarter as Quarter,
        parseInt(year)
      );
      res.json(audit);
    } catch (error: any) {
      console.error('Error getting quarterly audit:', error);
      res.status(500).json({ error: error.message || 'Failed to get quarterly audit' });
    }
  }

  /**
   * POST /api/stewardship/quarterly-audit/:pillar/:quarter/:year
   * Save Quarterly Audit
   */
  async saveQuarterlyAudit(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { pillar, quarter, year } = req.params;
      const audit = await this.stewardshipService.saveQuarterlyAudit(
        userId,
        pillar,
        quarter as Quarter,
        parseInt(year),
        req.body
      );
      res.json(audit);
    } catch (error: any) {
      console.error('Error saving quarterly audit:', error);
      res.status(500).json({ error: error.message || 'Failed to save quarterly audit' });
    }
  }

  /**
   * POST /api/stewardship/quarterly-audit/:pillar/:quarter/:year/complete
   * Complete Quarterly Audit
   */
  async completeQuarterlyAudit(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { pillar, quarter, year } = req.params;
      const result = await this.stewardshipService.completeQuarterlyAudit(
        userId,
        pillar,
        quarter as Quarter,
        parseInt(year)
      );
      res.json(result);
    } catch (error: any) {
      console.error('Error completing quarterly audit:', error);
      res.status(500).json({ error: error.message || 'Failed to complete quarterly audit' });
    }
  }
}
