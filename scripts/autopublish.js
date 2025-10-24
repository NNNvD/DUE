
const fs = require("fs-extra");
const path = require("path");
const matter = require("gray-matter");
const dayjs = require("dayjs");
const glob = require("glob");

const draftsDir = "site/essays/drafts";
const pubDir = "site/essays/published";

function publishFile(fp) {
  const raw = fs.readFileSync(fp, "utf8");
  const doc = matter(raw);
  const d = doc.data;

  d.status = "published";
  d.version = d.initial_status === "complete" ? 1.0 : 0.1;
  d.published_at = dayjs().format("YYYY-MM-DD");
  d.release_notes = Array.isArray(d.release_notes) ? d.release_notes : [];
  d.release_notes.unshift(`Auto-published at deadline (${dayjs().toISOString()}).`);

  const out = matter.stringify(doc.content, d);
  const dest = path.join(pubDir, path.basename(fp));
  fs.ensureDirSync(pubDir);
  fs.writeFileSync(dest, out, "utf8");
  fs.removeSync(fp);
  console.log(`Published: ${path.basename(fp)} → v${d.version}`);
}

glob.sync(`${draftsDir}/**/*.md`).forEach(fp => {
  const raw = fs.readFileSync(fp, "utf8");
  const doc = matter(raw);
  const d = doc.data;
  if (!d.deadline_at) return;

  if (dayjs().isAfter(dayjs(d.deadline_at))) {
    publishFile(fp);
  }
});
