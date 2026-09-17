const VIEW_STORAGE_KEY = "dueEssayLibraryView";
const DEFAULT_VIEW = "compact";

function parsePreviews() {
  const node = document.querySelector("[data-essay-previews]");
  if (!node) return {};

  try {
    return JSON.parse(node.textContent || "{}");
  } catch (error) {
    return {};
  }
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

function normalizeCards(container, previews, observer) {
  if (!container) return;

  container.querySelectorAll(".list-card .countdown").forEach((countdown) => countdown.remove());

  const cards = Array.from(container.querySelectorAll(":scope > .list-card"));
  cards.forEach((card) => addPreview(card, previews));

  const sorted = [...cards].sort((a, b) => Number(isDraftCard(a)) - Number(isDraftCard(b)));
  const orderChanged = sorted.some((card, index) => card !== cards[index]);

  if (orderChanged) {
    observer?.disconnect();
    sorted.forEach((card) => container.appendChild(card));
    observer?.observe(container, { childList: true });
  }
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
  let scheduled = false;
  let observer;

  const normalize = () => {
    scheduled = false;
    normalizeCards(container, previews, observer);
  };

  observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(normalize);
  });

  observer.observe(container, { childList: true });
  setupViewToggle(container, toolbar);
  normalize();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", ready, { once: true });
} else {
  ready();
}
