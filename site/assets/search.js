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

function formatVersion(raw) {
  const parts = String(raw || "")
    .split(".")
    .map((part) => parseInt(part, 10))
    .filter((part) => Number.isFinite(part));

  if (!parts.length) return "0.1.0";
  while (parts.length < 3) parts.push(0);
  return parts.slice(0, 3).join(".");
}

const AUTHOR_ALIASES = {
  noahvandongen: "Noah van Dongen",
};

function formatAuthorName(raw) {
  if (!raw) return "";
  const normalized = String(raw).replace(/^@/, "");
  if (AUTHOR_ALIASES[normalized]) return AUTHOR_ALIASES[normalized];

  const parts = normalized
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));

  return parts.length ? parts.join(" ") : normalized;
}

function statusDisplay(entry) {
  const isDraftLike = entry.status === "draft" || entry.status === "proposed" || entry.time_status === "draft";
  if (isDraftLike) {
    return { label: "Draft", tone: "badge--tone-muted" };
  }

  const finished = entry.time_status === "finished-on-time" || entry.initial_status === "complete";
  return finished
    ? { label: "Finished on time", tone: "badge--tone-success" }
    : { label: "Unfinished on time", tone: "badge--tone-warn" };
}

function matchesQuery(entry, query) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (!terms.length) return true;

  const haystack = [
    entry.title,
    entry.topic,
    (entry.keywords || []).join(" "),
    entry.author,
    (entry.coauthors || []).join(" "),
    entry.summary,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return terms.every((term) => haystack.includes(term));
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

function renderLengthIcon(entry) {
  const meta = entry.lengthMeta || {};
  if (!entry.word_range || !meta.icon || !meta.palette) return "";
  const iconClass = `length-icon length-icon--${meta.icon} length-icon--${meta.palette}`;
  const label = meta.label || "Length";
  return `<span class="${iconClass}" aria-hidden="true"></span><span class="length-icon__label">${label}</span>`;
}

function renderBadges(entry) {
  const badges = [];
  const status = statusDisplay(entry);
  const isDraftLike = entry.status === "draft" || entry.status === "proposed" || entry.time_status === "draft";

  if (!isDraftLike && entry.version) {
    badges.push(`<span class="badge badge--tone-info">v${formatVersion(entry.version)}</span>`);
  }

  badges.push(`<span class="badge ${status.tone}">${status.label}</span>`);

  if (!isDraftLike && entry.published_at) {
    badges.push(`<span>Published ${formatDate(entry.published_at)}</span>`);
  }

  if (isDraftLike && entry.deadline_at) {
    badges.push(`
      <span class="badge deadline-badge" data-deadline-badge="${entry.deadline_at}" data-deadline-label="${formatDate(entry.deadline_at)}" title="Publishes on ${formatDate(entry.deadline_at)}"></span>
    `);
  } else if (isDraftLike) {
    badges.push('<span class="badge">Publication date pending</span>');
  }

  return badges.join("");
}

function renderMeta(entry) {
  const parts = [];
  const isDraftLike = entry.status === "draft" || entry.status === "proposed" || entry.time_status === "draft";
  if (entry.word_count) {
    parts.push(`<span>${entry.word_count} words</span>`);
  }
  const authorName = formatAuthorName(entry.author);
  if (authorName) {
    parts.push(`<span>By <strong>${authorName}</strong></span>`);
  }
  if (entry.topic) {
    const topic = entry.topic.split(/\s+/).slice(0, 5).join(" ");
    parts.push(`<span>Topic: <strong>${topic}</strong></span>`);
  }
  if (isDraftLike && entry.started_at) {
    parts.push(`<span>Started ${formatDate(entry.started_at)}</span>`);
  }
  if (isDraftLike && entry.deadline_at) {
    parts.push(`<span>Publishes ${formatDate(entry.deadline_at)}</span>`);
  }
  return parts.join("");
}

function renderCard(entry, baseUrl) {
  const lengthClass = entry.lengthMeta?.titleClass || "";
  const isDraftLike = entry.status === "draft" || entry.status === "proposed" || entry.time_status === "draft";
  const badges = renderBadges(entry);
  const meta = renderMeta(entry);
  const href = entry.url ? `${baseUrl.replace(/\/$/, "")}${entry.url}` : "";
  const titleMarkup = isDraftLike || !href
    ? `<span>${entry.title}</span>`
    : `<a href="${href}">${entry.title}</a>`;
  const tracker = isDraftLike && entry.deadline_at
    ? `<p class="countdown" data-deadline="${entry.deadline_at}"><span data-countdown>Calculating days until publication…</span></p>`
    : "";

  return `
    <article class="card list-card" data-essay-id="${entry.id}" data-status="${entry.status}" data-length-bin="${entry.lengthMeta?.bin || "unknown"}" data-time-status="${entry.time_status || (entry.initial_status === "complete" ? "finished-on-time" : "unfinished-on-time")}" data-author="${entry.author}" data-coauthors="${(entry.coauthors || []).join(",")}" data-keywords="${(entry.keywords || []).join(",")}" data-date="${entry.dateValue}" ${entry.deadline_at ? `data-deadline="${entry.deadline_at}"` : ""}>
      <header class="list-card__header">
        <div class="list-card__title-row">
          ${renderLengthIcon(entry)}
          <h4 class="card-title ${lengthClass}">${titleMarkup}</h4>
        </div>
      </header>
      <div class="meta">${badges}</div>
      ${tracker}
      <div class="meta meta--details">${meta}</div>
    </article>
  `;
}

function buildCheckboxList(container, values, labelPrefix, emptyText) {
  if (!container) return [];

  const unique = Array.from(new Set(values.filter(Boolean).sort((a, b) => a.localeCompare(b))));
  container.innerHTML = "";

  if (!unique.length) {
    container.innerHTML = `<p class="muted">${emptyText}</p>`;
    return [];
  }

  for (const value of unique) {
    const id = `${labelPrefix}-${value.replace(/[^a-zA-Z0-9]+/g, "-")}`;
    const label = document.createElement("label");
    label.className = "filter-option";
    label.setAttribute("for", id);

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = value;
    input.id = id;

    const text = document.createElement("span");
    text.textContent = value;

    label.appendChild(input);
    label.appendChild(text);
    container.appendChild(label);
  }

  return container.querySelectorAll("input[type='checkbox']");
}

function getCheckedValues(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll("input[type='checkbox']"))
    .filter((input) => input.checked)
    .map((input) => input.value);
}

function applyFilters({
  data,
  query,
  lengthBins,
  timeStatuses,
  authors,
  keywords,
  sort,
}) {
  const normalizedQuery = query.trim();
  const filtered = data.filter((entry) => {
    if (!matchesQuery(entry, normalizedQuery)) return false;

    if (lengthBins.length && !lengthBins.includes(entry.lengthMeta?.bin)) return false;

    if (timeStatuses.length) {
      const statusToken = entry.time_status || ((entry.status === "draft" || entry.status === "proposed")
        ? entry.status
        : entry.initial_status === "complete"
          ? "finished-on-time"
          : "unfinished-on-time");
      if (!timeStatuses.includes(statusToken)) return false;
    }

    if (authors.length) {
      const allAuthors = [entry.author, ...(entry.coauthors || [])].filter(Boolean);
      if (!allAuthors.some((person) => authors.includes(person))) return false;
    }

    if (keywords.length) {
      const entryKeywords = entry.keywords || [];
      if (!keywords.some((keyword) => entryKeywords.includes(keyword))) return false;
    }
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
  const interactive = document.querySelector("[data-search-interactive]");
  const fallback = document.querySelector("[data-search-fallback]");
  const resultsContainer = document.querySelector("[data-search-results]");
  const baseUrl = (interactive && interactive.getAttribute("data-base-url")) || "/";

  const searchInput = document.querySelector("[data-filter-search]");
  const lengthGroup = document.querySelector("[data-filter-length-group]");
  const finishedGroup = document.querySelector("[data-filter-finished-group]");
  const authorGroup = document.querySelector("[data-filter-author-group]");
  const keywordGroup = document.querySelector("[data-filter-keyword-group]");
  const sortSelect = document.querySelector("[data-filter-sort]");

  const lengthCheckboxes = lengthGroup ? Array.from(lengthGroup.querySelectorAll("input[type='checkbox']")) : [];
  const finishedCheckboxes = finishedGroup ? Array.from(finishedGroup.querySelectorAll("input[type='checkbox']")) : [];
  const authorCheckboxes = buildCheckboxList(
    authorGroup,
    data.flatMap((entry) => [entry.author, ...(entry.coauthors || [])]),
    "author",
    "No authors listed yet."
  );
  const keywordCheckboxes = buildCheckboxList(
    keywordGroup,
    data.flatMap((entry) => entry.keywords || []),
    "keyword",
    "No keywords available yet."
  );

  if (!data.length) {
    if (interactive) {
      interactive.hidden = false;
    }
    if (fallback) {
      fallback.hidden = true;
    }
    if (resultsContainer) {
      resultsContainer.innerHTML = '<div class="card"><p>No essays are indexed yet.</p></div>';
    }
    return;
  }

  const run = () => {
    const matches = applyFilters({
      data,
      query: searchInput?.value || "",
      lengthBins: getCheckedValues(lengthGroup),
      timeStatuses: getCheckedValues(finishedGroup),
      authors: getCheckedValues(authorGroup),
      keywords: getCheckedValues(keywordGroup),
      sort: sortSelect?.value || "newest",
    });
    renderResults(matches, resultsContainer, baseUrl);
  };

  const filterElements = [
    searchInput,
    sortSelect,
    ...lengthCheckboxes,
    ...finishedCheckboxes,
    ...Array.from(authorCheckboxes || []),
    ...Array.from(keywordCheckboxes || []),
  ];

  for (const element of filterElements) {
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
