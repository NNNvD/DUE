function normalizeVersion(raw, initialStatus) {
  const asString = raw === undefined || raw === null ? "" : String(raw);
  const parts = asString
    .split(".")
    .map((part) => parseInt(part, 10))
    .filter((part) => Number.isFinite(part));

  if (!parts.length) {
    return initialStatus === "complete" ? "1.0.0" : "0.1.0";
  }

  while (parts.length < 3) {
    parts.push(0);
  }

  return parts.slice(0, 3).join(".");
}

function bumpVersion(version, intent) {
  const normalized = normalizeVersion(version);
  const [major, minor, patch] = normalized.split(".").map((part) => parseInt(part, 10));
  const safeMajor = Number.isFinite(major) ? major : 0;
  const safeMinor = Number.isFinite(minor) ? minor : 0;
  const safePatch = Number.isFinite(patch) ? patch : 0;

  if (intent === "major") {
    return `${safeMajor + 1}.0.0`;
  }

  if (intent === "minor") {
    return `${safeMajor}.${safeMinor + 1}.0`;
  }

  return `${safeMajor}.${safeMinor}.${safePatch + 1}`;
}

module.exports = {
  normalizeVersion,
  bumpVersion,
};
