const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

process.env.JWT_SECRET = 'test-only-secret';
const { generateToken } = require('../dist/utils/jwt');
const db = require('../dist/config/db').default;
const router = require('../dist/modules/stewardship/stewardship.routes').default;

test('stewardship routes use the authenticated user ID', async (t) => {
  const userId = 'c512d442-1b14-4a2d-bab5-ff62a9cfce15';
  const calls = [];
  const originalQuery = db.query;
  db.query = async (_sql, params) => {
    calls.push(params);
    return { rows: [] };
  };

  const app = express();
  app.use(express.json());
  app.use('/stewardship', router);
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  t.after(() => {
    db.query = originalQuery;
    server.close();
  });

  const base = `http://127.0.0.1:${server.address().port}/stewardship`;
  const auth = { Authorization: `Bearer ${generateToken({ userId })}` };
  const noToken = await fetch(`${base}/current-quarter`);
  assert.equal(noToken.status, 401);
  const invalidToken = await fetch(`${base}/current-quarter`, {
    headers: { Authorization: 'Bearer invalid' },
  });
  assert.equal(invalidToken.status, 401);

  const current = new Date();
  const year = current.getFullYear();
  const quarter = `Q${Math.floor(current.getMonth() / 3) + 1}`;
  const requests = [
    ['GET', '/current-quarter', 200],
    ['GET', `/read-only/${quarter}/${year}`, 200],
    ['GET', '/evidence-of-grace', 200],
    ['POST', '/evidence-of-grace', 201],
    ['GET', '/identity-proofs', 200],
    ['POST', '/identity-proofs', 201],
    ['GET', `/quarterly-audit/identity/${quarter}/${year}`, 200],
    ['POST', `/quarterly-audit/identity/${quarter}/${year}`, 200],
    ['POST', `/quarterly-audit/identity/${quarter}/${year}/complete`, 200],
  ];

  for (const [method, path, status] of requests) {
    const before = calls.length;
    const response = await fetch(`${base}${path}`, {
      method,
      headers: { ...auth, 'Content-Type': 'application/json' },
      ...(method === 'POST' && { body: JSON.stringify({ pillar: 'identity', title: 'Test', description: 'Test', imageUrl: 'https://example.com/image.png' }) }),
    });
    assert.equal(response.status, status, `${method} ${path}`);
    assert.ok(calls.length > before, `${method} ${path} should query the database`);
    for (const params of calls.slice(before)) {
      assert.ok(params.includes(userId), `${method} ${path} must use the authenticated user`);
    }
  }
});
