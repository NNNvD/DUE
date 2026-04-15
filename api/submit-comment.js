const {
  getHeader,
  handleCommentEvent,
} = require("./commentIntakeCore");

function runtimeConfig() {
  return {
    commentDir: process.env.COMMENTS_DIR || "data/comments",
    maxCommentLength: Number(process.env.COMMENTS_MAX_LENGTH || 4000),
    siteBase: process.env.COMMENTS_SITE_BASE || "",
    repoConfig: process.env.COMMENTS_REPO || process.env.GITHUB_REPOSITORY || "",
    token: process.env.COMMENTS_TOKEN || process.env.GITHUB_TOKEN || "",
    baseBranch: process.env.COMMENTS_BASE_BRANCH || "",
    fetchImpl: global.fetch,
  };
}

async function nodeHandler(req, res) {
  const headers = req.headers || {};
  const method = req.method || "GET";
  let rawBody = "";

  if (typeof req.body === "string") {
    rawBody = req.body;
  } else if (req.body && Object.keys(req.body).length) {
    rawBody = JSON.stringify(req.body);
    if (!getHeader(headers, "content-type")) {
      headers["content-type"] = "application/json";
    }
  }

  const event = {
    httpMethod: method,
    headers,
    body: rawBody,
    isBase64Encoded: false,
  };

  const response = await handleCommentEvent(event, runtimeConfig());
  res.statusCode = response.statusCode;
  Object.entries(response.headers || {}).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  res.end(response.body);
}

async function netlifyHandler(event) {
  return handleCommentEvent(event, runtimeConfig());
}

module.exports = nodeHandler;
module.exports.handler = netlifyHandler;
