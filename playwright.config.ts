import { defineConfig, devices } from '@playwright/test';

const PORTA = 8150;

/**
 * Testes de ponta a ponta da versão web exportada (pasta `dist`). Rode `npm run test:e2e`, que
 * exporta a web antes. O Supabase é simulado em `e2e/base.ts`: os testes não dependem da rede.
 */
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Sem novas tentativas: um teste instável é um erro a corrigir, não a esconder.
  retries: 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORTA}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'celular',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: 'node e2e/servidor.mjs',
    url: `http://localhost:${PORTA}`,
    env: { E2E_PORTA: String(PORTA) },
    reuseExistingServer: !process.env.CI,
  },
});
