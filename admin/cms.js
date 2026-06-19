const MS_PER_DAY = 24 * 60 * 60 * 1000;
let countdownWidgetRegistered = false;
let draftDateDefaultsRegistered = false;

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

function registerDraftDateDefaults() {
  if (draftDateDefaultsRegistered) return true;

  const CMS = window.CMS;
  if (!CMS || typeof CMS.registerEventListener !== "function") return false;

  CMS.registerEventListener({
    name: "preSave",
    handler: ({ entry }) => resolveDraftDateDefaults(entry),
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

const registerInterval = setInterval(() => {
  const didRegisterWidget = registerCountdownWidget();
  const didRegisterDateDefaults = registerDraftDateDefaults();
  if (didRegisterWidget && didRegisterDateDefaults) {
    clearInterval(registerInterval);
  }
}, 100);

registerCountdownWidget();
registerDraftDateDefaults();
