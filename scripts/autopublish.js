const fs = require("fs-extra");
const path = require("path");
const matter = require("gray-matter");
const dayjs = require("dayjs");
const fg = require("fast-glob");

const utc = require("dayjs/plugin/utc");

dayjs.extend(utc);

const draftsDir = "site/essays/drafts";
const pubDir = "site/essays/published";

function getDeadlineDate(data) {
  const value = data.deadline_at;
  if (!value) return null;

  if (value instanceof Date) {
    const parsed = dayjs.utc(value);
    return parsed.isValid() ? parsed : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const isIsoWithTime = value.includes("T");
  if (isIsoWithTime) {
    const parsed = dayjs.utc(value);
    return parsed.isValid() ? parsed : null;
  }

  const rawTime = data.deadline_at_time;
  const defaultTime = "00:00:00";
  if (!rawTime) {
    const parsed = dayjs.utc(`${value}T${defaultTime}Z`);
    return parsed.isValid() ? parsed : null;
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
  const parsed = dayjs.utc(`${value}T${hhmm}${seconds}${zone}`);
  return parsed.isValid() ? parsed : null;
}

function getStartDate(data) {
  const value = data.started_at || data.proposed_at;
  if (!value) return null;
  const parsed = dayjs.utc(value);
  return parsed.isValid() ? parsed : null;
}

function resolveDeadline(data) {
  const explicitDeadline = getDeadlineDate(data);
  if (explicitDeadline) return explicitDeadline;

  const started = getStartDate(data);
  if (!started) return null;

  return started.add(30, "day");
}

function publishFile(fp, now, options = {}) {
  const { quiet = false } = options;
  const raw = fs.readFileSync(fp, "utf8");
  const doc = matter(raw);
  const d = doc.data;
  const slug = path.basename(fp, path.extname(fp));

  d.status = "published";
  d.version = d.initial_status === "complete" ? "1.0.0" : "0.1.0";
  d.published_at = now.format("YYYY-MM-DD");
  d.release_notes = Array.isArray(d.release_notes) ? d.release_notes : [];
  d.release_notes.unshift(`Auto-published at deadline (${now.toISOString()}).`);
  d.permalink = `/essays/published/${slug}/`;

  const out = matter.stringify(doc.content, d);
  const dest = path.join(pubDir, path.basename(fp));
  if (fs.existsSync(dest)) {
    throw new Error(`Refusing to overwrite existing published essay: ${dest}`);
  }
  fs.ensureDirSync(pubDir);
  fs.writeFileSync(dest, out, "utf8");
  fs.removeSync(fp);

  if (!quiet) {
    console.log(`Published overdue draft: ${slug}`);
  }

  return { slug, source: fp, dest };
}

function readAutopublishManifest() {
  return { published: [], generated_at: null };
}

function runAutopublish(options = {}) {
  const { quiet = false, referenceTime } = options;
  const now = referenceTime ? dayjs.utc(referenceTime) : dayjs.utc();

  const draftFiles = fg.sync(`${draftsDir}/**/*.md`, { dot: false });

  return draftFiles.reduce((list, fp) => {
    const raw = fs.readFileSync(fp, "utf8");
    const doc = matter(raw);
    const status = String(doc.data?.status || "draft").trim().toLowerCase();
    if (!["proposed", "draft"].includes(status)) {
      return list;
    }
    const deadline = resolveDeadline(doc.data);
    if (!deadline) return list;

    if (!now.isBefore(deadline)) {
      const result = publishFile(fp, now, { quiet, deadline });
      list.push(result);
    }

    return list;
  }, []);
}

if (require.main === module) {
  runAutopublish();
}

module.exports = {
  getDeadlineDate,
  getStartDate,
  resolveDeadline,
  runAutopublish,
  readAutopublishManifest
};
