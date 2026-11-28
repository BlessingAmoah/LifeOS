import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

test('Insurance preserves exact amounts, separates currencies and surfaces loading failures', async (t) => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  t.after(() => server.close());
  const { default: InsurancePolicies } = await server.ssrLoadModule('/src/components/InsurancePolicies.tsx');
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  t.after(() => client.clear());
  t.mock.timers.enable({ apis: ['Date'], now: Date.UTC(2026, 10, 30) });
  const key = ['insurance-policies', false, 'all', 'all'];
  const policy = {
    id: 'test-life', name: 'Example life policy', policy_type: 'life', insurer_name: 'Example insurer',
    policy_suffix: 'A123', currency: 'GHS', premium_amount: '0.00', premium_frequency: 'monthly',
    coverage_amount: '9007199254740993.01', start_date: null, end_date: null, renewal_date: '2026-12-30',
    status: 'active', notes: null, is_archived: false,
  };
  client.setQueryData(key, [
    policy,
    { ...policy, id: 'test-health', name: 'Example health policy', currency: 'USD', policy_type: 'health', premium_amount: null, premium_frequency: null, coverage_amount: null, renewal_date: '2026-12-31' },
  ]);
  const render = () => renderToString(React.createElement(
    QueryClientProvider, { client }, React.createElement(InsurancePolicies)
  )).replace(/<!--.*?-->/g, '');
  const html = render();
  assert.match(html, /aria-label="GHS insurance policies"/);
  assert.match(html, /aria-label="USD insurance policies"/);
  assert.match(html, /GHS 9007199254740993\.01/);
  assert.match(html, /GHS 0\.00 \/ Monthly/);
  assert.match(html, /N\/A \(not recorded\)/);
  assert.match(html, /Renewal due in 30 days/);
  assert.doesNotMatch(html, /Renewal due in 31 days|NaN|Invalid Date/);
  const { default: api } = await server.ssrLoadModule('/src/services/api.ts');
  const adapter = api.defaults.adapter;
  t.after(() => { api.defaults.adapter = adapter; });
  api.defaults.adapter = async () => { throw new Error('Policy service unavailable'); };
  const query = client.getQueryCache().find({ queryKey: key, exact: true });
  await assert.rejects(client.fetchQuery(query.options), /Policy service unavailable/);
  const failed = render();
  assert.match(failed, /Policy service unavailable/);
  assert.match(failed, /Retry/);
  assert.doesNotMatch(failed, /No insurance policies found/);
});

test('Renewal indicators use UTC calendar days and include the exact 30-day boundary', async (t) => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  t.after(() => server.close());
  const { renewalNotice } = await server.ssrLoadModule('/src/utils/insurance.ts');
  const now = new Date('2026-12-01T00:30:00+01:00');
  const policy = { renewal_date: '2026-12-30', status: 'active', is_archived: false };
  assert.equal(renewalNotice(policy, now), 'Renewal due in 30 days.');
  assert.equal(renewalNotice({ ...policy, renewal_date: '2026-12-31' }, now), null);
  assert.equal(renewalNotice({ ...policy, renewal_date: '2026-11-30' }, now), 'Renewal due today.');
  assert.equal(renewalNotice({ ...policy, renewal_date: '2026-12-01' }, now), 'Renewal due in 1 day.');
  assert.equal(renewalNotice({ ...policy, renewal_date: '2026-11-29' }, now), 'Renewal overdue by 1 day.');
  assert.equal(renewalNotice({ ...policy, renewal_date: null }, now), null);
  assert.equal(renewalNotice({ ...policy, status: 'cancelled' }, now), null);
  assert.equal(renewalNotice({ ...policy, is_archived: true }, now), null);
  assert.equal(renewalNotice({ ...policy, renewal_date: 'invalid' }, now), 'Renewal date unavailable; review this policy.');
});
