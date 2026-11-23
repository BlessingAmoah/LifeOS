/**
 * Quarterly Stewardship Utilities
 * Handles quarter calculation, locking, and read-only mode enforcement
 */

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface QuarterInfo {
  quarter: Quarter;
  year: number;
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
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
 * Get quarter info for a specific quarter and year
 */
export function getQuarterInfo(quarter: Quarter, year: number): QuarterInfo {
  const now = getCurrentQuarter();
  const currentQuarter = now.quarter;
  const currentYear = now.year;

  let quarterMonth: number;
  if (quarter === 'Q1') {
    quarterMonth = 1;
  } else if (quarter === 'Q2') {
    quarterMonth = 4;
  } else if (quarter === 'Q3') {
    quarterMonth = 7;
  } else {
    quarterMonth = 10;
  }

  const startDate = new Date(year, quarterMonth - 1, 1);
  const endDate = new Date(year, quarterMonth + 2, 0, 23, 59, 59, 999);

  return {
    quarter,
    year,
    startDate,
    endDate,
    isCurrent: quarter === currentQuarter && year === currentYear,
  };
}

/**
 * Check if a quarter is in the past
 */
export function isPastQuarter(quarter: Quarter, year: number): boolean {
  const current = getCurrentQuarter();
  
  if (year < current.year) return true;
  if (year > current.year) return false;
  
  const quarterOrder: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  const currentIndex = quarterOrder.indexOf(current.quarter);
  const targetIndex = quarterOrder.indexOf(quarter);
  
  return targetIndex < currentIndex;
}

/**
 * Check if a quarter is in the future
 */
export function isFutureQuarter(quarter: Quarter, year: number): boolean {
  const current = getCurrentQuarter();
  
  if (year > current.year) return true;
  if (year < current.year) return false;
  
  const quarterOrder: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  const currentIndex = quarterOrder.indexOf(current.quarter);
  const targetIndex = quarterOrder.indexOf(quarter);
  
  return targetIndex > currentIndex;
}

/**
 * Get all quarters for a given year
 */
export function getQuartersForYear(year: number): QuarterInfo[] {
  return [
    getQuarterInfo('Q1', year),
    getQuarterInfo('Q2', year),
    getQuarterInfo('Q3', year),
    getQuarterInfo('Q4', year),
  ];
}

/**
 * Get the next quarter
 */
export function getNextQuarter(quarter: Quarter, year: number): QuarterInfo {
  if (quarter === 'Q4') {
    return getQuarterInfo('Q1', year + 1);
  }
  
  const quarterOrder: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  const currentIndex = quarterOrder.indexOf(quarter);
  const nextQuarter = quarterOrder[currentIndex + 1] as Quarter;
  
  return getQuarterInfo(nextQuarter, year);
}

/**
 * Get the previous quarter
 */
export function getPreviousQuarter(quarter: Quarter, year: number): QuarterInfo {
  if (quarter === 'Q1') {
    return getQuarterInfo('Q4', year - 1);
  }
  
  const quarterOrder: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4'];
  const currentIndex = quarterOrder.indexOf(quarter);
  const prevQuarter = quarterOrder[currentIndex - 1] as Quarter;
  
  return getQuarterInfo(prevQuarter, year);
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
 * Format quarter string for display
 */
export function formatQuarter(quarter: Quarter, year: number): string {
  return `${quarter} ${year}`;
}
