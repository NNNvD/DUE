const fs = require("fs-extra");
const path = require("path");
const matter = require("gray-matter");
const { normalizeVersion } = require("./version");

function slugOf(fp) {
  return path.basename(fp, path.extname(fp));
}

function writeSnapshot(fromFilePath, frontMatter, content) {
  const slug = slugOf(fromFilePath);
  const version = normalizeVersion(frontMatter.version, frontMatter.initial_status);
  const dir = path.join("site/essays/snapshots", slug);
  const dest = path.join(dir, `v${version}.md`);

  const data = {
    ...frontMatter,
    layout: "snapshot.njk",
    origin_slug: slug,
    permalink: `/essays/published/${slug}/v${version}/`,
  };
  fs.ensureDirSync(dir);
  const out = matter.stringify(content, data);
  fs.writeFileSync(dest, out, "utf8");
  return dest;
}

module.exports = { writeSnapshot };
