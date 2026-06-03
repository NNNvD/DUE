const meta = require("./_data/meta");

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

module.exports = class Sitemap {
  data() {
    return {
      permalink: "sitemap.xml",
      eleventyExcludeFromCollections: true,
    };
  }

  render(data) {
    const pages = data.collections?.all || [];
    const seen = new Set();
    const entries = [];

    for (const page of pages) {
      if (!page || !page.url) {
        continue;
      }

      if (page.data && page.data.excludeFromSitemap) {
        continue;
      }

      const loc = meta.buildCanonicalUrl({
        page,
        site: data.site,
        canonical: page.data?.canonical,
        canonical_url: page.data?.canonical_url,
      });
      if (!loc || seen.has(loc)) {
        continue;
      }

      seen.add(loc);

      const lastModified = page.data?.updated_at || page.data?.published_at || page.date;
      let lastmod = null;
      if (lastModified) {
        const date = new Date(lastModified);
        if (!Number.isNaN(date.getTime())) {
          lastmod = date.toISOString();
        }
      }

      entries.push({
        loc,
        lastmod,
      });
    }

    entries.sort((a, b) => a.loc.localeCompare(b.loc));

    const lines = [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ];

    for (const entry of entries) {
      lines.push("  <url>");
      lines.push(`    <loc>${xmlEscape(entry.loc)}</loc>`);
      if (entry.lastmod) {
        lines.push(`    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>`);
      }
      lines.push("  </url>");
    }

    lines.push("</urlset>");
    lines.push("");

    return lines.join("\n");
  }
};
