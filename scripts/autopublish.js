
const fs = require("fs-extra");
const path = require("path");
const matter = require("gray-matter");
const dayjs = require("dayjs");
const glob = require("glob");

const utc = require("dayjs/plugin/utc");

dayjs.extend(utc);

const draftsDir = "site/essays/drafts";
const pubDir = "site/essays/published";
const { writeSnapshot } = require("./lib/snapshot");

function getDeadlineDate(data) {
  const value = data.deadline_at;
  if (!value) return null;

  const isIsoWithTime = typeof value === "string" && value.includes("T");
  if (isIsoWithTime) {
    const parsed = dayjs.utc(value);
    return parsed.isValid() ? parsed : null;
  }

  const rawTime = data.deadline_at_time;
  const defaultTime = "00:00:00";
  if (!rawTime) {
    return dayjs.utc(`${value}T${defaultTime}Z`);
  }

  const time = String(rawTime).trim();
  const timeMatch = time.match(/^(\d{2}:\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:?\d{2})?$/);
  if (!timeMatch) {
    console.warn(
      `Invalid deadline_at_time "${time}" for ${data.title || "untitled draft"}; falling back to midnight UTC.`
    );
    return dayjs.utc(`${value}T${defaultTime}Z`);
  }

  const hhmm = timeMatch[1];
  const seconds = timeMatch[2] ? `:${timeMatch[2]}` : ":00";
  const zone = timeMatch[3] || "Z";
  return dayjs.utc(`${value}T${hhmm}${seconds}${zone}`);
}

function publishFile(fp) {
  const raw = fs.readFileSync(fp, "utf8");
  const doc = matter(raw);
  const d = doc.data;

  const now = dayjs.utc();
  d.status = "published";
  d.version = d.initial_status === "complete" ? 1.0 : 0.1;
  d.published_at = now.format("YYYY-MM-DD");
  d.release_notes = Array.isArray(d.release_notes) ? d.release_notes : [];
  d.release_notes.unshift(`Auto-published at deadline (${now.toISOString()}).`);

  const out = matter.stringify(doc.content, d);
  const dest = path.join(pubDir, path.basename(fp));
  fs.ensureDirSync(pubDir);
  fs.writeFileSync(dest, out, "utf8");
  fs.removeSync(fp);
  console.log(`Published: ${path.basename(fp)} → v${d.version}`);

  try {
    const snap = writeSnapshot(dest, d, doc.content);
    console.log(`Snapshot written: ${snap}`);
  } catch (e) {
    console.warn("Snapshot failed:", e.message);
  }
}

glob.sync(`${draftsDir}/**/*.md`).forEach(fp => {
  const raw = fs.readFileSync(fp, "utf8");
  const doc = matter(raw);
  const d = doc.data;
  const deadline = getDeadlineDate(d);
  if (!deadline) return;

  if (dayjs.utc().isAfter(deadline)) {
    publishFile(fp);
  }
});
