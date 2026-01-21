const fs = require("fs");
const matter = require("gray-matter");
const { writeSnapshot } = require("./lib/snapshot");
const { bumpVersion } = require("./lib/version");
const { normalizeCoauthors, normalizeAcknowledgments } = require("./lib/creditUtils");

function parseEnv(env = process.env) {
  const labels = (env.PR_LABELS ? JSON.parse(env.PR_LABELS) : []).map(label => label.name);
  const user = env.PR_USER || "contributor";
  const intent = labels.includes("major")
    ? "major"
    : (labels.includes("minor") ? "minor" : null);
  const changed = (env.CHANGED_FILES || "")
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(fp => fp.startsWith("site/essays/published/") && fp.endsWith(".md"));

  return { labels, user, intent, changed };
}

function applyContribution(data = {}, { intent, user }) {
  if (!intent) {
    throw new Error("Intent is required to apply contribution");
  }

  const isMajor = intent === "major";
  const version = bumpVersion(data.version, intent);
  const note = `Contribution by @${user} (${intent}).`;
  const baseReleaseNotes = Array.isArray(data.release_notes) ? data.release_notes : [];

  const updated = {
    ...data,
    version,
    release_notes: [note, ...baseReleaseNotes]
  };

  if (isMajor) {
    const normalizedCoauthors = normalizeCoauthors(data.coauthors);
    if (!normalizedCoauthors.includes(user)) {
      normalizedCoauthors.push(user);
    }
    updated.coauthors = normalizedCoauthors;

    if (Array.isArray(data.acknowledgments)) {
      const remaining = data.acknowledgments.filter(entry => entry && entry.user !== user);
      if (remaining.length > 0) {
        updated.acknowledgments = normalizeAcknowledgments(remaining);
      } else {
        delete updated.acknowledgments;
      }
    } else {
      delete updated.acknowledgments;
    }
  } else {
    const acknowledgments = normalizeAcknowledgments([
      ...(Array.isArray(data.acknowledgments) ? data.acknowledgments : []),
      { user, note: "Minor contribution", since_version: version }
    ]);
    updated.acknowledgments = acknowledgments;
  }

  return { data: updated, note, version };
}

function processFile(fp, intent, user, fsModule = fs) {
  const raw = fsModule.readFileSync(fp, "utf8");
  const doc = matter(raw);
  const { data: updated } = applyContribution(doc.data, { intent, user });
  const out = matter.stringify(doc.content, updated);
  fsModule.writeFileSync(fp, out, "utf8");
  console.log(`Updated ${fp} → version ${updated.version}`);

  try {
    const snap = writeSnapshot(fp, updated, doc.content);
    console.log(`Snapshot written: ${snap}`);
  } catch (error) {
    console.warn("Snapshot failed:", error.message);
  }
}

function run(env = process.env, fsModule = fs) {
  const { intent, changed, user } = parseEnv(env);
  if (!intent || changed.length === 0) {
    console.log("No intent label or no changed published essays; exiting.");
    return 0;
  }

  for (const fp of changed) {
    processFile(fp, intent, user, fsModule);
  }

  return 0;
}

if (require.main === module) {
  process.exit(run());
}

module.exports = {
  applyContribution,
  parseEnv,
  processFile,
  run
};
