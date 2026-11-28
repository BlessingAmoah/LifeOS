import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

test('Finance identifies surplus, reporting dates, and absent activity without disguising zero balances', async (t) => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  t.after(() => server.close());
  const { default: Financial } = await server.ssrLoadModule('/src/pages/Financial.tsx');
  const { getReportingMonth } = await server.ssrLoadModule('/src/utils/reportingPeriod.ts');
  const dashboardKey = ['financial-dashboard', getReportingMonth()];
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  t.after(() => client.clear());
  const dashboard = {
    period: { start_date: '2024-02-01', end_date: '2024-02-29', month: 2, year: 2024 },
    overview: { income: 0, expenses: 0, savings: 0, net_cash_flow: 0, income_count: 0, expense_count: 0 },
    budgets: [],
    savings_goals: [],
    recent_transactions: [],
    health_indicators: { savings_rate: 0, expense_to_income_ratio: 0, budget_adherence: 100 },
  };
  const render = () => renderToString(React.createElement(
    QueryClientProvider, { client }, React.createElement(Financial)
  )).replace(/<!--.*?-->/g, '');
  client.setQueryData(dashboardKey, dashboard);
  const empty = render();
  assert.match(empty, /Cash-flow Surplus/);
  assert.match(empty, /not a savings account balance/);
  assert.match(empty, /2024-02-01/);
  assert.match(empty, /2024-02-29/);
  assert.match(empty, /Current month \(UTC\)/);
  assert.match(empty, /No income or expense transactions recorded for this period/);
  assert.match(empty, /title="No recorded income for this period"[^>]*>N\/A/);
  assert.match(empty, /No active budgets/);

  client.setQueryData(dashboardKey, {
    ...dashboard,
    overview: { income: 200, expenses: 200, savings: 0, net_cash_flow: 0, income_count: 1, expense_count: 1 },
    health_indicators: { savings_rate: 0, expense_to_income_ratio: 100, budget_adherence: 100 },
  });
  const zero = render();
  assert.doesNotMatch(zero, /No income or expense transactions recorded/);
  assert.doesNotMatch(zero, /Not applicable \(no income\)/);
  assert.match(zero, /0\.0%/);
  assert.match(zero, /\$0\.00/);

  const { default: api } = await server.ssrLoadModule('/src/services/api.ts');
  const originalAdapter = api.defaults.adapter;
  t.after(() => { api.defaults.adapter = originalAdapter; });
  const latestQuery = client.getQueryCache().find({ queryKey: ['latest-net-worth'], exact: true });
  assert.ok(latestQuery);
  api.defaults.adapter = async (config) => {
    throw Object.assign(new Error('Database unavailable'), {
      config, response: { status: 500, data: { error: 'Database unavailable' } },
    });
  };
  await assert.rejects(client.fetchQuery({ ...latestQuery.options, retry: false }), /Database unavailable/);
  assert.equal(client.getQueryState(['latest-net-worth']).status, 'error');

  api.defaults.adapter = async (config) => ({
    config, status: 200, statusText: 'OK', headers: {}, data: null,
  });
  assert.equal(await client.fetchQuery(latestQuery.options), null);
  assert.equal(client.getQueryState(['latest-net-worth']).status, 'success');
});

test('Reporting month handles long waits, year rollover, sleeping tabs and cleanup', async (t) => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  const { getReportingMonth, subscribeToReportingMonth } = await server.ssrLoadModule('/src/utils/reportingPeriod.ts');
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  let unsubscribe;
  t.after(async () => {
    unsubscribe?.();
    t.mock.timers.reset();
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
    else delete globalThis.window;
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else delete globalThis.document;
    await server.close();
  });

  const delays = [];
  const browser = new EventTarget();
  browser.setTimeout = (callback, delay) => {
    delays.push(delay);
    return setTimeout(callback, delay);
  };
  browser.clearTimeout = timer => clearTimeout(timer);
  const document = new EventTarget();
  document.hidden = false;
  Object.defineProperty(globalThis, 'window', { configurable: true, value: browser });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: document });
  const day = 24 * 60 * 60 * 1000;
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: Date.UTC(2026, 10, 1) });
  assert.equal(getReportingMonth(new Date('2026-12-01T00:30:00+01:00')), '2026-11');
  const months = [];
  unsubscribe = subscribeToReportingMonth(month => months.push(month));
  t.mock.timers.tick(29 * day);
  assert.deepEqual(months, ['2026-11']);
  t.mock.timers.tick(day);
  assert.deepEqual(months, ['2026-11', '2026-12']);
  t.mock.timers.tick(31 * day);
  assert.deepEqual(months, ['2026-11', '2026-12', '2027-01']);
  assert.ok(delays.every(delay => delay > 0 && delay <= day));

  t.mock.timers.setTime(Date.UTC(2027, 1, 1));
  document.hidden = true;
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(months.at(-1), '2027-01');
  document.hidden = false;
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(months.at(-1), '2027-02');
  browser.dispatchEvent(new Event('focus'));
  assert.equal(months.length, 4);

  t.mock.timers.setTime(Date.UTC(2027, 2, 1));
  browser.dispatchEvent(new Event('focus'));
  assert.equal(months.at(-1), '2027-03');
  unsubscribe();
  t.mock.timers.setTime(Date.UTC(2027, 3, 1));
  browser.dispatchEvent(new Event('focus'));
  document.dispatchEvent(new Event('visibilitychange'));
  t.mock.timers.tick(day);
  assert.equal(months.at(-1), '2027-03');
});

test('Net worth distinguishes unavailable values from genuine zero snapshots', async (t) => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  t.after(() => server.close());
  const { getNetWorthDisplay } = await server.ssrLoadModule('/src/utils/netWorthDisplay.ts');
  const missing = getNetWorthDisplay({});
  assert.equal(missing.assets, 'N/A');
  assert.equal(missing.liabilities, 'N/A');
  assert.equal(missing.netWorth, 'N/A');
  assert.equal(missing.date, 'N/A');
  assert.equal(missing.hasUnavailableValues, true);
  const partial = getNetWorthDisplay({
    total_assets: '0.00', total_liabilities: '', net_worth: 'Infinity', snapshot_date: 'invalid',
  });
  assert.equal(partial.assets, '$0.00');
  assert.equal(partial.liabilities, 'N/A');
  assert.equal(partial.netWorth, 'N/A');
  assert.equal(partial.netWorthValue, null);
  assert.equal(partial.date, 'N/A');
  assert.equal(partial.hasUnavailableValues, true);
  const zero = getNetWorthDisplay({
    total_assets: '0.00', total_liabilities: 0, net_worth: '0.00', snapshot_date: '2026-11-30',
  });
  assert.equal(zero.assets, '$0.00');
  assert.equal(zero.liabilities, '$0.00');
  assert.equal(zero.netWorth, '$0.00');
  assert.notEqual(zero.date, 'N/A');
  assert.equal(zero.hasUnavailableValues, false);
});
