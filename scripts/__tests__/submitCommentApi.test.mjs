import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequire } from "node:module";
import yaml from "js-yaml";

const require = createRequire(import.meta.url);

const ORIGINAL_FETCH = global.fetch;
const ORIGINAL_ENV = {
  COMMENTS_REPO: process.env.COMMENTS_REPO,
  COMMENTS_TOKEN: process.env.COMMENTS_TOKEN,
  COMMENTS_SITE_BASE: process.env.COMMENTS_SITE_BASE,
  COMMENTS_BASE_BRANCH: process.env.COMMENTS_BASE_BRANCH,
  GITHUB_REPOSITORY: process.env.GITHUB_REPOSITORY,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
};

function loadSubmitCommentApi() {
  const modulePath = require.resolve("../../api/submit-comment.js");
  delete require.cache[modulePath];
  return require("../../api/submit-comment.js");
}

function githubResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return payload ? JSON.stringify(payload) : "";
    },
  };
}

async function invokeNodeHandler(handler, req) {
  const res = {
    statusCode: 0,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
    end(body) {
      this.body = body;
      this.ended = true;
    },
    body: "",
    ended: false,
  };

  await handler(req, res);
  return res;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-12T12:00:00.000Z"));

  process.env.COMMENTS_REPO = "NNNvD/DUE";
  process.env.COMMENTS_TOKEN = "test-token";
  process.env.COMMENTS_SITE_BASE = "https://nnnvd.github.io/DUE";
  delete process.env.COMMENTS_BASE_BRANCH;
  delete process.env.GITHUB_REPOSITORY;
  delete process.env.GITHUB_TOKEN;
});

afterEach(() => {
  vi.useRealTimers();
  global.fetch = ORIGINAL_FETCH;

  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (typeof value === "undefined") {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("submit-comment API", () => {
  it("exports both node and netlify handlers", () => {
    const submitCommentApi = loadSubmitCommentApi();
    expect(typeof submitCommentApi).toBe("function");
    expect(typeof submitCommentApi.handler).toBe("function");
  });

  it("returns CORS preflight response for OPTIONS", async () => {
    const submitCommentApi = loadSubmitCommentApi();
    const headers = {};
    const res = {
      statusCode: 0,
      setHeader(key, value) {
        headers[key] = value;
      },
      end(body) {
        this.body = body;
      },
      body: undefined,
    };

    await submitCommentApi(
      {
        method: "OPTIONS",
        headers: {
          origin: "https://example.test",
          "access-control-request-method": "POST",
        },
      },
      res
    );

    expect(res.statusCode).toBe(204);
    expect(res.body).toBe("");
    expect(headers["Access-Control-Allow-Origin"]).toBe("*");
    expect(headers["Access-Control-Allow-Methods"]).toContain("POST");
    expect(headers["Access-Control-Allow-Headers"]).toContain("Content-Type");
  });

  it("returns CORS preflight response for OPTIONS in netlify mode", async () => {
    const submitCommentApi = loadSubmitCommentApi();
    const response = await submitCommentApi.handler({
      httpMethod: "OPTIONS",
      headers: {
        origin: "https://example.test",
        "access-control-request-method": "POST",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe("");
    expect(response.headers["Access-Control-Allow-Origin"]).toBe("*");
    expect(response.headers["Access-Control-Allow-Methods"]).toContain("POST");
    expect(response.headers["Access-Control-Allow-Headers"]).toContain("Content-Type");
  });

  it("accepts a valid JSON submission and writes the expected YAML payload to GitHub", async () => {
    const fetchCalls = [];
    global.fetch = vi.fn(async (url, options = {}) => {
      fetchCalls.push({ url, options });

      if (url === "https://api.github.com/repos/NNNvD/DUE") {
        return githubResponse(200, { default_branch: "main" });
      }

      if (String(url).startsWith("https://api.github.com/repos/NNNvD/DUE/contents/")) {
        return githubResponse(201, { content: { path: "data/comments/lorem-over-500/approved/file.yml" } });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    const submitCommentApi = loadSubmitCommentApi();
    const response = await submitCommentApi.handler({
      httpMethod: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Vitest Agent",
        referer: "https://example.test/form",
      },
      body: JSON.stringify({
        slug: "lorem-over-500",
        intent: "minor",
        name: "Local Tester",
        contact: "tester@example.com",
        comment: "Great piece! One broken link in section two.",
        essayTitle: "Lorem Ipsum Boundary Test",
        essayPath: "/essays/published/lorem-over-500/",
      }),
    });

    expect(response.statusCode).toBe(200);

    const parsed = JSON.parse(response.body);
    expect(parsed.success).toBe(true);
    expect(parsed.branch).toBe("main");
    expect(parsed.filePath).toMatch(
      /^data\/comments\/lorem-over-500\/approved\/2026-04-12T12-00-00-000Z-[a-z0-9]+\.yml$/
    );

    expect(fetchCalls).toHaveLength(2);
    expect(fetchCalls[0].options.headers.Authorization).toBe("Bearer test-token");

    const putCall = fetchCalls[1];
    expect(putCall.url).toContain("/repos/NNNvD/DUE/contents/data/comments/lorem-over-500/approved/");

    const commit = JSON.parse(putCall.options.body);
    expect(commit.message).toBe("Add minor comment for lorem-over-500");
    expect(commit.branch).toBe("main");

    const stored = yaml.load(Buffer.from(commit.content, "base64").toString("utf8"));
    expect(stored).toMatchObject({
      essay: "lorem-over-500",
      intent: "minor",
      name: "Local Tester",
      contact: "tester@example.com",
      comment: "Great piece! One broken link in section two.",
      essay_title: "Lorem Ipsum Boundary Test",
      essay_path: "/essays/published/lorem-over-500/",
      essay_url: "https://nnnvd.github.io/DUE/essays/published/lorem-over-500/",
      submitted_at: "2026-04-12T12:00:00.000Z",
      status: "pending",
      moderated_at: null,
      user_agent: "Vitest Agent",
      referrer: "https://example.test/form",
    });
  });

  it("accepts urlencoded form submissions through the node handler", async () => {
    const fetchCalls = [];
    global.fetch = vi.fn(async (url, options = {}) => {
      fetchCalls.push({ url, options });

      if (url === "https://api.github.com/repos/NNNvD/DUE") {
        return githubResponse(200, { default_branch: "main" });
      }

      if (String(url).startsWith("https://api.github.com/repos/NNNvD/DUE/contents/")) {
        return githubResponse(201, { ok: true });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    const submitCommentApi = loadSubmitCommentApi();
    const response = await invokeNodeHandler(submitCommentApi, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        "user-agent": "Node Handler Test",
      },
      body: new URLSearchParams({
        slug: "moratorium-on-box",
        intent: "major",
        name: "Form Poster",
        comment: "This argument is strong, but the closing needs a sharper distinction.",
        essayTitle: "Moratorium on Box",
        essayPath: "/essays/published/moratorium-on-box/",
        essayUrl: "https://custom.example/essays/moratorium-on-box/",
      }).toString(),
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).success).toBe(true);

    const commit = JSON.parse(fetchCalls[1].options.body);
    const stored = yaml.load(Buffer.from(commit.content, "base64").toString("utf8"));
    expect(stored).toMatchObject({
      essay: "moratorium-on-box",
      intent: "major",
      name: "Form Poster",
      essay_url: "https://custom.example/essays/moratorium-on-box/",
      user_agent: "Node Handler Test",
    });
  });

  it("rejects invalid submissions with helpful validation messages", async () => {
    const submitCommentApi = loadSubmitCommentApi();

    const response = await submitCommentApi.handler({
      httpMethod: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        slug: "",
        intent: "tiny",
        name: "",
        comment: "short",
        website: "bot-field",
      }),
    });

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      success: false,
      errors: [
        "Submission blocked.",
        "Missing essay identifier.",
        "Choose Minor or Major so we can route your note.",
        "Add your name or handle so we can attribute credit.",
        "A few more details will help us review your suggestion.",
      ],
    });
  });
});
