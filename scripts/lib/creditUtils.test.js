const assert = require("assert");

const { normalizeCoauthors, normalizeAcknowledgments, _internal } = require("./creditUtils");

// Coauthors normalization removes duplicates and trims names.
const coauthors = normalizeCoauthors(["alice", "bob", " alice ", "bob", 42, ""]);
assert.deepStrictEqual(coauthors, ["alice", "bob"]);

// Acknowledgments normalization keeps earliest since_version for duplicate users.
const acknowledgments = normalizeAcknowledgments([
  { user: "carol", note: "Original", since_version: "1.2" },
  { user: "carol", note: "Minor contribution", since_version: "1.3" },
]);
assert.strictEqual(acknowledgments.length, 1);
assert.strictEqual(acknowledgments[0].since_version, "1.2");
assert.strictEqual(acknowledgments[0].note, "Original");

// Acknowledgments without parseable versions fall back to existing value.
const messy = normalizeAcknowledgments([
  { user: "dave", note: "First", since_version: "abc" },
  { user: "dave", note: "", since_version: "0.1" },
]);
assert.strictEqual(messy.length, 1);
assert.strictEqual(messy[0].since_version, "0.1");
assert.strictEqual(messy[0].note, "First");

const fillNote = normalizeAcknowledgments([
  { user: "erin", note: "", since_version: "1.0" },
  { user: "erin", note: "Minor contribution", since_version: "1.1" },
]);
assert.strictEqual(fillNote.length, 1);
assert.strictEqual(fillNote[0].note, "Minor contribution");

// Internal helpers: selectEarliestVersion should prefer lower versions.
const { selectEarliestVersion } = _internal;
assert.strictEqual(selectEarliestVersion("1.2", "1.3"), "1.2");
assert.strictEqual(selectEarliestVersion("2.0", "1.5"), "1.5");

console.log("creditUtils tests passed");
