#!/usr/bin/env node

const fs = require("fs");
const fg = require("fast-glob");
const matter = require("gray-matter");
const { resolveDeadline } = require("./autopublish");
const { registerErrorHandlers } = require("./lib/registerErrorHandlers");

function isDraftStatus(status) {
  return ["proposed", "draft"].includes(String(status || "draft").trim().toLowerCase());
}

function findOverdueDrafts({ files, now = new Date(), fsModule = fs } = {}) {
  const draftFiles = files || fg.sync("site/essays/drafts/**/*.md", { dot: false });
  const nowTime = now instanceof Date ? now.getTime() : new Date(now).getTime();

  return draftFiles
    .map((file) => {
      const raw = fsModule.readFileSync(file, "utf8");
      const doc = matter(raw);
      if (!isDraftStatus(doc.data.status)) return null;

      const deadline = resolveDeadline(doc.data);
      if (!deadline) return null;

      const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline);
      if (Number.isNaN(deadlineDate.getTime())) return null;
      if (deadlineDate.getTime() > nowTime) return null;

      return {
        file,
        title: doc.data.title || file,
        deadline: deadlineDate.toISOString(),
      };
    })
    .filter(Boolean);
}

function run(options = {}) {
  const overdue = findOverdueDrafts(options);
  if (!overdue.length) {
    console.log("No overdue drafts found.");
    return 0;
  }

  console.error("Overdue draft check failed:");
  overdue.forEach((draft) => {
    console.error(` - ${draft.file}: "${draft.title}" passed deadline ${draft.deadline}`);
  });
  console.error("\nRun `npm run autopublish` or move overdue drafts to published before deploying.");
  return 1;
}

if (require.main === module) {
  registerErrorHandlers("checkOverdueDrafts");
  process.exit(run());
}

module.exports = {
  findOverdueDrafts,
  run,
};
