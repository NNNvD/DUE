import commentIntakeCore from "../../../api/commentIntakeCore.js";

const { handleCommentEvent } = commentIntakeCore;

function runtimeConfig(env = {}) {
  return {
    commentDir: env.COMMENTS_DIR || "data/comments",
    maxCommentLength: Number(env.COMMENTS_MAX_LENGTH || 4000),
    siteBase: env.COMMENTS_SITE_BASE || "",
    repoConfig: env.COMMENTS_REPO || "",
    token: env.COMMENTS_TOKEN || "",
    baseBranch: env.COMMENTS_BASE_BRANCH || "",
    fetchImpl: fetch,
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!["/", "/api/submit-comment"].includes(url.pathname)) {
      return new Response("Not found", { status: 404 });
    }

    const body = request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS"
      ? ""
      : await request.text();

    const response = await handleCommentEvent(
      {
        httpMethod: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body,
        isBase64Encoded: false,
      },
      runtimeConfig(env)
    );

    return new Response(response.body, {
      status: response.statusCode,
      headers: response.headers,
    });
  },
};
