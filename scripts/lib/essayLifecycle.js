function parseDateValue(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function resolveDeadlineAt(deadlineAt, startedAt) {
  const explicitDeadline = parseDateValue(deadlineAt);
  if (explicitDeadline) return explicitDeadline;

  const started = parseDateValue(startedAt);
  if (!started) return null;

  return new Date(started.getTime() + 30 * 24 * 60 * 60 * 1000);
}

function resolveTimeStatus({ status, initialStatus, publishedAt, deadlineAt, startedAt }) {
  if (status === "proposed" || status === "draft") {
    return "draft";
  }

  // In DUE, the public label reflects whether the essay was complete at release,
  // not whether the file timestamp happens to be before or after the deadline.
  if (initialStatus === "complete") {
    return "finished-on-time";
  }

  if (initialStatus === "unfinished") {
    return "unfinished-on-time";
  }

  const publishedDate = parseDateValue(publishedAt);
  const deadlineDate = resolveDeadlineAt(deadlineAt, startedAt);
  if (publishedDate && deadlineDate) {
    return publishedDate <= deadlineDate ? "finished-on-time" : "unfinished-on-time";
  }

  return "unfinished-on-time";
}

module.exports = {
  parseDateValue,
  resolveDeadlineAt,
  resolveTimeStatus,
};
