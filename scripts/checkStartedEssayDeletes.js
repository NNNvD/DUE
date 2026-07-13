const { execFileSync } = require("child_process");
const matter = require("gray-matter");

const ESSAY_PATH = /^site\/essays\/(?:drafts|published)\/.+\.md$/u;
const ALLOW_DELETES = process.env.ALLOW_STARTED_ESSAY_DELETES === "true";

function git(args, options = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", options.quiet ? "ignore" : "pipe"],
  }).trim();
}

function resolveBaseRef() {
  const candidates = [
    process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : "",
    process.env.DEFAULT_BRANCH ? `origin/${process.env.DEFAULT_BRANCH}` : "",
    "origin/main",
    "HEAD~1",
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      git(["rev-parse", "--verify", candidate], { quiet: true });
      return candidate;
    } catch (error) {
      // Try the next available base.
    }
  }

  return "";
}

function deletedEssayPaths(baseRef) {
  if (!baseRef) return [];
  const diff = git(["diff", "--name-status", "--diff-filter=D", `${baseRef}...HEAD`], { quiet: true });
  if (!diff) return [];

  return diff
    .split(/\r?\n/u)
    .map((line) => line.split(/\s+/u))
    .filter(([status, filePath]) => status === "D" && ESSAY_PATH.test(filePath || ""))
    .map(([, filePath]) => filePath);
}

function readDeletedFile(baseRef, filePath) {
  return git(["show", `${baseRef}:${filePath}`], { quiet: true });
}

function hasStarted(raw) {
  const parsed = matter(raw);
  return Boolean(parsed.data && parsed.data.started_at);
}

function main() {
  if (ALLOW_DELETES) {
    console.log("Started essay deletion guard bypassed by ALLOW_STARTED_ESSAY_DELETES=true.");
    return;
  }

  const baseRef = resolveBaseRef();
  const deletedPaths = deletedEssayPaths(baseRef);
  const startedDeletes = deletedPaths.filter((filePath) => hasStarted(readDeletedFile(baseRef, filePath)));

  if (!startedDeletes.length) {
    console.log("No started essay deletions found.");
    return;
  }

  console.error("Started essays must not be deleted in ordinary PRs.");
  console.error("Use visibility metadata or an explicit maintainer-approved removal process instead.");
  startedDeletes.forEach((filePath) => console.error(`- ${filePath}`));
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = {
  deletedEssayPaths,
  hasStarted,
  resolveBaseRef,
};
