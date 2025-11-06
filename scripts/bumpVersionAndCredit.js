
const fs = require("fs");
const matter = require("gray-matter");
const { writeSnapshot } = require("./lib/snapshot");
const { normalizeCoauthors, normalizeAcknowledgments } = require("./lib/creditUtils");

function parseEnv(env = process.env) {
  const labels = (env.PR_LABELS ? JSON.parse(env.PR_LABELS) : []).map(l => l.name);
  const user = env.PR_USER || "contributor";
  const intent = labels.includes("major") ? "major" : (labels.includes("minor") ? "minor" : null);
  const changed = (env.CHANGED_FILES || "")
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean)
    .filter(fp => fp.startsWith("site/essays/published/") && fp.endsWith(".md"));

  return { labels, user, intent, changed };
}

function bump(v, isMajor) {
  v = String(v);
  if (!/^\d+\.\d+$/.test(v)) v = "0.1";
  let [maj, pat] = v.split(".").map(Number);
  if (isMajor) {
    return `${maj + 1}.0`;
  }
  return `${maj}.${(pat || 0) + 1}`;
}

function applyContribution(data = {}, { intent, user }) {
  if (!intent) {
    throw new Error("Intent is required to apply contribution");
  }
function parseVersion(v) {
  if (v === undefined || v === null) return null;
  const parts = String(v).split(".");
  if (parts.length !== 2) return null;
  const [maj, pat] = parts.map(Number);
  if (Number.isNaN(maj) || Number.isNaN(pat)) return null;
  return { maj, pat };
}

function compareVersions(a, b) {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  if (!pa && !pb) return 0;
  if (!pa) return 1;
  if (!pb) return -1;
  if (pa.maj !== pb.maj) return pa.maj - pb.maj;
  return pa.pat - pb.pat;
}

function normalizeCoauthors(list) {
  const seen = new Map();
  for (const entry of list || []) {
    if (!entry) continue;
    if (typeof entry === "string") {
      if (!seen.has(entry)) {
        seen.set(entry, { user: entry });
      }
      continue;
    }
    if (typeof entry === "object") {
      const user = entry.user || entry.handle || entry.github;
      if (!user) continue;
      const existing = seen.get(user) || { user };
      if (entry.since_version && !existing.since_version) {
        existing.since_version = String(entry.since_version);
      }
      seen.set(user, existing);
    }
  }
  return Array.from(seen.values());
}

for (const fp of changed) {
  const raw = fs.readFileSync(fp, "utf8");
  const doc = matter(raw);
  const d = doc.data;

  const isMajor = intent === "major";
  const version = bump(data.version, isMajor);
  const note = `Contribution by @${user} (${intent}).`;

  const updated = {
    ...data,
    version,
    release_notes: [note, ...(Array.isArray(data.release_notes) ? data.release_notes : [])]
  };

  if (isMajor) {
    const existing = Array.isArray(data.coauthors) ? data.coauthors : [];
    updated.coauthors = Array.from(new Set([...existing, user]));
  } else {
    const acknowledgments = Array.isArray(data.acknowledgments) ? [...data.acknowledgments] : [];
    acknowledgments.push({ user, note: "Minor contribution", since_version: version });
    updated.acknowledgments = acknowledgments;
  if (intent === "major") {
    const normalized = normalizeCoauthors(d.coauthors);
    const existing = normalized.find(c => c.user === user);
    const acknowledgments = Array.isArray(d.acknowledgments) ? d.acknowledgments : [];
    const matchingAcks = acknowledgments.filter(ack => ack && ack.user === user);
    const ackVersions = matchingAcks
      .map(ack => ack.since_version)
      .filter(Boolean)
      .map(String)
      .sort(compareVersions);
    const sinceVersion = existing?.since_version || ackVersions[0] || newVersion;
    if (existing) {
      existing.since_version = existing.since_version || sinceVersion;
    } else {
      normalized.push({ user, since_version: sinceVersion });
    }
    d.coauthors = normalized;
    if (matchingAcks.length) {
      d.acknowledgments = acknowledgments.filter(ack => ack && ack.user !== user);
    }
  } else {
    const ack = { user, note: "Minor contribution", since_version: newVersion };
    d.acknowledgments = normalizeAcknowledgments([...(d.acknowledgments || []), ack]);
  }

  // Always normalize in case existing data already contained duplicates.
  const normalizedCoauthors = normalizeCoauthors(d.coauthors || []);
  if (normalizedCoauthors.length > 0) {
    d.coauthors = normalizedCoauthors;
  } else {
    delete d.coauthors;
  }

  const normalizedAcknowledgments = normalizeAcknowledgments(d.acknowledgments || []);
  if (normalizedAcknowledgments.length > 0) {
    d.acknowledgments = normalizedAcknowledgments;
  } else {
    delete d.acknowledgments;
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
  } catch (e) {
    console.warn("Snapshot failed:", e.message);
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
  bump,
  applyContribution,
  parseEnv,
  processFile,
  run
};
