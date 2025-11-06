
const fs = require("fs");
const matter = require("gray-matter");
const { writeSnapshot } = require("./lib/snapshot");

const labels = (process.env.PR_LABELS ? JSON.parse(process.env.PR_LABELS) : []).map(l => l.name);
const user = process.env.PR_USER || "contributor";
const intent = labels.includes("major") ? "major" : (labels.includes("minor") ? "minor" : null);

const changed = (process.env.CHANGED_FILES || "")
  .split(/\r?\n/).map(s => s.trim()).filter(Boolean)
  .filter(fp => fp.startsWith("site/essays/published/") && fp.endsWith(".md"));

if (!intent || changed.length === 0) {
  console.log("No intent label or no changed published essays; exiting.");
  process.exit(0);
}

function bump(v, isMajor) {
  v = String(v);
  if (!/^\d+\.\d+$/.test(v)) v = "0.1";
  let [maj, pat] = v.split(".").map(Number);
  if (isMajor) {
    return `${maj + 1}.0`;
  } else {
    return `${maj}.${(pat || 0) + 1}`;
  }
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

  const newVersion = bump(d.version, intent === "major");
  const note = `Contribution by @${user} (${intent}).`;

  d.version = newVersion;
  d.release_notes = [note, ...(d.release_notes || [])];

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
    d.acknowledgments = [...(d.acknowledgments || []), ack];
  }

  const out = matter.stringify(doc.content, d);
  fs.writeFileSync(fp, out, "utf8");
  console.log(`Updated ${fp} → version ${newVersion}`);

  try {
    const snap = writeSnapshot(fp, d, doc.content);
    console.log(`Snapshot written: ${snap}`);
  } catch (e) {
    console.warn("Snapshot failed:", e.message);
  }
}
