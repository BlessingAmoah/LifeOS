import { Pool } from 'pg';
import { getCurrentQuarter, isPastQuarter, Quarter, QuarterInfo } from '../../utils/quarterly';

export class StewardshipService {
  constructor(private db: Pool) {}

  /**
   * Get current quarter info
   */
  async getCurrentQuarterInfo(userId: string): Promise<QuarterInfo & { isLocked: boolean }> {
    const current = getCurrentQuarter();
    
    // Check lock status
    const lockResult = await this.db.query(
      'SELECT is_locked FROM quarterly_lock_status WHERE user_id = $1',
      [userId]
    );
    
    const isLocked = lockResult.rows[0]?.is_locked || false;
    
    return {
      ...current,
      isLocked,
    };
  }

  /**
   * Check if a quarter is read-only (past quarter or locked)
   */
  async isReadOnly(userId: string, quarter: Quarter, year: number): Promise<boolean> {
    if (isPastQuarter(quarter, year)) {
      return true;
    }
    
    const current = getCurrentQuarter();
    if (quarter === current.quarter && year === current.year) {
      // Check if current quarter is locked
      const lockResult = await this.db.query(
        'SELECT is_locked FROM quarterly_lock_status WHERE user_id = $1',
        [userId]
      );
      return lockResult.rows[0]?.is_locked || false;
    }
    
    return false;
  }

  /**
   * Get Evidence of Grace entries
   */
  async getEvidenceOfGrace(userId: string, quarter?: Quarter, year?: number, pillar?: string) {
    let query = 'SELECT * FROM evidence_of_grace WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (pillar) {
      query += ` AND pillar = $${paramIndex}`;
      params.push(pillar);
      paramIndex++;
    }

    if (quarter && year) {
      query += ` AND quarter = $${paramIndex} AND year = $${paramIndex + 1}`;
      params.push(quarter, year);
      paramIndex += 2;
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.db.query(query, params);
    return result.rows;
  }

  /**
   * Create Evidence of Grace entry
   */
  async createEvidenceOfGrace(
    userId: string,
    pillar: string,
    quarter: Quarter,
    year: number,
    title: string,
    description: string,
    testimony?: string
  ) {
    const result = await this.db.query(
      `INSERT INTO evidence_of_grace (user_id, pillar, quarter, year, title, description, testimony)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, pillar, quarter, year, title, description, testimony || null]
    );
    return result.rows[0];
  }

  /**
   * Get Identity Proofs
   */
  async getIdentityProofs(userId: string, quarter?: Quarter, year?: number, pillar?: string) {
    let query = 'SELECT * FROM identity_proofs WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (pillar) {
      query += ` AND pillar = $${paramIndex}`;
      params.push(pillar);
      paramIndex++;
    }

    if (quarter && year) {
      query += ` AND quarter = $${paramIndex} AND year = $${paramIndex + 1}`;
      params.push(quarter, year);
      paramIndex += 2;
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.db.query(query, params);
    return result.rows;
  }

  /**
   * Create Identity Proof
   */
  async createIdentityProof(
    userId: string,
    pillar: string,
    quarter: Quarter,
    year: number,
    imageUrl: string,
    description?: string
  ) {
    // Check if proof already exists for this pillar/quarter/year
    const existing = await this.db.query(
      'SELECT id FROM identity_proofs WHERE user_id = $1 AND pillar = $2 AND quarter = $3 AND year = $4',
      [userId, pillar, quarter, year]
    );

    if (existing.rows.length > 0) {
      // Update existing
      const result = await this.db.query(
        `UPDATE identity_proofs 
         SET image_url = $1, description = $2, created_at = CURRENT_TIMESTAMP
         WHERE user_id = $3 AND pillar = $4 AND quarter = $5 AND year = $6
         RETURNING *`,
        [imageUrl, description || null, userId, pillar, quarter, year]
      );
      return result.rows[0];
    } else {
      // Create new
      const result = await this.db.query(
        `INSERT INTO identity_proofs (user_id, pillar, quarter, year, image_url, description)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, pillar, quarter, year, imageUrl, description || null]
      );
      return result.rows[0];
    }
  }

  /**
   * Get Quarterly Audit for a pillar
   */
  async getQuarterlyAudit(userId: string, pillar: string, quarter: Quarter, year: number) {
    const result = await this.db.query(
      'SELECT * FROM quarterly_audits WHERE user_id = $1 AND pillar = $2 AND quarter = $3 AND year = $4',
      [userId, pillar, quarter, year]
    );
    return result.rows[0] || null;
  }

  /**
   * Save Quarterly Audit
   */
  async saveQuarterlyAudit(
    userId: string,
    pillar: string,
    quarter: Quarter,
    year: number,
    data: {
      vision?: string;
      reality?: string;
      gapDelta?: string;
      rootCause?: string;
      stopItems?: any[];
      startItems?: any[];
      continueItems?: any[];
      nextCommitments?: any[];
    }
  ) {
    const existing = await this.getQuarterlyAudit(userId, pillar, quarter, year);

    if (existing) {
      // Update
      const result = await this.db.query(
        `UPDATE quarterly_audits 
         SET vision = $1, reality = $2, gap_delta = $3, root_cause = $4,
             stop_items = $5, start_items = $6, continue_items = $7, next_commitments = $8,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $9 AND pillar = $10 AND quarter = $11 AND year = $12
         RETURNING *`,
        [
          data.vision || null,
          data.reality || null,
          data.gapDelta || null,
          data.rootCause || null,
          JSON.stringify(data.stopItems || []),
          JSON.stringify(data.startItems || []),
          JSON.stringify(data.continueItems || []),
          JSON.stringify(data.nextCommitments || []),
          userId,
          pillar,
          quarter,
          year,
        ]
      );
      return result.rows[0];
    } else {
      // Create
      const result = await this.db.query(
        `INSERT INTO quarterly_audits 
         (user_id, pillar, quarter, year, vision, reality, gap_delta, root_cause, stop_items, start_items, continue_items, next_commitments)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          userId,
          pillar,
          quarter,
          year,
          data.vision || null,
          data.reality || null,
          data.gapDelta || null,
          data.rootCause || null,
          JSON.stringify(data.stopItems || []),
          JSON.stringify(data.startItems || []),
          JSON.stringify(data.continueItems || []),
          JSON.stringify(data.nextCommitments || []),
        ]
      );
      return result.rows[0];
    }
  }

  /**
   * Complete Quarterly Audit (marks as completed and triggers snapshot)
   */
  async completeQuarterlyAudit(userId: string, pillar: string, quarter: Quarter, year: number) {
    await this.db.query(
      `UPDATE quarterly_audits 
       SET completed_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND pillar = $2 AND quarter = $3 AND year = $4`,
      [userId, pillar, quarter, year]
    );

    // TODO: Trigger snapshot creation when all pillars are completed
    return { success: true };
  }
}
