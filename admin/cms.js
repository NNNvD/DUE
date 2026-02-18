const MS_PER_DAY = 24 * 60 * 60 * 1000;

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
  return true;
}

const registerInterval = setInterval(() => {
  if (registerCountdownWidget()) {
    clearInterval(registerInterval);
  }
}, 100);

registerCountdownWidget();
