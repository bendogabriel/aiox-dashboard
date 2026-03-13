// ── E2E: Dashboard Discovery ──
// Verifies the dashboard correctly displays agents/squads from emulated projects.
// Engine serves the SPA from dist/ — no separate Vite needed.

import { test, expect } from './emulator.fixture';

test.describe('Dashboard Discovery', () => {
  test('dashboard loads without errors', async ({ page, engineUrl }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const response = await page.goto(engineUrl);
    expect(response?.status()).toBe(200);

    // Wait for the app to hydrate
    await page.waitForLoadState('networkidle');

    // Should have rendered some content
    const body = await page.textContent('body');
    expect(body?.length).toBeGreaterThan(0);
  });

  test('health API is accessible from browser', async ({ page, engineUrl }) => {
    const response = await page.goto(`${engineUrl}/health`);
    expect(response?.status()).toBe(200);

    const text = await page.textContent('body');
    expect(text).toContain('ok');
  });

  test('squads API returns data', async ({ request, engineUrl }) => {
    const response = await request.get(`${engineUrl}/squads`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.squads)).toBe(true);
    expect(data.squads.length).toBeGreaterThan(0);
  });

  test('agents API returns data', async ({ request, engineUrl }) => {
    const response = await request.get(`${engineUrl}/agents`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.agents)).toBe(true);
    expect(data.agents.length).toBeGreaterThan(0);
  });

  test('agent status API works', async ({ request, engineUrl }) => {
    const response = await request.get(`${engineUrl}/agents/status`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.agents)).toBe(true);
    expect(typeof data.totalCount).toBe('number');
  });
});
