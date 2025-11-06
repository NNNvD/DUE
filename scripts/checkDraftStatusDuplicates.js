const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const draftsDir = path.join(__dirname, "..", "site", "essays", "drafts");

if (!fs.existsSync(draftsDir)) {
  console.log("No drafts directory found; skipping duplicate draft status check.");
  process.exit(0);
}

const draftEntriesByAuthor = new Map();

for (const entry of fs.readdirSync(draftsDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
  const filePath = path.join(draftsDir, entry.name);
  const raw = fs.readFileSync(filePath, "utf8");
  const document = matter(raw);
  const data = document.data || {};
  const status = (data.status || "draft").trim().toLowerCase();
  if (status !== "draft") continue;
  const author = (data.author || "").trim();
  if (!author) continue;

  const records = draftEntriesByAuthor.get(author) || [];
  records.push(path.relative(path.join(__dirname, ".."), filePath));
  draftEntriesByAuthor.set(author, records);
}

const duplicates = Array.from(draftEntriesByAuthor.entries()).filter(
  ([, files]) => files.length > 1
);

if (duplicates.length) {
  console.error("Multiple draft entries found for the same author:");
  for (const [author, files] of duplicates) {
    console.error(`- @${author} has ${files.length} drafts:`);
    for (const file of files) {
      console.error(`  • ${file}`);
    }
  }
  process.exit(1);
}

console.log("Draft author status check passed");
