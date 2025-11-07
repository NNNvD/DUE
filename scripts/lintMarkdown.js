#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const IGNORED_DIRECTORIES = new Set([
  ".git",
  "node_modules",
  "_site",
  "dist"
]);

function isMarkdown(filePath) {
  return filePath.toLowerCase().endsWith(".md");
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (IGNORED_DIRECTORIES.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile() && isMarkdown(fullPath)) {
      files.push(fullPath);
    }
  }
  return files;
}

function lintFile(filePath) {
  const problems = [];
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (/\s$/.test(line) && !/  $/.test(line)) {
      problems.push(`${filePath}:${lineNumber} Trailing whitespace detected.`);
    }
    if (/\t/.test(line)) {
      problems.push(`${filePath}:${lineNumber} Tab character found; use spaces.`);
    }
  });

  if (!content.endsWith("\n")) {
    problems.push(`${filePath}: File must end with a newline.`);
  }

  return problems;
}

function main() {
  const root = path.resolve(__dirname, "..");
  const markdownFiles = walk(root);
  const allProblems = markdownFiles.flatMap(lintFile);

  if (allProblems.length) {
    console.error("Markdown lint failed:\n" + allProblems.join("\n"));
    process.exit(1);
  }

  console.log("Markdown lint passed.");
}

main();
