import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
    testDir: './e2e',
    testMatch: '**/*.spec.ts',
    fullyParallel: true,
    reporter: 'line',
    use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://127.0.0.1:4176',
        trace: 'on-first-retry',
    },
    webServer: {
        command: 'bun --cwd playground dev --host 127.0.0.1 --port 4176',
        url: 'http://127.0.0.1:4176',
        reuseExistingServer: true,
        timeout: 120_000,
    },
})
