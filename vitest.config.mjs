import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Limit discovery to ESM tests to avoid Vitest being required from a CJS context.
    include: ["scripts/**/*.test.mjs"],
    environment: "node"
  }
});
