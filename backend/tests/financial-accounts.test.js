const test = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const express = require('express');

process.env.JWT_SECRET = 'test-only-secret';
const { generateToken } = require('../dist/utils/jwt');
const db = require('../dist/config/db').default;
const router = require('../dist/routes/financial-accounts').default;

test('manual accounts isolate users, retain dated balances, and archive without deleting history', async (t) => {
  const accounts = new Map();
  const histories = new Map();
  const userA = randomUUID();
  const userB = randomUUID();
  let sequence = 0;
  let calls = 0;
  let failDatabase = false;
  const addBalance = (id, amount, date) => {
    const [whole, fraction = ''] = amount.split('.');
    const row = { id: String(++sequence), balance: `${whole}.${fraction.padEnd(2, '0')}`, balance_as_of: date, recorded_at: '2026-11-28T00:00:00Z' };
    histories.get(id).push(row);
    return row;
  };
  const history = id => [...histories.get(id)].sort((a, b) =>
    b.balance_as_of.localeCompare(a.balance_as_of) || Number(b.id) - Number(a.id));
  const view = account => ({ ...account, ...history(account.id)[0], id: account.id });
  t.mock.method(db, 'query', async (sql, params) => {
    calls++;
    if (failDatabase) throw new Error('Test database unavailable');
    if (sql.includes('WITH new_account AS')) {
      const [user_id, name, account_type, currency, institution_name, account_suffix, is_stale, balance, date] = params;
      const account = { id: randomUUID(), user_id, name, account_type, currency, institution_name, account_suffix, is_stale, is_archived: false, source: 'manual' };
      accounts.set(account.id, account);
      histories.set(account.id, []);
      addBalance(account.id, balance, date);
      return { rows: [view(account)] };
    }
    if (sql.includes('SELECT a.*')) {
      const single = sql.includes('WHERE a.id = $1');
      return { rows: [...accounts.values()].filter(account =>
        account.user_id === params[single ? 1 : 0] && (!single || account.id === params[0]) &&
        (!sql.includes('AND NOT a.is_archived') || !account.is_archived)).map(view) };
    }
    const account = accounts.get(params[0]);
    if (!account || account.user_id !== params[1] || (sql.includes('AND NOT is_archived') && account.is_archived)) return { rows: [] };
    if (sql.includes('SELECT b.id')) return { rows: history(account.id) };
    if (sql.startsWith('UPDATE financial_accounts SET name')) {
      Object.assign(account, { name: params[2], account_type: params[3], institution_name: params[4], account_suffix: params[5], is_stale: params[6] });
      return { rows: [account] };
    }
    if (sql.startsWith('UPDATE financial_accounts SET is_archived')) {
      account.is_archived = params[2];
      return { rows: [account] };
    }
    if (sql.includes('INSERT INTO financial_account_balances')) return { rows: [addBalance(account.id, params[2], params[3])] };
    throw new Error(`Unexpected query: ${sql}`);
  });
  const app = express();
  app.use(express.json());
  app.use('/accounts', router);
  const server = await new Promise(resolve => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/accounts`;
  const request = (path, method = 'GET', body, user = userA) => fetch(`${base}${path}`, {
    method, headers: { Authorization: `Bearer ${generateToken({ userId: user })}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  assert.equal((await fetch(base)).status, 401);
  assert.equal(calls, 0);
  const payload = {
    name: 'Emergency savings', account_type: 'savings', currency: 'USD', institution_name: 'Chase',
    account_suffix: '1234', balance: '100.00', balance_as_of: '2026-11-01',
  };
  assert.equal((await request('?include_archived=true&include_archived=false')).status, 400);
  for (const extra of [
    { balance: '1.001' }, { balance: 1 }, { balance_as_of: '2026-02-30' }, { balance_as_of: '0000-01-01' }, { currency: 'XYZ' },
    { currency: ['USD'] }, { account_type: ['savings'] },
    { account_suffix: '123456789' }, { account_number: '1234567890123456' }, { cvv: '123' }, { user_id: userB },
  ]) {
    assert.equal((await request('', 'POST', { ...payload, ...extra })).status, 400);
  }
  assert.equal(calls, 0, 'Invalid inputs must not query the database');
  const created = await request('', 'POST', payload);
  assert.equal(created.status, 201);
  const account = await created.json();
  for (const [account_type, currency, institution_name] of [
    ['investment', 'EUR', 'Fidelity'], ['credit_card', 'USD', 'American Express'],
    ['cash', 'GHS', 'MTN MoMo (Ghana)'],
    ['credit_card', 'USD', 'Apple Card'],
    ['checking', 'USD', 'OnePay'], ['savings', 'USD', 'OnePay'],
    ['credit_card', 'USD', 'OnePay'], ['investment', 'USD', 'OnePay'],
  ]) {
    const balance = account_type === 'credit_card' ? '9007199254740993.01' : payload.balance;
    const response = await request('', 'POST', { ...payload, account_type, currency, institution_name, balance });
    assert.equal(response.status, 201);
    assert.equal((await response.json()).balance, balance);
  }
  const savedAccounts = await (await request('')).json();
  assert.deepEqual(new Set(savedAccounts.filter(item => item.institution_name === 'OnePay').map(item => item.account_type)),
    new Set(['checking', 'savings', 'credit_card', 'investment']));
  assert.equal(savedAccounts.find(item => item.institution_name === 'MTN MoMo (Ghana)').currency, 'GHS');
  assert.equal(savedAccounts.find(item => item.institution_name === 'Apple Card').account_type, 'credit_card');
  const accountCount = savedAccounts.length;
  for (const [balance, balance_as_of] of [
    ['250.00', '2026-11-20'], ['175.00', '2026-11-05'], ['300.00', '2026-11-20'],
  ]) assert.equal((await request(`/${account.id}/balances`, 'POST', { balance, balance_as_of })).status, 201);
  const detail = await (await request(`/${account.id}`)).json();
  assert.equal(detail.account.balance, '300.00');
  assert.equal(detail.balance_history.length, 4);
  assert.equal(detail.balance_history[0].balance, '300.00');
  const metadata = { name: 'Renamed savings', account_type: 'savings', institution_name: 'Other credit union', account_suffix: '4321', is_stale: true };
  assert.equal((await request(`/${account.id}`, 'PUT', metadata)).status, 200);
  assert.equal((await request(`/${account.id}`, 'PUT', { ...metadata, currency: 'EUR' })).status, 400);
  for (const [path, method, data] of [
    [`/${account.id}`, 'GET', null], [`/${account.id}`, 'PUT', metadata],
    [`/${account.id}`, 'PATCH', { is_archived: true }],
    [`/${account.id}/balances`, 'POST', { balance: '1.00', balance_as_of: '2026-11-27' }],
  ]) assert.equal((await request(path, method, data, userB)).status, 404);
  assert.deepEqual(await (await request('', 'GET', null, userB)).json(), []);
  assert.equal((await request(`/${account.id}`, 'PATCH', { is_archived: true })).status, 200);
  assert.equal((await (await request('')).json()).length, accountCount - 1);
  assert.equal((await (await request('?include_archived=true')).json()).length, accountCount);
  assert.equal((await (await request(`/${account.id}`)).json()).balance_history.length, 4);
  assert.equal((await request(`/${account.id}/balances`, 'POST', { balance: '1.00', balance_as_of: '2026-11-27' })).status, 404);
  assert.equal((await request(`/${account.id}`, 'PATCH', { is_archived: false })).status, 200);
  assert.equal((await (await request('')).json()).length, accountCount);
  failDatabase = true;
  assert.equal((await request('')).status, 500);
});
