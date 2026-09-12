const fs = require("fs-extra");
const path = require("path");
const fg = require("fast-glob");
const matter = require("gray-matter");
const { publishDraftNow } = require("./autopublish");
const { writeSnapshot } = require("./lib/snapshot");
const { bumpVersion, normalizeUpdateIntent } = require("./lib/version");

const DRAFTS_DIR = "site/essays/drafts";
const PUBLISHED_DIR = "site/essays/published";

function isTrue(value) {
  return value === true || String(value || "").trim().toLowerCase() === "true";
}

function defaultReleaseNote(intent) {
  if (intent === "new_version") return "New edition.";
  if (intent === "major_update") return "Substantive revision.";
  return "Small correction.";
}

function normalizeReleaseNote(note, intent) {
  const trimmed = typeof note === "string" ? note.trim() : "";
  return trimmed || defaultReleaseNote(intent);
}

function processPublishedFile(fp, options = {}) {
  const { now = new Date(), snapshot = true } = options;
  const raw = fs.readFileSync(fp, "utf8");
  const doc = matter(raw);
  const data = { ...doc.data };

  if (!isTrue(data.update_pending)) return null;

  const intent = normalizeUpdateIntent(data.update_intent);
  const version = bumpVersion(data.version, intent);
  const note = normalizeReleaseNote(data.update_note, intent);
  const releaseNotes = Array.isArray(data.release_notes) ? data.release_notes : [];

  const updated = {
    ...data,
    version,
    update_intent: "minor_update",
    release_notes: [note, ...releaseNotes],
    last_modified_at: now.toISOString().slice(0, 10),
  };
  delete updated.update_pending;
  delete updated.update_note;

  fs.writeFileSync(fp, matter.stringify(doc.content, updated), "utf8");

  let snapshotPath = null;
  if (snapshot) {
    snapshotPath = writeSnapshot(fp, updated, doc.content);
  }

  return { fp, version, note, snapshotPath };
}

function processDraftPublishRequests(options = {}) {
  const { referenceTime } = options;
  const files = fg.sync(`${DRAFTS_DIR}/**/*.md`, { dot: false });
  const published = [];

  for (const fp of files) {
    const doc = matter.read(fp);
    if (!isTrue(doc.data?.publish_now)) continue;

    const slug = path.basename(fp, path.extname(fp));
    published.push(publishDraftNow(slug, { quiet: true, referenceTime }));
  }

  return published;
}

function processPublishedUpdates(options = {}) {
  const files = fg.sync(`${PUBLISHED_DIR}/**/*.md`, { dot: false });
  return files
    .map((fp) => processPublishedFile(fp, options))
    .filter(Boolean);
}

function run(options = {}) {
  const published = processDraftPublishRequests(options);
  const updated = processPublishedUpdates(options);

  if (published.length) {
    console.log(`Published ${published.length} draft essay(s) requested by the CMS.`);
  }
  if (updated.length) {
    console.log(`Processed ${updated.length} published essay revision(s).`);
  }
  if (!published.length && !updated.length) {
    console.log("No pending CMS publication or revision actions.");
  }

  return { published, updated };
}

if (require.main === module) {
  run();
}

module.exports = {
  defaultReleaseNote,
  normalizeReleaseNote,
  processPublishedFile,
  processDraftPublishRequests,
  processPublishedUpdates,
  run,
};
