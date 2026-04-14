const KNOWN_AUTHOR_LABELS = {
  noahvandongen: "Noah van Dongen",
};

function stripAtPrefix(value) {
  return String(value || "").replace(/^@/, "").trim();
}

function toComparableAuthorKey(value) {
  return stripAtPrefix(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

export function formatAuthorName(value) {
  const raw = stripAtPrefix(value);
  if (!raw) return "";

  const comparableKey = toComparableAuthorKey(raw);
  if (KNOWN_AUTHOR_LABELS[comparableKey]) {
    return KNOWN_AUTHOR_LABELS[comparableKey];
  }

  if (/\s/.test(raw)) {
    return raw;
  }

  const parts = raw
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => capitalize(part));

  return parts.length ? parts.join(" ") : raw;
}

export function authorIdentity(value) {
  const raw = stripAtPrefix(value);
  if (!raw) return null;

  return {
    key: toComparableAuthorKey(raw) || raw.toLowerCase(),
    label: formatAuthorName(raw),
    raw,
  };
}

export function collectUniqueAuthorIdentities(values = []) {
  const identities = new Map();

  for (const value of values) {
    const identity = authorIdentity(value);
    if (!identity) continue;

    if (!identities.has(identity.key)) {
      identities.set(identity.key, identity);
    }
  }

  return Array.from(identities.values()).sort((a, b) => a.label.localeCompare(b.label));
}

function uniqueTerms(values = []) {
  const terms = [];
  const seen = new Set();

  for (const value of values) {
    const normalized = String(value || "").trim();
    if (!normalized) continue;

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    terms.push(normalized);
  }

  return terms;
}

export function entryTaxonomyTerms(entry = {}) {
  const keywords = Array.isArray(entry.keywords) ? entry.keywords : [];
  const themes = Array.isArray(entry.themes) ? entry.themes : [];
  const terms = uniqueTerms([...keywords, ...themes]);

  if (terms.length) {
    return terms;
  }

  const topic = String(entry.topic || "").trim();
  return topic ? [topic] : [];
}
