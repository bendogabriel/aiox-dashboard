// ── E2E: Chat with Emulated Agent ──
// Verifies that the SPA renders and agent detail routes are functional.

import { test, expect } from './emulator.fixture';

test.describe('Dashboard SPA Navigation', () => {
  test('SPA routes are served (client-side routing)', async ({ page, engineUrl }) => {
    // Engine serves index.html for SPA routes
    const response = await page.goto(engineUrl);
    expect(response?.status()).toBe(200);

    // The page should contain the React root
    const root = page.locator('#root, #app, [data-reactroot]');
    await expect(root.first()).toBeAttached({ timeout: 5_000 });
  });

  test('agent detail endpoint returns full content', async ({ request, engineUrl }) => {
    // First get an agent to know a valid squadId/agentId
    const agentsRes = await request.get(`${engineUrl}/agents`);
    const agentsData = await agentsRes.json();

    if (agentsData.agents.length > 0) {
      const agent = agentsData.agents[0];
      const detailRes = await request.get(`${engineUrl}/agents/${agent.squad}/${agent.id}`);
      expect(detailRes.status()).toBe(200);

      const detail = await detailRes.json();
      expect(detail.agent).toBeTruthy();
      expect(detail.agent.id).toBe(agent.id);
      expect(detail.agent.content).toBeTruthy();
    }
  });
});
