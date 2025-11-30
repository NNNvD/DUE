import elasticlunr from "https://cdn.jsdelivr.net/npm/elasticlunr@0.9.6/elasticlunr.min.js";
import { initializeCountdowns } from "./countdown.js";

function parseData() {
  const dataNode = document.querySelector("[data-essay-search]");
  if (!dataNode) return [];

  try {
    return JSON.parse(dataNode.textContent || "[]");
  } catch (error) {
    return [];
  }
}

function buildIndex(essays) {
  const index = elasticlunr(function () {
    this.setRef("id");
    this.addField("title");
    this.addField("topic");
    this.addField("keywordsText");
    this.addField("author");
    this.addField("coauthorsText");
    this.addField("summary");
  });

  for (const entry of essays) {
    index.addDoc({
      ...entry,
      keywordsText: (entry.keywords || []).join(" "),
      coauthorsText: (entry.coauthors || []).join(" "),
    });
  }

  return index;
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function renderLengthChip(entry) {
  if (!entry.word_range) return "";
  const iconClass = `length-icon length-icon--${entry.lengthMeta.icon} length-icon--${entry.lengthMeta.palette}`;
  const exact = entry.word_count ? `<span aria-hidden="true">•</span><span>${entry.word_count} words</span>` : "";
  return `
    <div class="length-chip" aria-label="Length: ${entry.word_range} words">
      <span class="${iconClass}" aria-hidden="true"></span>
      <span class="length-chip__text">
        <span>${entry.word_range} words</span>
        ${exact}
      </span>
    </div>
  `;
}

function renderBadges(entry) {
  const badges = [];

  if (entry.version) {
    badges.push(`<span class="badge badge--tone-info">v${entry.version}</span>`);
  }

  if (entry.status === "published") {
    if (entry.initial_status === "complete") {
      badges.push('<span class="badge badge--tone-success">Published completed</span>');
    } else {
      badges.push('<span class="badge badge--tone-warn">Published unfinished</span>');
    }
    if (entry.published_at) {
      badges.push(`<span>Published ${formatDate(entry.published_at)}</span>`);
    }
  } else if (entry.deadline_at) {
    badges.push(`
      <span class="badge deadline-badge" data-deadline-badge="${entry.deadline_at}" data-deadline-label="${formatDate(entry.deadline_at)}" title="Publishes ${formatDate(entry.deadline_at)}">${formatDate(entry.deadline_at)}</span>
    `);
  } else {
    badges.push('<span class="badge">Deadline pending</span>');
  }

  if (entry.word_range) {
    badges.push(`<span class="badge ${entry.word_range ? entry.lengthMeta.tone : "badge--tone-muted"}">${entry.word_range} words</span>`);
  }

  return badges.join("");
}

function renderMeta(entry) {
  const parts = [];
  if (entry.author) {
    parts.push(`<span>By <strong>@${entry.author}</strong></span>`);
  }
  if (entry.topic) {
    parts.push(`<span>Topic: ${entry.topic.split(/\s+/).slice(0, 5).join(" ")}</span>`);
  }
  if (entry.display_keywords && entry.display_keywords.length) {
    parts.push(`<span>Keywords: ${entry.display_keywords.join(", ")}</span>`);
  }
  return parts.join("");
}

function renderCard(entry, baseUrl) {
  const lengthClass = entry.lengthMeta?.titleClass || "";
  const badges = renderBadges(entry);
  const meta = renderMeta(entry);
  const releaseNote = entry.release_notes && entry.release_notes.length ? `<p class="muted"><strong>Latest:</strong> ${entry.release_notes[0]}</p>` : "";
  const countdown = entry.status === "draft" ? `<p class="countdown"><span data-countdown>${entry.deadline_at ? `Publishes at ${formatDate(entry.deadline_at)}` : "Deadline not yet scheduled."}</span></p>` : "";
  const href = `${baseUrl.replace(/\/$/, "")}${entry.url}`;

  return `
    <article class="card list-card" data-essay-id="${entry.id}" data-status="${entry.status}" data-length-bin="${entry.lengthMeta?.bin || "unknown"}" data-finished="${entry.initial_status === "complete"}" data-author="${entry.author}" data-coauthors="${(entry.coauthors || []).join(",")}" data-keywords="${(entry.keywords || []).join(",")}" data-date="${entry.dateValue}" ${entry.deadline_at ? `data-deadline="${entry.deadline_at}"` : ""}>
      <header class="list-card__header">
        <div class="stack">
          ${renderLengthChip(entry)}
          <h4 class="card-title ${lengthClass}"><a href="${href}">${entry.title}</a></h4>
        </div>
        <div class="meta">${badges}</div>
      </header>
      <div class="meta">${meta}</div>
      ${releaseNote}
      ${entry.status === "draft" ? `<p class="muted">${entry.summary || "Draft in progress."}</p>` : ""}
      ${countdown}
    </article>
  `;
}

function populateSelect(select, values, label) {
  if (!select) return;
  const unique = Array.from(new Set(values.filter(Boolean).sort((a, b) => a.localeCompare(b))));
  select.innerHTML = `<option value="">All ${label}</option>`;
  for (const value of unique) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  }
}

function applyFilters({
  data,
  index,
  query,
  lengthBin,
  finished,
  author,
  keyword,
  sort,
}) {
  const normalizedQuery = query.trim();
  let ranked = [];

  if (normalizedQuery) {
    ranked = index.search(normalizedQuery, {
      fields: {
        title: { boost: 3 },
        topic: { boost: 2 },
        keywordsText: { boost: 2 },
        author: { boost: 1.5 },
        coauthorsText: { boost: 1 },
        summary: { boost: 1 },
      },
      expand: true,
    }).map((match) => ({
      score: match.score,
      ...data.find((entry) => entry.id === match.ref),
    }));
  } else {
    ranked = [...data];
  }

  const filtered = ranked.filter((entry) => {
    if (lengthBin && entry.lengthMeta?.bin !== lengthBin) return false;
    if (finished === "complete" && entry.initial_status !== "complete") return false;
    if (finished === "unfinished" && entry.initial_status !== "unfinished") return false;
    if (finished === "draft" && entry.status !== "draft") return false;
    if (author && entry.author !== author && !(entry.coauthors || []).includes(author)) return false;
    if (keyword && !(entry.keywords || []).includes(keyword)) return false;
    return true;
  });

  const sorted = filtered.sort((a, b) => {
    const aDate = a.dateValue || 0;
    const bDate = b.dateValue || 0;
    if (sort === "oldest") return aDate - bDate;
    return bDate - aDate;
  });

  return sorted;
}

function renderResults(matches, container, baseUrl) {
  if (!container) return;
  if (!matches.length) {
    container.innerHTML = '<div class="card"><p>No essays match these filters yet.</p></div>';
    return;
  }

  const html = matches.map((entry) => renderCard(entry, baseUrl)).join("");
  container.innerHTML = html;
  initializeCountdowns(container);
}

function ready() {
  const data = parseData();
  if (!data.length) return;

  const index = buildIndex(data);
  const interactive = document.querySelector("[data-search-interactive]");
  const fallback = document.querySelector("[data-search-fallback]");
  const resultsContainer = document.querySelector("[data-search-results]");
  const baseUrl = (interactive && interactive.getAttribute("data-base-url")) || "/";

  const searchInput = document.querySelector("[data-filter-search]");
  const lengthSelect = document.querySelector("[data-filter-length]");
  const finishedSelect = document.querySelector("[data-filter-finished]");
  const authorSelect = document.querySelector("[data-filter-author]");
  const keywordSelect = document.querySelector("[data-filter-keyword]");
  const sortSelect = document.querySelector("[data-filter-sort]");

  populateSelect(authorSelect, data.flatMap((entry) => [entry.author, ...(entry.coauthors || [])]), "authors");
  populateSelect(keywordSelect, data.flatMap((entry) => entry.keywords || []), "keywords");

  const run = () => {
    const matches = applyFilters({
      data,
      index,
      query: searchInput?.value || "",
      lengthBin: lengthSelect?.value || "",
      finished: finishedSelect?.value || "",
      author: authorSelect?.value || "",
      keyword: keywordSelect?.value || "",
      sort: sortSelect?.value || "newest",
    });
    renderResults(matches, resultsContainer, baseUrl);
  };

  for (const element of [searchInput, lengthSelect, finishedSelect, authorSelect, keywordSelect, sortSelect]) {
    if (!element) continue;
    element.addEventListener("input", run);
    element.addEventListener("change", run);
  }

  if (interactive) {
    interactive.hidden = false;
  }
  if (fallback) {
    fallback.hidden = true;
  }

  run();
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  ready();
} else {
  document.addEventListener("DOMContentLoaded", ready);
}
