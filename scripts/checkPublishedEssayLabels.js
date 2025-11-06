#!/usr/bin/env node

const labelsInput = process.env.PR_LABELS || "[]";
const changedInput = process.env.CHANGED_FILES || "";

let labels;
try {
  labels = JSON.parse(labelsInput);
} catch (error) {
  console.error("Failed to parse PR_LABELS as JSON:", error.message);
  process.exit(1);
}

const labelNames = labels
  .map(label => (typeof label === "string" ? label : label && label.name) || "")
  .map(name => name.toLowerCase());

const changedFiles = changedInput
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(Boolean);

const touchesPublishedEssay = changedFiles.some(filename =>
  filename.startsWith("site/essays/published/") && filename.endsWith(".md")
);

if (!touchesPublishedEssay) {
  console.log("No published essays modified; skipping label check.");
  process.exit(0);
}

const hasRequiredLabel = labelNames.includes("minor") || labelNames.includes("major");

if (!hasRequiredLabel) {
  console.error('PR modifies published essays but lacks required label: "minor" or "major".');
  process.exit(1);
}

console.log("Published essays modified and required label present.");
