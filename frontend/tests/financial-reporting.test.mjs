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
  client.setQueryData(['financial-dashboard'], dashboard);
  const empty = render();
  assert.match(empty, /Cash-flow Surplus/);
  assert.match(empty, /not a savings account balance/);
  assert.match(empty, /2024-02-01/);
  assert.match(empty, /2024-02-29/);
  assert.match(empty, /No income or expense transactions recorded for this period/);
  assert.match(empty, /Not applicable \(no income\)/);
  assert.match(empty, /No active budgets/);

  client.setQueryData(['financial-dashboard'], {
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
