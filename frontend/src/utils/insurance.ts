export const policyTypes = [
  ['life', 'Life'], ['health', 'Health'], ['auto', 'Auto'], ['home', 'Home'],
  ['renters', 'Renters'], ['disability', 'Disability'], ['travel', 'Travel'], ['other', 'Other'],
] as const;
export const policyStatuses = [['active', 'Active'], ['expired', 'Expired'], ['cancelled', 'Cancelled']] as const;
export const premiumFrequencies = [
  ['weekly', 'Weekly'], ['biweekly', 'Every two weeks'], ['monthly', 'Monthly'],
  ['quarterly', 'Quarterly'], ['semiannual', 'Every six months'], ['annual', 'Annually'], ['one_time', 'One-off'],
] as const;
export type PolicyType = typeof policyTypes[number][0];
export type PolicyStatus = typeof policyStatuses[number][0];
export type PremiumFrequency = typeof premiumFrequencies[number][0];

export interface InsurancePolicy {
  id: string;
  name: string;
  policy_type: PolicyType;
  insurer_name: string;
  policy_suffix: string | null;
  currency: string;
  premium_amount: string | null;
  premium_frequency: PremiumFrequency | null;
  coverage_amount: string | null;
  start_date: string | null;
  end_date: string | null;
  renewal_date: string | null;
  status: PolicyStatus;
  notes: string | null;
  is_archived: boolean;
}

export function renewalNotice(policy: Pick<InsurancePolicy, 'renewal_date' | 'status' | 'is_archived'>, now = new Date()): string | null {
  if (policy.is_archived || policy.status === 'cancelled' || !policy.renewal_date) return null;
  const days = (Date.parse(policy.renewal_date) - Date.parse(now.toISOString().slice(0, 10))) / 86400000;
  if (!Number.isFinite(days)) return 'Renewal date unavailable; review this policy.';
  if (days < 0) return `Renewal overdue by ${-days} ${days === -1 ? 'day' : 'days'}.`;
  if (days === 0) return 'Renewal due today.';
  if (days <= 30) return `Renewal due in ${days} ${days === 1 ? 'day' : 'days'}.`;
  return null;
}
