/**
 * Quarterly Stewardship Utilities (Frontend)
 * Handles quarter calculation and formatting
 */

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface QuarterInfo {
  quarter: Quarter;
  year: number;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  isLocked?: boolean;
}

/**
 * Get the current quarter and year
 */
export function getCurrentQuarter(): QuarterInfo {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();

  let quarter: Quarter;
  let quarterMonth: number;

  if (month >= 1 && month <= 3) {
    quarter = 'Q1';
    quarterMonth = 1;
  } else if (month >= 4 && month <= 6) {
    quarter = 'Q2';
    quarterMonth = 4;
  } else if (month >= 7 && month <= 9) {
    quarter = 'Q3';
    quarterMonth = 7;
  } else {
    quarter = 'Q4';
    quarterMonth = 10;
  }

  const startDate = new Date(year, quarterMonth - 1, 1);
  const endDate = new Date(year, quarterMonth + 2, 0, 23, 59, 59, 999); // Last day of quarter

  return {
    quarter,
    year,
    startDate,
    endDate,
    isCurrent: true,
  };
}

/**
 * Format quarter string for display
 */
export function formatQuarter(quarter: Quarter, year: number): string {
  return `${quarter} ${year}`;
}

/**
 * Check if we're in the last 14 days of the quarter (Gap Analysis window)
 */
export function isGapAnalysisWindow(): boolean {
  const current = getCurrentQuarter();
  const now = new Date();
  const daysUntilEnd = Math.ceil((current.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  return daysUntilEnd <= 14 && daysUntilEnd >= 0;
}

/**
 * Get quarter progress percentage (0-100)
 */
export function getQuarterProgress(): number {
  const current = getCurrentQuarter();
  const now = new Date();
  const totalDays = current.endDate.getTime() - current.startDate.getTime();
  const elapsedDays = now.getTime() - current.startDate.getTime();
  const progress = Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100));
  return Math.round(progress);
}

/**
 * Get days until quarter ends
 */
export function getDaysUntilQuarterEnd(): number {
  const current = getCurrentQuarter();
  const now = new Date();
  const daysUntilEnd = Math.ceil((current.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysUntilEnd);
}
