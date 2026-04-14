const fg = require("fast-glob");
const matter = require("gray-matter");
const { isEssayHidden } = require("../../scripts/lib/essayVisibility");

function countEssays(pattern) {
  return fg
    .sync(pattern, { dot: false })
    .filter((file) => {
      const { data } = matter.read(file);
      return !isEssayHidden(data);
    })
    .length;
}

module.exports = () => {
  const drafts = countEssays("site/essays/drafts/**/*.md");
  const published = countEssays("site/essays/published/**/*.md");

  return {
    drafts,
    published,
  };
};
