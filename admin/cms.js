const MS_PER_DAY = 24 * 60 * 60 * 1000;
let countdownWidgetRegistered = false;
let draftDateDefaultsRegistered = false;
let publishActionRegistered = false;

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDate(date) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function normalizeDateValue(value) {
  return formatDate(parseDate(value));
}

function readEntryValue(entry, key) {
  if (!entry) return undefined;
  if (typeof entry.getIn === "function") {
    return entry.getIn(["data", key]);
  }
  if (entry.data && Object.prototype.hasOwnProperty.call(entry.data, key)) {
    return entry.data[key];
  }
  return undefined;
}

function writeEntryValue(entry, key, value) {
  if (!entry) return entry;
  if (typeof entry.setIn === "function") {
    return entry.setIn(["data", key], value);
  }
  if (entry.data && typeof entry.data === "object") {
    return {
      ...entry,
      data: {
        ...entry.data,
        [key]: value,
      },
    };
  }
  return entry;
}

function resolveDraftDateDefaults(entry, now = new Date()) {
  const status = String(readEntryValue(entry, "status") || "proposed").toLowerCase();
  if (!["proposed", "draft"].includes(status)) return entry;

  const today = formatDate(now);
  const startedAt =
    normalizeDateValue(readEntryValue(entry, "started_at")) ||
    normalizeDateValue(readEntryValue(entry, "proposed_at")) ||
    today;
  const deadlineAt =
    normalizeDateValue(readEntryValue(entry, "deadline_at")) ||
    formatDate(addDays(parseDate(startedAt), 30));

  let nextEntry = entry;
  if (!normalizeDateValue(readEntryValue(nextEntry, "started_at"))) {
    nextEntry = writeEntryValue(nextEntry, "started_at", startedAt);
  }
  if (!normalizeDateValue(readEntryValue(nextEntry, "proposed_at"))) {
    nextEntry = writeEntryValue(nextEntry, "proposed_at", startedAt);
  }
  if (!normalizeDateValue(readEntryValue(nextEntry, "deadline_at"))) {
    nextEntry = writeEntryValue(nextEntry, "deadline_at", deadlineAt);
  }
  if (typeof readEntryValue(nextEntry, "word_count") !== "number") {
    nextEntry = writeEntryValue(nextEntry, "word_count", 0);
  }

  return nextEntry;
}

function resolvePublishedUpdate(entry) {
  const status = String(readEntryValue(entry, "status") || "").toLowerCase();
  if (status !== "published") return entry;
  return writeEntryValue(entry, "update_pending", true);
}

function resolvePreSave(entry, now = new Date()) {
  return resolvePublishedUpdate(resolveDraftDateDefaults(entry, now));
}

function resolvePublicationDate(entry) {
  if (!entry || typeof entry.getIn !== "function") return null;
  const data = entry.getIn(["data"]);
  if (!data) return null;

  const deadlineAt = entry.getIn(["data", "deadline_at"]);
  const publishedAt = entry.getIn(["data", "published_at"]);
  const startedAt = entry.getIn(["data", "started_at"]);

  const explicit = parseDate(deadlineAt) || parseDate(publishedAt);
  if (explicit) return explicit;

  const started = parseDate(startedAt);
  if (!started) return null;

  return new Date(started.getTime() + 30 * MS_PER_DAY);
}

function registerEntryDefaults() {
  if (draftDateDefaultsRegistered) return true;

  const CMS = window.CMS;
  if (!CMS || typeof CMS.registerEventListener !== "function") return false;

  CMS.registerEventListener({
    name: "preSave",
    handler: ({ entry }) => resolvePreSave(entry),
  });
  draftDateDefaultsRegistered = true;
  return true;
}

function buildCountdownLabel(target) {
  if (!target) return "Publication date pending.";
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "0 days until publication";
  const days = Math.ceil(diff / MS_PER_DAY);
  const suffix = days === 1 ? "day" : "days";
  return `${days} ${suffix} until publication`;
}

function registerCountdownWidget() {
  if (countdownWidgetRegistered) return true;

  const CMS = window.CMS;
  const h = window.h;
  const createClass = window.createClass;

  if (!CMS || !h || !createClass) return false;

  const CountdownControl = createClass({
    render() {
      const target = resolvePublicationDate(this.props.entry);
      const label = buildCountdownLabel(target);
      const dateLabel = target ? formatDate(target) : "—";

      return h("div", { className: "nc-widget countdown-widget" }, [
        h("p", { className: "nc-widgetLabel" }, "Countdown"),
        h("p", { className: "nc-widgetControl" }, label),
        h("p", { className: "nc-widgetHint" }, `Publication date: ${dateLabel}`),
      ]);
    },
  });

  CMS.registerWidget("countdown", CountdownControl);
  countdownWidgetRegistered = true;
  return true;
}

function findSaveButton() {
  const buttons = Array.from(document.querySelectorAll("button"));
  return buttons.find((button) => {
    const text = String(button.textContent || "").trim().toLowerCase();
    return text === "save" || text === "save draft";
  });
}

function registerPublishActionWidget() {
  if (publishActionRegistered) return true;

  const CMS = window.CMS;
  const h = window.h;
  const createClass = window.createClass;

  if (!CMS || !h || !createClass) return false;

  const PublishActionControl = createClass({
    getInitialState() {
      return { queued: false, helpOpen: false };
    },
    handlePublish() {
      if (typeof this.props.onChange === "function") {
        this.props.onChange(true);
      }
      this.setState({ queued: true });

      setTimeout(() => {
        const saveButton = findSaveButton();
        if (saveButton && !saveButton.disabled) {
          saveButton.click();
        }
      }, 250);
    },
    toggleHelp() {
      this.setState({ helpOpen: !this.state.helpOpen });
    },
    render() {
      const help = this.state.helpOpen
        ? h("div", { className: "due-help-panel", role: "note" }, [
            h("p", {}, "Publishes this draft as a finished essay, records today as the publication date, and starts the published essay at v1.0.0."),
            h("p", {}, "Use Save draft instead when you only want to update the public draft."),
          ])
        : null;
      const status = this.state.queued
        ? h("p", { className: "due-publish-status", role: "status", "aria-live": "polite" }, "Publication queued. If saving does not start automatically, click Save draft once.")
        : null;

      return h("div", { className: "due-publish-action" }, [
        h("div", { className: "due-action-heading" }, [
          h("strong", {}, "Ready to publish?"),
          h("button", {
            type: "button",
            className: "due-help-toggle",
            onClick: () => this.toggleHelp(),
            "aria-label": "About publishing an essay",
            "aria-expanded": this.state.helpOpen ? "true" : "false",
          }, "?"),
        ]),
        help,
        h("button", {
          type: "button",
          className: "due-publish-button",
          onClick: () => this.handlePublish(),
          disabled: this.state.queued,
        }, this.state.queued ? "Publishing…" : "Publish essay"),
        status,
      ]);
    },
  });

  CMS.registerWidget("publish-action", PublishActionControl);
  publishActionRegistered = true;
  return true;
}

function collapseFieldHints() {
  document.querySelectorAll(".nc-widgetHint:not([data-due-help-ready])").forEach((hint) => {
    const text = String(hint.textContent || "").trim();
    if (!text || hint.closest(".countdown-widget")) return;

    hint.dataset.dueHelpReady = "true";
    hint.classList.add("due-help-panel");
    hint.hidden = true;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "due-help-toggle";
    toggle.textContent = "?";
    toggle.setAttribute("aria-label", "Show field help");
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", () => {
      const nextHidden = !hint.hidden;
      hint.hidden = nextHidden;
      toggle.setAttribute("aria-expanded", nextHidden ? "false" : "true");
    });

    hint.parentNode?.insertBefore(toggle, hint);
  });
}

function editorModeFromLocation() {
  const route = `${window.location.hash || ""} ${window.location.pathname || ""}`.toLowerCase();
  if (route.includes("/published/")) return "published";
  if (route.includes("/drafts/")) return "draft";
  return null;
}

function renameSaveButtons() {
  const mode = editorModeFromLocation();
  if (!mode) return;

  document.querySelectorAll("button").forEach((button) => {
    const text = String(button.textContent || "").trim();
    if (text !== "Save" && text !== "Save draft" && text !== "Save changes") return;
    button.textContent = mode === "published" ? "Save changes" : "Save draft";
  });
}

function enhanceAdminUi() {
  collapseFieldHints();
  renameSaveButtons();
}

const observer = new MutationObserver(enhanceAdminUi);
observer.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener("hashchange", enhanceAdminUi);

const registerInterval = setInterval(() => {
  const didRegisterCountdown = registerCountdownWidget();
  const didRegisterDefaults = registerEntryDefaults();
  const didRegisterPublishAction = registerPublishActionWidget();
  if (didRegisterCountdown && didRegisterDefaults && didRegisterPublishAction) {
    clearInterval(registerInterval);
  }
}, 100);

registerCountdownWidget();
registerEntryDefaults();
registerPublishActionWidget();
enhanceAdminUi();
