
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

for (const fp of changed) {
  const raw = fs.readFileSync(fp, "utf8");
  const doc = matter(raw);
  const d = doc.data;

  const newVersion = bump(d.version, intent === "major");
  const note = `Contribution by @${user} (${intent}).`;

  d.version = newVersion;
  d.release_notes = [note, ...(d.release_notes || [])];

  if (intent === "major") {
    d.coauthors = Array.from(new Set([...(d.coauthors || []), user]));
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
