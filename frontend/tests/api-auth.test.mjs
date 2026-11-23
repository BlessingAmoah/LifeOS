import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('login errors stay on the form while protected 401 responses end the session', async (t) => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
  t.after(() => server.close());
  const { default: api } = await server.ssrLoadModule('/src/services/api.ts');
  const { useAuthStore } = await server.ssrLoadModule('/src/context/AuthContext.tsx');
  const originalWindow = globalThis.window;
  globalThis.window = { location: { href: '' } };
  t.after(() => { globalThis.window = originalWindow; });

  useAuthStore.getState().setAuth(
    { id: 'test-user', email: 'test@example.com', is_verified: true },
    'test-token'
  );
  api.defaults.adapter = async (config) => {
    assert.equal(config.headers.Authorization, 'Bearer test-token');
    throw { config, response: { status: 401, data: { error: 'Invalid credentials' } } };
  };

  await assert.rejects(api.post('/auth/login', {}), (error) => {
    assert.equal(error.response.data.error, 'Invalid credentials');
    return true;
  });
  assert.equal(globalThis.window.location.href, '');
  assert.equal(useAuthStore.getState().isAuthenticated, true);

  await assert.rejects(api.get('/profiles'));
  assert.equal(globalThis.window.location.href, '/login');
  assert.equal(useAuthStore.getState().isAuthenticated, false);
});
