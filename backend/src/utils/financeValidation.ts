export const financialCurrencies = ['USD', 'GHS', 'CAD', 'EUR', 'GBP', 'AUD', 'NZD', 'CHF', 'JPY'];

export const isDecimalAmount = (value: unknown): value is string =>
  typeof value === 'string' && /^-?(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/.test(value);

export const isCalendarDate = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
};
