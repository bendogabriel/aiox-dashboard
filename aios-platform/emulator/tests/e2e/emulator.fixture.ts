// ── Playwright Fixture: Emulator ──
// The engine is started by playwright.config.ts webServer (bun scripts/e2e-server.ts).
// This fixture only provides typed helpers — no Bun imports needed.

import { test as base, expect } from '@playwright/test';

const ENGINE_PORT = Number(process.env.ENGINE_PORT) || 4095;

export type EmulatorFixture = {
  engineUrl: string;
};

export const test = base.extend<EmulatorFixture>({
  /* eslint-disable no-empty-pattern, react-hooks/rules-of-hooks */
  engineUrl: async ({}, use) => {
    await use(`http://localhost:${ENGINE_PORT}`);
  },
  /* eslint-enable no-empty-pattern, react-hooks/rules-of-hooks */
});

export { expect };
