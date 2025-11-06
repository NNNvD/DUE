const WORD_RANGE_ENUM = {
  "250-500": { min: 250, max: 500 },
  "500-1000": { min: 500, max: 1000 },
  "1000-1500": { min: 1000, max: 1500 }
};

const DEFAULT_WORD_RANGE = "500-1000";

function normalizeWordRange(value) {
  if (value === undefined || value === null) return DEFAULT_WORD_RANGE;
  const normalized = String(value).trim();
  return normalized || DEFAULT_WORD_RANGE;
}

function getWordRangeSpec(value) {
  const normalized = normalizeWordRange(value);
  const spec = WORD_RANGE_ENUM[normalized];
  if (!spec) {
    const allowed = Object.keys(WORD_RANGE_ENUM).join(", ");
    const display = (value === undefined || value === null || value === "")
      ? "(missing)"
      : JSON.stringify(value);
    throw new Error(`invalid word_range ${display}; expected one of: ${allowed}`);
  }
  return { ...spec, id: normalized };
}

function rangeBoundsWithGrace(value, gracePercent = 0.02) {
  const spec = getWordRangeSpec(value);
  const grace = Math.ceil(spec.max * gracePercent);
  return {
    id: spec.id,
    min: spec.min,
    max: spec.max + grace
  };
}

module.exports = {
  DEFAULT_WORD_RANGE,
  WORD_RANGE_ENUM,
  normalizeWordRange,
  getWordRangeSpec,
  rangeBoundsWithGrace
};
