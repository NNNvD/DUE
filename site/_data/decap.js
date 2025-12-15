const sources = [
  { key: "DECAP_OAUTH_BASE", value: process.env.DECAP_OAUTH_BASE },
  // Allow GitHub Actions repository variables to flow through if a secret is not set.
  { key: "GITHUB_PAGES_DECAP_OAUTH_BASE", value: process.env.GITHUB_PAGES_DECAP_OAUTH_BASE },
  // Optional local overrides for debugging (e.g., ELEVENTY_DECAP_OAUTH_BASE in a .env file).
  { key: "ELEVENTY_DECAP_OAUTH_BASE", value: process.env.ELEVENTY_DECAP_OAUTH_BASE },
];

const found = sources.find((entry) => entry.value);
const oauthBase = found?.value || "";

if (!oauthBase) {
  console.warn(
    "Legacy Decap OAuth base is empty. Set DECAP_OAUTH_BASE (or ELEVENTY_DECAP_OAUTH_BASE) only if you need the /api/auth rollback page."
  );
}

module.exports = {
  oauth_base: oauthBase,
};
