import { defineConfig } from "@playwright/test";

const realUrl = process.env.E2E_REAL_URL ?? "http://localhost:5173";
const mockUrl = "http://localhost:5174";

export default defineConfig({
  testDir: "e2e",
  timeout: 300_000,
  workers: 1,
  expect: { timeout: 15_000 },
  use: { actionTimeout: 15_000, trace: "retain-on-failure" },
  projects: [
    { name: "real", testMatch: "golden.spec.ts", use: { baseURL: realUrl } },
    { name: "mock", testMatch: ["golden.spec.ts", "smoke.spec.ts"], use: { baseURL: mockUrl } },
  ],
  webServer: {
    command: "npm run dev -- --port 5174 --strictPort",
    url: mockUrl,
    reuseExistingServer: false,
    env: { VITE_API_MODE: "mock" },
  },
});
