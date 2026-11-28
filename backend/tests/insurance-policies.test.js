const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const express = require('express');

process.env.JWT_SECRET = 'test-only-secret';
const { generateToken } = require('../dist/utils/jwt');
const db = require('../dist/config/db').default;
const router = require('../dist/routes/insurance-policies').default;

test('Insurance policies validate manual data, isolate users, filter and archive without deleting records', async (t) => {
  const policies = new Map();
  const userA = randomUUID();
  const userB = randomUUID();
  let calls = 0;
  let failDatabase = false;
  const decimal = value => {
    if (value == null) return null;
    const [whole, fraction = ''] = value.split('.');
    return `${whole}.${fraction.padEnd(2, '0')}`;
  };
  t.mock.method(db, 'query', async (sql, params) => {
    calls++;
    assert.match(sql, /insurance_policies/, 'Insurance must not change other financial tables');
    if (failDatabase) throw new Error('Test database unavailable');
    if (sql.startsWith('INSERT')) {
      const columns = sql.match(/insurance_policies \(([^)]+)\)/)[1].split(',').map(column => column.trim());
      const row = Object.fromEntries(columns.map((column, index) => [column, params[index]]));
      Object.assign(row, { id: randomUUID(), is_archived: false, premium_amount: decimal(row.premium_amount), coverage_amount: decimal(row.coverage_amount) });
      policies.set(row.id, row);
      return { rows: [row] };
    }
    if (sql.startsWith('SELECT') && !sql.includes('WHERE id =')) {
      return { rows: [...policies.values()].filter(row => {
        if (row.user_id !== params[0] || (sql.includes('NOT is_archived') && row.is_archived)) return false;
        return ['policy_type', 'status'].every(field => {
          const filter = sql.match(new RegExp(`${field} = \\$(\\d+)`));
          return !filter || row[field] === params[Number(filter[1]) - 1];
        });
      }) };
    }
    const row = policies.get(params[0]);
    if (!row || row.user_id !== params[1] || (sql.includes('NOT is_archived') && row.is_archived)) return { rows: [] };
    if (sql.startsWith('SELECT')) return { rows: [row] };
    if (sql.startsWith('UPDATE insurance_policies SET is_archived')) {
      row.is_archived = params[2];
    } else {
      for (const match of sql.matchAll(/(\w+) = \$(\d+)/g)) {
        if (match[1] !== 'id' && match[1] !== 'user_id') row[match[1]] = params[Number(match[2]) - 1];
      }
      row.premium_amount = decimal(row.premium_amount);
      row.coverage_amount = decimal(row.coverage_amount);
    }
    return { rows: [row] };
  });
  const app = express();
  app.use(express.json());
  app.use('/policies', router);
  const server = await new Promise(resolve => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/policies`;
  const request = (path, method = 'GET', body, user = userA) => fetch(`${base}${path}`, {
    method, headers: { Authorization: `Bearer ${generateToken({ userId: user })}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = {
    name: '  Example life policy  ', policy_type: 'life', insurer_name: 'Example insurer',
    policy_suffix: 'A123', currency: 'GHS', premium_amount: '100.25', premium_frequency: 'monthly',
    coverage_amount: '9007199254740993.01', start_date: '2026-11-01', end_date: '2027-11-01',
    renewal_date: '2027-11-01', status: 'active', notes: 'Manually recorded policy',
  };
  assert.equal((await fetch(base)).status, 401);
  assert.equal((await request('?status=active&status=expired')).status, 400);
  assert.equal((await request('?include_archived=true&include_archived=false')).status, 400);
  for (const extra of [
    { name: '' }, { insurer_name: ' ' }, { policy_type: ['life'] }, { status: 'unknown' }, { currency: ['GHS'] },
    { currency: 'XYZ' }, { premium_amount: 10 }, { premium_amount: '-0.01' }, { premium_amount: '1.001' },
    { coverage_amount: '-1' }, { coverage_amount: '10000000000000000.00' }, { coverage_amount: 'Infinity' },
    { premium_amount: null }, { premium_frequency: null }, { premium_frequency: 'daily' },
    { start_date: '0000-01-01' }, { start_date: '2026-02-30' }, { renewal_date: '2026-13-01' },
    { end_date: '2026-10-31' }, { policy_suffix: 'FULL123456' }, { policy_number: 'FULL123456' },
    { user_id: userB }, { beneficiaries: [] }, { notes: 'x'.repeat(2001) },
  ]) assert.equal((await request('', 'POST', { ...payload, ...extra })).status, 400);
  assert.equal(calls, 0, 'Invalid or unauthenticated requests must not query the database');

  const created = await request('', 'POST', payload);
  assert.equal(created.status, 201);
  const policy = await created.json();
  assert.equal(policy.name, 'Example life policy');
  assert.equal(policy.user_id, userA);
  assert.equal(policy.coverage_amount, '9007199254740993.01');
  assert.equal(policy.currency, 'GHS');
  assert.equal(policy.start_date, '2026-11-01');
  const unknown = { ...payload, name: 'Unknown premium', policy_type: 'health', currency: 'USD', premium_amount: null, premium_frequency: null, coverage_amount: null, start_date: null, end_date: null, renewal_date: null, status: 'expired' };
  const unknownResponse = await request('', 'POST', unknown);
  assert.equal(unknownResponse.status, 201);
  assert.equal((await unknownResponse.json()).premium_amount, null);
  const zeroResponse = await request('', 'POST', { ...unknown, name: 'Zero premium', premium_amount: '0', premium_frequency: 'annual' });
  assert.equal(zeroResponse.status, 201);
  assert.equal((await zeroResponse.json()).premium_amount, '0.00');
  assert.equal((await (await request('?policy_type=life&status=active')).json()).length, 1);
  assert.equal((await (await request('?policy_type=health&status=expired')).json()).length, 2);

  const updated = { ...payload, name: 'Updated policy', premium_amount: '105.50', notes: null };
  assert.equal((await request(`/${policy.id}`, 'PUT', updated)).status, 200);
  assert.equal((await (await request(`/${policy.id}`)).json()).premium_amount, '105.50');
  for (const [method, data] of [['GET', null], ['PUT', updated], ['PATCH', { is_archived: true }]]) {
    assert.equal((await request(`/${policy.id}`, method, data, userB)).status, 404);
  }
  assert.deepEqual(await (await request('', 'GET', null, userB)).json(), []);
  assert.equal((await request(`/${policy.id}`, 'PATCH', { is_archived: 'true' })).status, 400);
  assert.equal((await request(`/${policy.id}`, 'PATCH', { is_archived: true })).status, 200);
  assert.equal((await (await request('')).json()).length, 2);
  assert.equal((await (await request('?include_archived=true')).json()).length, 3);
  assert.equal((await request(`/${policy.id}`, 'PUT', updated)).status, 404);
  const archived = await (await request(`/${policy.id}`)).json();
  assert.equal(archived.name, 'Updated policy');
  assert.equal(archived.coverage_amount, payload.coverage_amount);
  assert.equal((await request(`/${policy.id}`, 'PATCH', { is_archived: false })).status, 200);
  assert.equal((await (await request('')).json()).length, 3);
  failDatabase = true;
  const failed = await request('');
  assert.equal(failed.status, 500);
  assert.equal((await failed.json()).error, 'Failed to load insurance policies');
});
