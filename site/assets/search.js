import { initializeCountdowns } from "./countdown.js";
import {
  authorIdentity,
  collectUniqueAuthorIdentities,
  entryTaxonomyTerms,
  formatAuthorName,
} from "./search-utils.mjs";

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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function entryAuthorIdentities(entry) {
  return [entry.author, ...(entry.coauthors || [])]
    .map((value) => authorIdentity(value))
    .filter(Boolean);
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
    entryTaxonomyTerms(entry).join(" "),
    ...entryAuthorIdentities(entry).flatMap(({ label, raw }) => [label, raw]),
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
  const iconClass = `length-icon length-icon--${escapeHtml(meta.icon)} length-icon--${escapeHtml(meta.palette)}`;
  const label = escapeHtml(meta.label || "Length");
  return `<span class="${iconClass}" aria-hidden="true"></span><span class="length-icon__label">${label}</span>`;
}

function renderBadges(entry) {
  const badges = [];
  const status = statusDisplay(entry);
  const isDraftLike = entry.status === "draft" || entry.status === "proposed" || entry.time_status === "draft";

  if (!isDraftLike && entry.version) {
    badges.push(`<span class="badge badge--tone-info">v${escapeHtml(formatVersion(entry.version))}</span>`);
  }

  badges.push(`<span class="badge ${escapeHtml(status.tone)}">${escapeHtml(status.label)}</span>`);

  if (!isDraftLike && entry.published_at) {
    badges.push(`<span>Published ${escapeHtml(formatDate(entry.published_at))}</span>`);
  }

  if (isDraftLike && entry.deadline_at) {
    badges.push(`
      <span class="badge deadline-badge" data-deadline-badge="${escapeHtml(entry.deadline_at)}" data-deadline-label="${escapeHtml(formatDate(entry.deadline_at))}" title="Publishes on ${escapeHtml(formatDate(entry.deadline_at))}"></span>
    `);
  } else if (isDraftLike) {
    badges.push('<span class="badge">Publication date pending</span>');
  }

  return badges.join("");
}

function renderMeta(entry) {
  const parts = [];
  const isDraftLike = entry.status === "draft" || entry.status === "proposed" || entry.time_status === "draft";
  const previewKeywords = Array.isArray(entry.browser_keywords) && entry.browser_keywords.length
    ? entry.browser_keywords
    : entryTaxonomyTerms(entry).slice(0, 3);

  if (entry.word_count) {
    parts.push(`<span>${escapeHtml(entry.word_count)} words</span>`);
  }
  const authorName = formatAuthorName(entry.author);
  if (authorName) {
    parts.push(`<span>By <strong>${escapeHtml(authorName)}</strong></span>`);
  }
  if (previewKeywords.length) {
    parts.push(`<span>Keywords: <strong>${escapeHtml(previewKeywords.join(", "))}</strong></span>`);
  }
  if (isDraftLike && entry.started_at) {
    parts.push(`<span>Started ${escapeHtml(formatDate(entry.started_at))}</span>`);
  }
  if (isDraftLike && entry.deadline_at) {
    parts.push(`<span>Publishes ${escapeHtml(formatDate(entry.deadline_at))}</span>`);
  }
  return parts.join("");
}

function renderCard(entry, baseUrl) {
  const lengthClass = escapeHtml(entry.lengthMeta?.titleClass || "");
  const isDraftLike = entry.status === "draft" || entry.status === "proposed" || entry.time_status === "draft";
  const badges = renderBadges(entry);
  const meta = renderMeta(entry);
  const href = entry.url ? `${baseUrl.replace(/\/$/, "")}${entry.url}` : "";
  const titleMarkup = isDraftLike || !href
    ? `<span>${escapeHtml(entry.title)}</span>`
    : `<a href="${escapeHtml(href)}">${escapeHtml(entry.title)}</a>`;
  const coverLink = !isDraftLike && href
    ? `<a class="list-card__cover" href="${escapeHtml(href)}" aria-label="Read ${escapeHtml(entry.title)}"></a>`
    : "";
  const tracker = isDraftLike && entry.deadline_at
    ? `<p class="countdown" data-deadline="${escapeHtml(entry.deadline_at)}"><span data-countdown>Calculating days until publication…</span></p>`
    : "";

  return `
    <article class="card list-card${coverLink ? " list-card--clickable" : ""}" data-essay-id="${escapeHtml(entry.id)}" data-status="${escapeHtml(entry.status)}" data-length-bin="${escapeHtml(entry.lengthMeta?.bin || "unknown")}" data-time-status="${escapeHtml(entry.time_status || (entry.initial_status === "complete" ? "finished-on-time" : "unfinished-on-time"))}" data-author="${escapeHtml(entry.author)}" data-coauthors="${escapeHtml((entry.coauthors || []).join(","))}" data-keywords="${escapeHtml(entryTaxonomyTerms(entry).join(","))}" data-date="${escapeHtml(entry.dateValue)}" ${entry.deadline_at ? `data-deadline="${escapeHtml(entry.deadline_at)}"` : ""}>
      ${coverLink}
      <header class="list-card__header">
        <div class="list-card__title-row">
          ${renderLengthIcon(entry)}
          <h4 class="card-title ${lengthClass}">${titleMarkup}</h4>
        </div>
      </header>
      <div class="meta meta--status">${badges}</div>
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

  collapseLongFilterOptions(container);
  return container.querySelectorAll("input[type='checkbox']");
}

function buildAuthorCheckboxList(container, values, labelPrefix, emptyText) {
  if (!container) return [];

  const identities = collectUniqueAuthorIdentities(values);
  container.innerHTML = "";

  if (!identities.length) {
    container.innerHTML = `<p class="muted">${emptyText}</p>`;
    return [];
  }

  for (const identity of identities) {
    const id = `${labelPrefix}-${identity.key}`;
    const label = document.createElement("label");
    label.className = "filter-option";
    label.setAttribute("for", id);

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = identity.key;
    input.id = id;

    const text = document.createElement("span");
    text.textContent = identity.label;

    label.appendChild(input);
    label.appendChild(text);
    container.appendChild(label);
  }

  collapseLongFilterOptions(container);
  return container.querySelectorAll("input[type='checkbox']");
}

function collapseLongFilterOptions(container, visibleCount = 5) {
  if (!container) return;

  const options = Array.from(container.querySelectorAll(".filter-option"));
  if (options.length <= visibleCount) return;

  const hiddenCount = options.length - visibleCount;
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "filter-options__toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.textContent = `Show ${hiddenCount} more`;
  container.dataset.visibleCount = String(visibleCount);

  const setExpanded = (expanded) => {
    container.dataset.expanded = expanded ? "true" : "false";
    options.forEach((option, index) => {
      const input = option.querySelector("input[type='checkbox']");
      if (index >= visibleCount) {
        option.hidden = !expanded && !input?.checked;
      }
    });
    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    toggle.textContent = expanded ? "Show fewer" : `Show ${hiddenCount} more`;
  };

  toggle.addEventListener("click", () => {
    setExpanded(toggle.getAttribute("aria-expanded") !== "true");
  });

  container.appendChild(toggle);
  setExpanded(false);
}

function refreshLongFilterOptions(container) {
  if (!container || !container.dataset.visibleCount) return;

  const toggle = container.querySelector(".filter-options__toggle");
  const expanded = toggle?.getAttribute("aria-expanded") === "true";
  const visibleCount = parseInt(container.dataset.visibleCount, 10);
  if (!Number.isFinite(visibleCount)) return;

  Array.from(container.querySelectorAll(".filter-option")).forEach((option, index) => {
    const input = option.querySelector("input[type='checkbox']");
    if (index >= visibleCount) {
      option.hidden = !expanded && !input?.checked;
    }
  });
}

function openGroupWhenActive(container) {
  if (!container) return;
  const group = container.closest(".filter-group");
  if (!group) return;
  const hasCheckedInput = Boolean(container.querySelector("input[type='checkbox']:checked"));
  if (hasCheckedInput) {
    group.open = true;
  }
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
      const allAuthors = entryAuthorIdentities(entry).map(({ key }) => key);
      if (!allAuthors.some((person) => authors.includes(person))) return false;
    }

    if (keywords.length) {
      const entryKeywords = entryTaxonomyTerms(entry);
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

function pluralizeEssay(count) {
  return count === 1 ? "essay" : "essays";
}

function filterLabel(type, value) {
  const labels = {
    length: {
      tiny: "Tiny",
      minute: "Minute",
      short: "Short",
    },
    status: {
      draft: "Draft",
      "finished-on-time": "Finished on time",
      "unfinished-on-time": "Unfinished on time",
    },
  };

  return labels[type]?.[value] || value;
}

function collectActiveFilters({ query, lengthBins, timeStatuses, authors, keywords, authorLabels }) {
  const active = [];
  const trimmedQuery = query.trim();
  if (trimmedQuery) {
    active.push({ type: "query", value: trimmedQuery, label: `Search: ${trimmedQuery}` });
  }

  for (const value of lengthBins) {
    active.push({ type: "length", value, label: filterLabel("length", value) });
  }
  for (const value of timeStatuses) {
    active.push({ type: "status", value, label: filterLabel("status", value) });
  }
  for (const value of authors) {
    active.push({ type: "author", value, label: authorLabels.get(value) || filterLabel("author", value) });
  }
  for (const value of keywords) {
    active.push({ type: "keyword", value, label: filterLabel("keyword", value) });
  }

  return active;
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

function renderResultToolbar({
  matches,
  activeFilters,
  toolbar,
  countNode,
  activeFiltersNode,
  clearButton,
}) {
  if (toolbar) {
    toolbar.hidden = false;
  }

  if (countNode) {
    countNode.textContent = `${matches.length} ${pluralizeEssay(matches.length)} found`;
  }

  if (activeFiltersNode) {
    activeFiltersNode.innerHTML = "";
    for (const filter of activeFilters) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "active-filter";
      button.dataset.filterType = filter.type;
      button.dataset.filterValue = filter.value;
      button.setAttribute("aria-label", `Remove filter ${filter.label}`);
      button.textContent = `${filter.label} x`;
      activeFiltersNode.appendChild(button);
    }
  }

  if (clearButton) {
    clearButton.hidden = activeFilters.length === 0;
  }
}

function setupFilterDisclosure() {
  const toggle = document.querySelector("[data-filter-toggle]");
  const panel = document.querySelector("[data-filter-advanced]");
  if (!toggle || !panel) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    panel.classList.toggle("is-open", open);
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  setOpen(false);
}

function ready() {
  const data = parseData();
  const interactive = document.querySelector("[data-search-interactive]");
  const fallback = document.querySelector("[data-search-fallback]");
  const resultsContainer = document.querySelector("[data-search-results]");
  const resultToolbar = document.querySelector("[data-results-toolbar]");
  const resultCount = document.querySelector("[data-result-count]");
  const activeFiltersNode = document.querySelector("[data-active-filters]");
  const clearButton = document.querySelector("[data-clear-filters]");
  const baseUrl = (interactive && interactive.getAttribute("data-base-url")) || "/";

  const searchInput = document.querySelector("[data-filter-search]");
  const lengthGroup = document.querySelector("[data-filter-length-group]");
  const finishedGroup = document.querySelector("[data-filter-finished-group]");
  const authorGroup = document.querySelector("[data-filter-author-group]");
  const keywordGroup = document.querySelector("[data-filter-keyword-group]");
  const sortSelect = document.querySelector("[data-filter-sort]");

  const lengthCheckboxes = lengthGroup ? Array.from(lengthGroup.querySelectorAll("input[type='checkbox']")) : [];
  const finishedCheckboxes = finishedGroup ? Array.from(finishedGroup.querySelectorAll("input[type='checkbox']")) : [];
  const authorIdentities = collectUniqueAuthorIdentities(data.flatMap((entry) => [entry.author, ...(entry.coauthors || [])]));
  const authorLabels = new Map(authorIdentities.map((identity) => [identity.key, identity.label]));
  const authorCheckboxes = buildAuthorCheckboxList(
    authorGroup,
    data.flatMap((entry) => [entry.author, ...(entry.coauthors || [])]),
    "author",
    "No authors listed yet."
  );
  const keywordCheckboxes = buildCheckboxList(
    keywordGroup,
    data.flatMap((entry) => entryTaxonomyTerms(entry)),
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

  const removeFilter = (type, value) => {
    if (type === "query" && searchInput) {
      searchInput.value = "";
      return;
    }

    const groupMap = {
      length: lengthGroup,
      status: finishedGroup,
      author: authorGroup,
      keyword: keywordGroup,
    };
    const group = groupMap[type];
    const input = group?.querySelector(`input[type='checkbox'][value="${CSS.escape(value)}"]`);
    if (input) {
      input.checked = false;
    }
  };

  const clearFilters = () => {
    if (searchInput) searchInput.value = "";
    if (sortSelect) sortSelect.value = "newest";
    const allCheckboxes = [
      ...lengthCheckboxes,
      ...finishedCheckboxes,
      ...Array.from(authorCheckboxes || []),
      ...Array.from(keywordCheckboxes || []),
    ];
    for (const checkbox of allCheckboxes) {
      checkbox.checked = false;
    }
  };

  const run = () => {
    refreshLongFilterOptions(authorGroup);
    refreshLongFilterOptions(keywordGroup);
    openGroupWhenActive(lengthGroup);
    openGroupWhenActive(finishedGroup);
    openGroupWhenActive(authorGroup);
    openGroupWhenActive(keywordGroup);

    const query = searchInput?.value || "";
    const lengthBins = getCheckedValues(lengthGroup);
    const timeStatuses = getCheckedValues(finishedGroup);
    const authors = getCheckedValues(authorGroup);
    const keywords = getCheckedValues(keywordGroup);
    const matches = applyFilters({
      data,
      query,
      lengthBins,
      timeStatuses,
      authors,
      keywords,
      sort: sortSelect?.value || "newest",
    });
    const activeFilters = collectActiveFilters({
      query,
      lengthBins,
      timeStatuses,
      authors,
      keywords,
      authorLabels,
    });

    renderResults(matches, resultsContainer, baseUrl);
    renderResultToolbar({
      matches,
      activeFilters,
      toolbar: resultToolbar,
      countNode: resultCount,
      activeFiltersNode,
      clearButton,
    });
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

  activeFiltersNode?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter-type]");
    if (!button) return;
    removeFilter(button.dataset.filterType, button.dataset.filterValue);
    run();
  });

  clearButton?.addEventListener("click", () => {
    clearFilters();
    run();
  });

  setupFilterDisclosure();

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
