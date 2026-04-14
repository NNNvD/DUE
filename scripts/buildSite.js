const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const outputDir = path.join(process.cwd(), "_site");

fs.rmSync(outputDir, { recursive: true, force: true });

const eleventyCli = path.join(process.cwd(), "node_modules", "@11ty", "eleventy", "cmd.cjs");
const result = spawnSync(process.execPath, [eleventyCli], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 0);
