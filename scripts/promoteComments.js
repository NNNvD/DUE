const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const fg = require("fast-glob");
const { registerErrorHandlers } = require("./lib/registerErrorHandlers");

const COMMENTS_ROOT = path.join(process.cwd(), "data", "comments");
const SKIP = process.env.COMMENTS_SKIP_PROMOTE === "1";

registerErrorHandlers("promoteComments");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function normalizeStatus(value) {
  const status = (value || "").toString().toLowerCase();
  if (status === "rejected") return "rejected";
  if (status === "implemented") return "implemented";
  return "approved";
}

function promotePending() {
  if (SKIP) return [];
  if (!fs.existsSync(COMMENTS_ROOT)) return [];

  const pendingFiles = fg.sync("**/pending/*.yml", {
    cwd: COMMENTS_ROOT,
    absolute: true,
    dot: false,
  });

  const promoted = [];

  pendingFiles.forEach((filePath) => {
    const raw = fs.readFileSync(filePath, "utf8");
    const data = yaml.load(raw) || {};
    const slug = data.essay || path.basename(path.dirname(path.dirname(filePath)));
    const approvedDir = path.join(path.dirname(path.dirname(filePath)), "approved");
    const targetPath = path.join(approvedDir, path.basename(filePath));

    const normalized = {
      ...data,
      essay: slug,
      status: normalizeStatus(data.status),
      moderated_at: data.moderated_at || new Date().toISOString(),
    };

    ensureDir(approvedDir);
    fs.writeFileSync(targetPath, yaml.dump(normalized, { lineWidth: 100 }));
    fs.rmSync(filePath);
    promoted.push(targetPath);
  });

  return promoted;
}

function main() {
  const promoted = promotePending();
  if (promoted.length) {
    console.log(`Promoted ${promoted.length} comment(s) from pending to approved.`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { promotePending };
