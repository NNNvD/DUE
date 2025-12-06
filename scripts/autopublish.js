
const fs = require("fs-extra");
const path = require("path");
const matter = require("gray-matter");
const dayjs = require("dayjs");
const fg = require("fast-glob");

const utc = require("dayjs/plugin/utc");

dayjs.extend(utc);

const draftsDir = "site/essays/drafts";
const autopublishRoot = "site/autopublished";
const pubDir = path.join(autopublishRoot, "published");
const manifestPath = path.join(autopublishRoot, "manifest.json");

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

function publishFile(fp, now, options = {}) {
  const { quiet = false } = options;
  const raw = fs.readFileSync(fp, "utf8");
  const doc = matter(raw);
  const d = doc.data;
  const slug = path.basename(fp, path.extname(fp));

  d.status = "published";
  d.version = d.initial_status === "complete" ? 1.0 : 0.1;
  d.published_at = now.format("YYYY-MM-DD");
  d.release_notes = Array.isArray(d.release_notes) ? d.release_notes : [];
  d.release_notes.unshift(`Auto-published at deadline (${now.toISOString()}).`);
  d.permalink = d.permalink || `/essays/published/${slug}/`;

  const out = matter.stringify(doc.content, d);
  const dest = path.join(pubDir, path.basename(fp));
  fs.ensureDirSync(pubDir);
  fs.writeFileSync(dest, out, "utf8");
  if (!quiet) {
    console.log(`Prepared publication: ${slug} → v${d.version}`);
  }

  return { slug, source: fp, dest };
}

function readAutopublishManifest() {
  if (!fs.existsSync(manifestPath)) return { published: [], generated_at: null };
  try {
    return fs.readJsonSync(manifestPath);
  } catch (err) {
    console.warn("Unable to read autopublish manifest:", err.message);
    return { published: [], generated_at: null };
  }
}

function writeManifest(now, published) {
  const manifest = {
    generated_at: now.toISOString(),
    published: published.map(({ slug, source, dest }) => ({ slug, source, dest })),
  };

  fs.ensureDirSync(autopublishRoot);
  fs.writeJsonSync(manifestPath, manifest, { spaces: 2 });

  return manifest;
}

function runAutopublish(options = {}) {
  const { quiet = false, referenceTime } = options;
  const now = referenceTime ? dayjs.utc(referenceTime) : dayjs.utc();
  fs.removeSync(autopublishRoot);

  const draftFiles = fg.sync(`${draftsDir}/**/*.md`, { dot: false });

  const published = draftFiles.reduce((list, fp) => {
    const raw = fs.readFileSync(fp, "utf8");
    const doc = matter(raw);
    const d = doc.data;
    const deadline = getDeadlineDate(d);
    if (!deadline) return list;

    if (!now.isBefore(deadline)) {
      const result = publishFile(fp, now, { quiet });
      list.push(result);
    }

    return list;
  }, []);

  return writeManifest(now, published);
}

if (require.main === module) {
  runAutopublish();
}

module.exports = { runAutopublish, readAutopublishManifest };
