import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

test('the navbar profile destination renders the profile without ending the session', async (t) => {
  const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' });
  t.after(() => server.close());
  const previousStorage = globalThis.localStorage;
  const storedSession = JSON.stringify({
    state: {
      user: { id: 'test-user', email: 'test@example.com', is_verified: true },
      token: 'test-token',
      isAuthenticated: true,
    },
    version: 0,
  });
  globalThis.localStorage = {
    getItem: () => storedSession,
    setItem() {},
    removeItem() {},
  };
  t.after(() => { globalThis.localStorage = previousStorage; });
  const { default: Navbar } = await server.ssrLoadModule('/src/components/Navbar.tsx');
  const { default: App } = await server.ssrLoadModule('/src/App.tsx');
  const { useAuthStore } = await server.ssrLoadModule('/src/context/AuthContext.tsx');
  Object.assign(useAuthStore.getInitialState(), useAuthStore.getState());
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  t.after(() => client.clear());
  const profile = { email: 'test@example.com', full_name: 'Test User', phone_numbers: [] };
  client.setQueryData(['profile'], profile);
  const wrap = (child) => React.createElement(QueryClientProvider, { client }, child);
  const navbar = renderToString(wrap(
    React.createElement(MemoryRouter, { initialEntries: ['/dashboard'] }, React.createElement(Navbar))
  ));
  const profileLink = navbar.match(/<a\b[^>]*class="navbar-avatar-link"[^>]*>/)?.[0];
  const destination = profileLink?.match(/href="([^"]+)"/)?.[1];
  assert.equal(destination, '/dashboard/profile', navbar);

  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  globalThis.window = {
    document: {},
    location: { pathname: destination, search: '', hash: '', origin: 'http://localhost' },
    history: { state: { idx: 0 }, replaceState() {}, pushState() {} },
    addEventListener() {},
    removeEventListener() {},
  };
  globalThis.document = { defaultView: globalThis.window };
  t.after(() => {
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  });
  const html = renderToString(wrap(React.createElement(App)));
  assert.match(html, /Account Info/);
  assert.match(html, /Test User/);
  assert.equal(useAuthStore.getState().isAuthenticated, true);
  assert.equal(useAuthStore.getState().token, 'test-token');
  for (const [path, pillar, heading] of [
    ['/dashboard/christian-life', 'christian_life', 'Rule of Life'],
    ['/dashboard/personal', 'personal_growth', 'Learning Themes'],
  ]) {
    client.setQueryData(['growth-content', pillar], {
      content: { [pillar === 'christian_life' ? 'upward' : 'learning_themes']: 'Saved reflection' },
      updated_at: null,
    });
    globalThis.window.location.pathname = path;
    const page = renderToString(wrap(React.createElement(App)));
    assert.ok(page.includes(heading), `${path} must render the intended page`);
    assert.match(page, /Saved reflection/);
    assert.ok(page.includes(`quarterly-audit?pillar=${pillar}`));
    assert.equal(useAuthStore.getState().isAuthenticated, true);
  }
});
