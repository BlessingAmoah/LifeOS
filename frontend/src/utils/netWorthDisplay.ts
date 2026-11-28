interface SnapshotValues {
  total_assets?: unknown;
  total_liabilities?: unknown;
  net_worth?: unknown;
  snapshot_date?: unknown;
}

const parseAmount = (value: unknown): number | null => {
  if ((typeof value !== 'string' && typeof value !== 'number') ||
      (typeof value === 'string' && value.trim() === '')) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
};

export const getNetWorthDisplay = (snapshot: SnapshotValues) => {
  const assets = parseAmount(snapshot.total_assets);
  const liabilities = parseAmount(snapshot.total_liabilities);
  const netWorth = parseAmount(snapshot.net_worth);
  const date = typeof snapshot.snapshot_date === 'string' && snapshot.snapshot_date.trim() !== ''
    ? new Date(snapshot.snapshot_date) : null;
  const validDate = date !== null && Number.isFinite(date.getTime());
  const format = (value: number | null) => value === null ? 'N/A' : `$${value.toFixed(2)}`;
  return {
    assets: format(assets),
    liabilities: format(liabilities),
    netWorth: format(netWorth),
    netWorthValue: netWorth,
    date: validDate ? date.toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'N/A',
    hasUnavailableValues: assets === null || liabilities === null || netWorth === null || !validDate,
  };
};
