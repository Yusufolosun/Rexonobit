/// <reference types="vitest" />
import { defineConfig } from "vite";
import { vitestSetupFilePath } from "@stacks/clarinet-sdk/vitest";

export default defineConfig({
  test: {
    environment: "clarinet",
    environmentOptions: {
      clarinet: {
        manifestPath: "./Clarinet.toml",
        coverageFilename: "lcov.info",
        costsFilename: "costs-reports.json",
        coverage: false,
        costs: false,
        initBeforeEach: true,
      },
    },
    setupFiles: [vitestSetupFilePath],
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
    include: ["tests/*.test.ts"],
    testTimeout: 60000,
  },
});
