const test = require('node:test');
const assert = require('node:assert/strict');

process.env.JWT_SECRET = 'test-only-secret';
process.env.AZURE_STORAGE_CONNECTION_STRING =
  'DefaultEndpointsProtocol=https;AccountName=teststorage;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net';
const { generateToken } = require('../dist/utils/jwt');
const db = require('../dist/config/db').default;
const app = require('../dist/app').default;

test('Career and Budget endpoints are registered and use the authenticated user', async (t) => {
  const userId = 'c512d442-1b14-4a2d-bab5-ff62a9cfce15';
  const calls = [];
  const originalQuery = db.query;
  db.query = async (sql, params) => {
    calls.push({ sql, params });
    return { rows: sql.includes('career_profile') ? [{ user_id: userId }] : [] };
  };
  const server = await new Promise((resolve) => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  t.after(() => {
    db.query = originalQuery;
    server.close();
  });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const headers = { Authorization: `Bearer ${generateToken({ userId })}` };
  const paths = [
    '/budgets', '/budgets/summary', '/career-goals', '/skills', '/roles',
    '/feedback-notes', '/resume-versions', '/interview-prep',
    '/career-milestones', '/career-profile', '/impact-notes', '/applications',
  ];
  for (const path of paths) {
    const before = calls.length;
    assert.equal((await fetch(`${base}${path}`)).status, 401, path);
    assert.equal(calls.length, before, 'Unauthenticated requests must not query data');
    const response = await fetch(`${base}${path}`, { headers });
    assert.equal(response.status, 200, path);
    const body = await response.json();
    if (path === '/career-profile') {
      assert.equal(body.user_id, userId);
    } else {
      assert.ok(Array.isArray(body), `${path} should return a list`);
    }
    assert.ok(calls.length > before, `${path} should query the database`);
    for (const call of calls.slice(before)) {
      assert.ok(call.params.includes(userId), `${path} must scope data to the user`);
    }
  }

  for (const path of paths.filter((path) => path !== '/budgets/summary')) {
    const before = calls.length;
    const response = await fetch(`${base}${path}`, {
      method: path === '/career-profile' ? 'PUT' : 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(path === '/career-profile' ? { current_theme: 123 } : {}),
    });
    assert.equal(response.status, 400, `${path} must validate writes`);
    assert.equal(calls.length, before, 'Invalid writes must not query data');
  }
});
