const VIEW_STORAGE_KEY = "dueEssayLibraryView";
const DEFAULT_VIEW = "compact";
const LANGUAGE_LABELS = {
  en: "English",
  nl: "Nederlands",
};

function parseJson(selector, fallback) {
  const node = document.querySelector(selector);
  if (!node) return fallback;

  try {
    return JSON.parse(node.textContent || "");
  } catch (error) {
    return fallback;
  }
}

function parsePreviews() {
  return parseJson("[data-essay-previews]", {});
}

function parseEssayData() {
  return parseJson("[data-essay-search]", []);
}

function languageCode(entry) {
  return String(entry?.language || "en").trim().toLowerCase() || "en";
}

function languageLabel(code) {
  return LANGUAGE_LABELS[code] || code;
}

function isDraftCard(card) {
  const status = card.dataset.status || "";
  return status === "draft" || status === "proposed" || card.dataset.timeStatus === "draft";
}

function storedView() {
  try {
    const value = window.localStorage.getItem(VIEW_STORAGE_KEY);
    return value === "preview" ? "preview" : DEFAULT_VIEW;
  } catch (error) {
    return DEFAULT_VIEW;
  }
}

function saveView(view) {
  try {
    window.localStorage.setItem(VIEW_STORAGE_KEY, view);
  } catch (error) {
    // The view still works when storage is unavailable.
  }
}

function addPreview(card, previews) {
  if (card.querySelector(".list-card__preview")) return;

  const excerpt = previews[card.dataset.essayId];
  if (!excerpt) return;

  const preview = document.createElement("p");
  preview.className = "list-card__preview";
  preview.textContent = excerpt;

  const statusMeta = card.querySelector(".meta--status");
  const detailsMeta = card.querySelector(".meta--details");
  if (statusMeta) {
    statusMeta.insertAdjacentElement("afterend", preview);
  } else if (detailsMeta) {
    detailsMeta.insertAdjacentElement("beforebegin", preview);
  } else {
    card.appendChild(preview);
  }
}

function addLanguageBadge(card, entry) {
  const code = languageCode(entry);
  card.dataset.language = code;

  if (code === "en" || card.querySelector("[data-language-badge]")) return;
  const statusMeta = card.querySelector(".meta--status");
  if (!statusMeta) return;

  const badge = document.createElement("span");
  badge.className = "badge badge--tone-muted";
  badge.dataset.languageBadge = "";
  badge.textContent = languageLabel(code);
  statusMeta.appendChild(badge);
}

function selectedLanguages(group) {
  if (!group) return [];
  return Array.from(group.querySelectorAll("input[type='checkbox']:checked")).map((input) => input.value);
}

function buildLanguageFilter(group, data) {
  if (!group) return;

  const languages = Array.from(new Set(data.map(languageCode))).sort((a, b) => {
    return languageLabel(a).localeCompare(languageLabel(b));
  });

  group.innerHTML = "";
  for (const code of languages) {
    const label = document.createElement("label");
    label.className = "filter-option";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = code;

    const text = document.createElement("span");
    text.textContent = languageLabel(code);

    label.append(input, text);
    group.appendChild(label);
  }
}

function addLanguageFilterPills(activeFiltersNode, languages) {
  if (!activeFiltersNode) return;

  activeFiltersNode.querySelectorAll('[data-filter-type="language"]').forEach((node) => node.remove());
  for (const code of languages) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "active-filter";
    button.dataset.filterType = "language";
    button.dataset.filterValue = code;
    button.setAttribute("aria-label", `Remove filter ${languageLabel(code)}`);
    button.textContent = `${languageLabel(code)} x`;
    activeFiltersNode.appendChild(button);
  }
}

function applyLanguageFilter(container, group, entryMap, countNode, activeFiltersNode, clearButton) {
  if (!container) return;

  const languages = selectedLanguages(group);
  const cards = Array.from(container.querySelectorAll(":scope > .list-card"));
  let visibleCount = 0;

  cards.forEach((card) => {
    const entry = entryMap.get(card.dataset.essayId);
    const code = languageCode(entry);
    addLanguageBadge(card, entry);
    const visible = !languages.length || languages.includes(code);
    card.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  let empty = container.querySelector("[data-language-empty]");
  if (cards.length && visibleCount === 0) {
    if (!empty) {
      empty = document.createElement("div");
      empty.className = "card";
      empty.dataset.languageEmpty = "";
      empty.innerHTML = "<p>No essays match these language filters.</p>";
      container.appendChild(empty);
    }
    empty.hidden = false;
  } else if (empty) {
    empty.hidden = true;
  }

  if (countNode && cards.length) {
    countNode.textContent = `${visibleCount} ${visibleCount === 1 ? "essay" : "essays"} found`;
  }

  addLanguageFilterPills(activeFiltersNode, languages);

  if (clearButton) {
    const hasOtherFilters = Boolean(activeFiltersNode?.querySelector('[data-filter-type]:not([data-filter-type="language"])'));
    clearButton.hidden = languages.length === 0 && !hasOtherFilters;
  }
}

function normalizeCards(container, previews, observer, entryMap, languageGroup, countNode, activeFiltersNode, clearButton) {
  if (!container) return;

  container.querySelectorAll(".list-card .countdown").forEach((countdown) => countdown.remove());

  const cards = Array.from(container.querySelectorAll(":scope > .list-card"));
  cards.forEach((card) => {
    addPreview(card, previews);
    addLanguageBadge(card, entryMap.get(card.dataset.essayId));
  });

  const sorted = [...cards].sort((a, b) => Number(isDraftCard(a)) - Number(isDraftCard(b)));
  const orderChanged = sorted.some((card, index) => card !== cards[index]);

  if (orderChanged) {
    observer?.disconnect();
    sorted.forEach((card) => container.appendChild(card));
    observer?.observe(container, { childList: true });
  }

  applyLanguageFilter(container, languageGroup, entryMap, countNode, activeFiltersNode, clearButton);
}

function setupViewToggle(container, toolbar) {
  if (!container || !toolbar || toolbar.querySelector("[data-view-toggle]")) return;

  const actions = document.createElement("div");
  actions.className = "results-toolbar__actions";

  const toggle = document.createElement("div");
  toggle.className = "view-toggle";
  toggle.dataset.viewToggle = "";
  toggle.setAttribute("role", "group");
  toggle.setAttribute("aria-label", "Essay display mode");

  const compactButton = document.createElement("button");
  compactButton.type = "button";
  compactButton.textContent = "Compact";
  compactButton.dataset.viewMode = "compact";

  const previewButton = document.createElement("button");
  previewButton.type = "button";
  previewButton.textContent = "Preview";
  previewButton.dataset.viewMode = "preview";

  toggle.append(compactButton, previewButton);
  actions.appendChild(toggle);

  const clearButton = toolbar.querySelector("[data-clear-filters]");
  if (clearButton) actions.appendChild(clearButton);
  toolbar.appendChild(actions);

  const setView = (view, persist = true) => {
    const normalized = view === "preview" ? "preview" : "compact";
    container.dataset.view = normalized;
    toggle.querySelectorAll("[data-view-mode]").forEach((button) => {
      const active = button.dataset.viewMode === normalized;
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    if (persist) saveView(normalized);
  };

  toggle.addEventListener("click", (event) => {
    const button = event.target.closest("[data-view-mode]");
    if (!button) return;
    setView(button.dataset.viewMode);
  });

  setView(storedView(), false);
}

function ready() {
  const container = document.querySelector("[data-search-results]");
  const toolbar = document.querySelector("[data-results-toolbar]");
  if (!container) return;

  const previews = parsePreviews();
  const data = parseEssayData();
  const entryMap = new Map(data.map((entry) => [entry.id, entry]));
  const languageGroup = document.querySelector("[data-filter-language-group]");
  const countNode = document.querySelector("[data-result-count]");
  const activeFiltersNode = document.querySelector("[data-active-filters]");
  const clearButton = document.querySelector("[data-clear-filters]");

  buildLanguageFilter(languageGroup, data);

  let scheduled = false;
  let observer;

  const normalize = () => {
    scheduled = false;
    normalizeCards(
      container,
      previews,
      observer,
      entryMap,
      languageGroup,
      countNode,
      activeFiltersNode,
      clearButton
    );
  };

  observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(normalize);
  });

  observer.observe(container, { childList: true });
  setupViewToggle(container, toolbar);

  languageGroup?.addEventListener("change", normalize);

  activeFiltersNode?.addEventListener("click", (event) => {
    const button = event.target.closest('[data-filter-type="language"]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const input = languageGroup?.querySelector(`input[value="${CSS.escape(button.dataset.filterValue)}"]`);
    if (input) input.checked = false;
    normalize();
  }, true);

  clearButton?.addEventListener("click", () => {
    languageGroup?.querySelectorAll("input[type='checkbox']").forEach((input) => {
      input.checked = false;
    });
    queueMicrotask(normalize);
  });

  normalize();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", ready, { once: true });
} else {
  ready();
}
