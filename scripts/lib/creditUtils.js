function normalizeCoauthors(list) {
  if (!Array.isArray(list)) return [];

  const seen = new Set();
  const result = [];

  for (const item of list) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }

  return result;
}

function parseVersion(version) {
  if (typeof version !== "string") return null;
  const match = version.trim().match(/^(\d+)\.(\d+)(?:\.(\d+))?$/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3] || 0),
  };
}

function selectEarliestVersion(a, b) {
  if (!a) return b || a;
  if (!b) return a;

  const pa = parseVersion(a);
  const pb = parseVersion(b);

  if (!pa && !pb) return a;
  if (!pa) return b;
  if (!pb) return a;

  if (pa.major !== pb.major) {
    return pa.major < pb.major ? a : b;
  }
  if (pa.minor !== pb.minor) {
    return pa.minor < pb.minor ? a : b;
  }
  if (pa.patch !== pb.patch) {
    return pa.patch < pb.patch ? a : b;
  }
  return a;
}

function normalizeAcknowledgments(list) {
  if (!Array.isArray(list)) return [];

  const normalized = [];
  const seen = new Map();

  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const key = entry.user;
    if (!key) {
      normalized.push({ ...entry });
      continue;
    }

    if (!seen.has(key)) {
      const copy = { ...entry };
      normalized.push(copy);
      seen.set(key, copy);
      continue;
    }

    const existing = seen.get(key);
    existing.since_version = selectEarliestVersion(existing.since_version, entry.since_version);
    if (!existing.note && entry.note) {
      existing.note = entry.note;
    }
  }

  return normalized;
}

module.exports = {
  normalizeCoauthors,
  normalizeAcknowledgments,
  _internal: {
    parseVersion,
    selectEarliestVersion,
  },
};
