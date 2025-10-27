const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const draftsDir = "site/essays/drafts";
if (!fs.existsSync(draftsDir)) process.exit(0);

const counts = new Map();
for (const f of fs.readdirSync(draftsDir)) {
  if (!f.endsWith(".md")) continue;
  const fp = path.join(draftsDir, f);
  const raw = fs.readFileSync(fp, "utf8");
  const doc = matter(raw);
  const d = doc.data || {};
  if ((d.status || "draft") !== "draft") continue;
  const author = (d.author || "").trim();
  if (!author) continue;
  counts.set(author, (counts.get(author) || 0) + 1);
}

const offenders = Array.from(counts.entries()).filter(([, n]) => n > 1);
if (offenders.length) {
  console.error("One-active-draft-per-author check failed:");
  for (const [author, n] of offenders) {
    console.error(` - @${author}: ${n} active drafts`);
  }
  process.exit(1);
} else {
  console.log("Active draft check OK");
}

