
const fs = require("fs");
const matter = require("gray-matter");
const { writeSnapshot } = require("./lib/snapshot");

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
