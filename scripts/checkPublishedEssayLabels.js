#!/usr/bin/env node

const labelsInput = process.env.PR_LABELS || "[]";
const changedInput = process.env.CHANGED_FILES || "";
const changedDetailsInput = process.env.CHANGED_FILE_DETAILS || "[]";

let labels;
try {
  labels = JSON.parse(labelsInput);
} catch (error) {
  console.error("Failed to parse PR_LABELS as JSON:", error.message);
  process.exit(1);
}

let changedDetails;
try {
  changedDetails = JSON.parse(changedDetailsInput);
  if (!Array.isArray(changedDetails)) {
    changedDetails = [];
  }
} catch (error) {
  console.error("Failed to parse CHANGED_FILE_DETAILS as JSON:", error.message);
  process.exit(1);
}

const labelNames = labels
  .map(label => (typeof label === "string" ? label : label && label.name) || "")
  .map(name => name.toLowerCase());

const changedFiles = changedInput
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(Boolean);

const patchByFile = new Map(
  changedDetails.map(entry => [entry.filename, typeof entry.patch === "string" ? entry.patch : ""])
);

function onlyWordRangeChanged(patch) {
  if (!patch) return false;

  const lines = patch
    .split("\n")
    .filter(line => {
      if (!line) return false;
      if (line.startsWith("+++")) return false;
      if (line.startsWith("---")) return false;
      if (line.startsWith("@@")) return false;
      return line.startsWith("+") || line.startsWith("-");
    });

  if (lines.length === 0) {
    return false;
  }

  return lines.every(line => line.slice(1).trim().startsWith("word_range:"));
}

const touchesPublishedEssay = changedFiles.some(filename =>
  filename.startsWith("site/essays/published/") && filename.endsWith(".md")
);

if (!touchesPublishedEssay) {
  console.log("No published essays modified; skipping label check.");
  process.exit(0);
}

const publishedFiles = changedFiles.filter(filename =>
  filename.startsWith("site/essays/published/") && filename.endsWith(".md")
);

const metadataOnly = publishedFiles.length > 0 && publishedFiles.every(filename => {
  const patch = patchByFile.get(filename);
  if (onlyWordRangeChanged(patch)) {
    console.log(`${filename}: only word_range metadata updated; skipping label requirement.`);
    return true;
  }
  return false;
});

if (metadataOnly) {
  console.log("Published essays modified only to correct word ranges.");
  process.exit(0);
}

const hasRequiredLabel = labelNames.includes("minor") || labelNames.includes("major");

if (!hasRequiredLabel) {
  console.error('PR modifies published essays but lacks required label: "minor" or "major".');
  process.exit(1);
}

console.log("Published essays modified and required label present.");
