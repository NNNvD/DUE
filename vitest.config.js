const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    include: ["scripts/**/*.test.{js,mjs}"],
    environment: "node"
  }
});
