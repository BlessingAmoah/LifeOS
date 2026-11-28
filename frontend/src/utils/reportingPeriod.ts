export const getReportingMonth = (date = new Date()): string => date.toISOString().slice(0, 7);

export const subscribeToReportingMonth = (onChange: (month: string) => void): (() => void) => {
  let timer: number | undefined;
  let previousMonth: string | undefined;

  const refresh = () => {
    window.clearTimeout(timer);
    const now = new Date();
    const month = getReportingMonth(now);
    if (month !== previousMonth) {
      previousMonth = month;
      onChange(month);
    }
    const nextMonth = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
    // Daily checks keep long months below the browser's maximum timer delay.
    timer = window.setTimeout(refresh, Math.min(nextMonth - now.getTime(), 24 * 60 * 60 * 1000));
  };
  const onVisible = () => {
    if (!document.hidden) refresh();
  };

  window.addEventListener('focus', refresh);
  document.addEventListener('visibilitychange', onVisible);
  refresh();
  return () => {
    window.clearTimeout(timer);
    window.removeEventListener('focus', refresh);
    document.removeEventListener('visibilitychange', onVisible);
  };
};
