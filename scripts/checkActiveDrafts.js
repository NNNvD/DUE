const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { registerErrorHandlers } = require("./lib/registerErrorHandlers");

const draftsDir = "site/essays/drafts";

function findOffenders(drafts) {
  const counts = new Map();
  for (const draft of drafts) {
    const status = (draft.status || "draft").trim();
    if (status !== "draft") continue;
    const author = (draft.author || "").trim();
    if (!author) continue;
    counts.set(author, (counts.get(author) || 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, n]) => n > 1)
    .map(([author, count]) => ({ author, count }));
}

function loadDrafts(dir = draftsDir, fsModule = fs) {
  if (!fsModule.existsSync(dir)) return [];
  const drafts = [];
  for (const f of fsModule.readdirSync(dir)) {
    if (!f.endsWith(".md")) continue;
    const fp = path.join(dir, f);
    const raw = fsModule.readFileSync(fp, "utf8");
    const doc = matter(raw);
    drafts.push(doc.data || {});
  }
  return drafts;
}

function run(dir = draftsDir, fsModule = fs) {
  const drafts = loadDrafts(dir, fsModule);
  const offenders = findOffenders(drafts);
  if (offenders.length) {
    console.error("One-active-draft-per-author check failed:");
    for (const offender of offenders) {
      console.error(` - @${offender.author}: ${offender.count} active drafts`);
    }
    return 1;
  }
  console.log("Active draft check OK");
  return 0;
}

if (require.main === module) {
  registerErrorHandlers("checkActiveDrafts");
  process.exit(run());
}

module.exports = { findOffenders, loadDrafts, run };

