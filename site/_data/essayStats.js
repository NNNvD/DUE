const fg = require("fast-glob");

function countEssays(pattern) {
  return fg.sync(pattern, { dot: false }).length;
}

module.exports = () => {
  const drafts = countEssays("site/essays/drafts/**/*.md");
  const published = countEssays("site/essays/published/**/*.md");

  return {
    drafts,
    published,
  };
};
