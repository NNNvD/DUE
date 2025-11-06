const { URL } = require("node:url");

function escapeXml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIsoDate(value) {
  if (!value) {
    return new Date().toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

function absoluteUrl(siteUrl, path) {
  try {
    return new URL(path, siteUrl).toString();
  } catch (error) {
    return path;
  }
}

function buildEntryXml(item, siteUrl) {
  const url = absoluteUrl(siteUrl, item.url || "");
  const baseId = url.replace(/\/?$/, "");
  const version = item.data?.version ? String(item.data.version) : "1.0";
  const entryId = `${baseId}#v${version.replace(/[^a-zA-Z0-9_.-]/g, "-")}`;
  const publishedAt = item.data?.published_at || item.data?.updated_at || item.data?.started_at || item.date;
  const isoDate = toIsoDate(publishedAt);
  const releaseNotes = Array.isArray(item.data?.release_notes) ? item.data.release_notes : [];
  const summary = releaseNotes.length ? releaseNotes[0] : `Version ${version}`;
  const contentLines = releaseNotes.length
    ? releaseNotes.map((note, index) => `${index + 1}. ${note}`)
    : ["No release notes yet."];

  return [
    "  <entry>",
    `    <title>${escapeXml(`Version ${version}`)}</title>`,
    `    <id>${escapeXml(entryId)}</id>`,
    `    <link href="${escapeXml(url)}" />`,
    `    <updated>${escapeXml(isoDate)}</updated>`,
    `    <published>${escapeXml(isoDate)}</published>`,
    `    <summary>${escapeXml(summary)}</summary>`,
    `    <content type="text">${escapeXml(contentLines.join("\n"))}</content>`,
    "  </entry>",
  ].join("\n");
}

module.exports = class EssayFeed {
  data() {
    return {
      pagination: {
        data: "collections.publishedEssays",
        size: 1,
        alias: "essay",
      },
      permalink: (data) => `essays/published/${data.essay.fileSlug}/feed.xml`,
      eleventyExcludeFromCollections: true,
      layout: null,
    };
  }

  render(data) {
    const { essay, collections, site } = data;
    const siteUrl = site?.siteUrl || "https://example.com/";
    const slug = essay.fileSlug;
    const essayUrl = absoluteUrl(siteUrl, essay.url || `/essays/published/${slug}/`);
    const feedUrl = absoluteUrl(siteUrl, `essays/published/${slug}/feed.xml`);

    const snapshots = (collections?.snapshots || []).filter(
      (snap) => snap.data?.origin_slug === slug
    );

    const history = [essay, ...snapshots].sort((a, b) => {
      const dateA = new Date(a.data?.published_at || a.data?.updated_at || a.data?.started_at || a.date || 0);
      const dateB = new Date(b.data?.published_at || b.data?.updated_at || b.data?.started_at || b.date || 0);
      return dateB - dateA;
    });

    const feedUpdatedSource = history[0];
    const feedUpdated = feedUpdatedSource
      ? toIsoDate(
          feedUpdatedSource.data?.published_at ||
            feedUpdatedSource.data?.updated_at ||
            feedUpdatedSource.data?.started_at ||
            feedUpdatedSource.date
        )
      : new Date().toISOString();

    const entriesXml = history.map((item) => buildEntryXml(item, siteUrl)).join("\n");
    const authorName = essay.data?.author ? `@${essay.data.author}` : "Unknown";

    return [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<feed xmlns="http://www.w3.org/2005/Atom">',
      `  <title>${escapeXml(essay.data?.title || "Essay release feed")}</title>`,
      `  <id>${escapeXml(essayUrl)}</id>`,
      `  <link href="${escapeXml(feedUrl)}" rel="self" />`,
      `  <link href="${escapeXml(essayUrl)}" rel="alternate" />`,
      `  <updated>${escapeXml(feedUpdated)}</updated>`,
      "  <generator>Eleventy Essay Feed</generator>",
      "  <author>",
      `    <name>${escapeXml(authorName)}</name>`,
      "  </author>",
      entriesXml,
      "</feed>",
    ]
      .filter(Boolean)
      .join("\n");
  }
};
