import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const submitCommentApi = require("../../api/submit-comment.js");

describe("submit-comment API", () => {
  it("returns CORS preflight response for OPTIONS", async () => {
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
});
