const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

process.env.JWT_SECRET = 'test-only-secret';
const { generateToken } = require('../dist/utils/jwt');
const db = require('../dist/config/db').default;
const router = require('../dist/modules/stewardship/stewardship.routes').default;

test('growth reflections persist per user and pillar and reject unsupported content', async (t) => {
  const records = new Map();
  const originalQuery = db.query;
  db.query = async (sql, params) => {
    assert.match(sql, /growth_content/);
    const key = `${params[0]}:${params[1]}`;
    if (sql.startsWith('INSERT')) {
      records.set(key, { content: JSON.parse(params[2]), updated_at: '2026-11-28T00:00:00Z' });
    }
    return { rows: records.has(key) ? [records.get(key)] : [] };
  };
  const app = express();
  app.use(express.json());
  app.use('/stewardship', router);
  const server = await new Promise(resolve => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
  });
  t.after(() => {
    db.query = originalQuery;
    server.close();
  });
  const base = `http://127.0.0.1:${server.address().port}/stewardship/growth`;
  const headers = userId => ({
    Authorization: `Bearer ${generateToken({ userId })}`,
    'Content-Type': 'application/json',
  });
  assert.equal((await fetch(`${base}/christian_life`)).status, 401);
  for (const [pillar, content] of [
    ['christian_life', { upward: 'Prayer and rest', work_altar: 'Service through work' }],
    ['personal_growth', { learning_themes: 'Listening', book_archive: 'Book reflections' }],
  ]) {
    const saved = await fetch(`${base}/${pillar}`, {
      method: 'PUT', headers: headers('user-a'), body: JSON.stringify({ content }),
    });
    assert.equal(saved.status, 200);
    const loaded = await fetch(`${base}/${pillar}`, { headers: headers('user-a') });
    assert.deepEqual((await loaded.json()).content, content);
    const otherUser = await fetch(`${base}/${pillar}`, { headers: headers('user-b') });
    assert.deepEqual(await otherUser.json(), { content: {}, updated_at: null });
  }
  const count = records.size;
  for (const [pillar, content] of [
    ['christian_life', { book_archive: 'Wrong pillar' }],
    ['personal_growth', { learning_themes: 123 }],
    ['personal_growth', { learning_themes: 'x'.repeat(5001) }],
    ['personal_growth', []],
    ['unknown', {}],
  ]) {
    const response = await fetch(`${base}/${pillar}`, {
      method: 'PUT', headers: headers('user-a'), body: JSON.stringify({ content }),
    });
    assert.equal(response.status, 400);
  }
  assert.equal(records.size, count);
});
