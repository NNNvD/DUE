const fs = require("fs");
const http = require("http");
const path = require("path");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
};

function normalizePrefix(value) {
  const raw = String(value || "/").trim() || "/";
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

function safeStat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch (error) {
    return null;
  }
}

function resolveCandidate(rootDir, requestPath) {
  const cleanPath = requestPath.replace(/^\/+/u, "");
  const candidate = path.resolve(rootDir, cleanPath);

  if (!candidate.startsWith(rootDir)) {
    return null;
  }

  const directStat = safeStat(candidate);
  if (directStat?.isFile()) {
    return candidate;
  }

  if (directStat?.isDirectory()) {
    const indexPath = path.join(candidate, "index.html");
    if (safeStat(indexPath)?.isFile()) {
      return indexPath;
    }
  }

  if (!path.extname(candidate)) {
    const htmlPath = `${candidate}.html`;
    if (safeStat(htmlPath)?.isFile()) {
      return htmlPath;
    }
  }

  return null;
}

function sendResponse(response, statusCode, headers, body) {
  response.writeHead(statusCode, headers);
  if (body) {
    response.end(body);
    return;
  }
  response.end();
}

const rootDir = path.resolve(process.env.STATIC_ROOT || path.join(process.cwd(), "_site"));
const pathPrefix = normalizePrefix(process.env.SERVE_PATH_PREFIX || "/DUE/");
const port = Number.parseInt(process.env.PORT || "4173", 10);

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);
  const pathname = decodeURIComponent(requestUrl.pathname);
  const method = request.method || "GET";

  if (!["GET", "HEAD"].includes(method)) {
    sendResponse(response, 405, { "Content-Type": "text/plain; charset=utf-8" }, "Method not allowed");
    return;
  }

  const barePrefix = pathPrefix.replace(/\/$/u, "");
  if (pathname === "/" || pathname === barePrefix) {
    sendResponse(response, 302, { Location: pathPrefix }, "");
    return;
  }

  if (!pathname.startsWith(pathPrefix)) {
    sendResponse(response, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not found");
    return;
  }

  let relativePath = pathname.slice(pathPrefix.length);
  if (!relativePath || relativePath.endsWith("/")) {
    relativePath = `${relativePath}index.html`;
  }

  const resolvedFile = resolveCandidate(rootDir, relativePath);
  if (!resolvedFile) {
    const notFoundPage = resolveCandidate(rootDir, "404.html");
    if (notFoundPage) {
      const body = method === "HEAD" ? "" : fs.readFileSync(notFoundPage);
      sendResponse(
        response,
        404,
        { "Content-Type": MIME_TYPES[".html"], "Content-Length": method === "HEAD" ? 0 : body.length },
        body
      );
      return;
    }

    sendResponse(response, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not found");
    return;
  }

  const extension = path.extname(resolvedFile).toLowerCase();
  const contentType = MIME_TYPES[extension] || "application/octet-stream";
  const body = method === "HEAD" ? "" : fs.readFileSync(resolvedFile);

  sendResponse(
    response,
    200,
    { "Content-Type": contentType, "Content-Length": method === "HEAD" ? 0 : body.length },
    body
  );
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Serving ${rootDir} at http://127.0.0.1:${port}${pathPrefix}`);
});
