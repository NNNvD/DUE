const oauthBase =
  process.env.DECAP_OAUTH_BASE ||
  // Allow GitHub Actions repository variables to flow through if a secret is not set.
  process.env.GITHUB_PAGES_DECAP_OAUTH_BASE ||
  "";

module.exports = {
  oauth_base: oauthBase,
};
