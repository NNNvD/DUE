#!/usr/bin/env node

const yaml = require("js-yaml");

const site = require("../site/_data/site.js");

function ensureLeadingSlash(value) {
  if (!value) return "/";
  return value.startsWith("/") ? value : `/${value}`;
}

function ensureTrailingSlash(value) {
  if (!value) return "/";
  return value.endsWith("/") ? value : `${value}/`;
}

function stripTrailingSlash(value) {
  if (!value) return "";
  return value.replace(/\/+$/u, "");
}

function encodePath(path = "") {
  return path
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

function inferRepo(repoUrl = "") {
  if (!repoUrl) return "";

  try {
    const parsed = new URL(repoUrl);
    const segments = parsed.pathname
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length >= 2) {
      return `${segments[0]}/${segments[1].replace(/\.git$/u, "")}`;
    }
  } catch (error) {
    const trimmed = String(repoUrl).replace(/^https?:\/\/[^/]+\//u, "");
    const segments = trimmed
      .split("/")
      .map((segment) => segment.trim())
      .filter(Boolean);

    if (segments.length >= 2) {
      return `${segments[0]}/${segments[1].replace(/\.git$/u, "")}`;
    }
  }

  return "";
}

function withSiteBasePath(siteUrl = "", path = "") {
  if (!path) return siteUrl;

  try {
    const candidate = new URL(path);
    return candidate.toString();
  } catch (error) {
    // Treat as a path below.
  }

  const parsed = new URL(siteUrl);
  const normalizedPath = ensureLeadingSlash(path.trim());
  const basePath = ensureTrailingSlash(parsed.pathname || "/");

  const finalPath = basePath === "/" || normalizedPath === basePath || normalizedPath.startsWith(basePath)
    ? normalizedPath
    : `${basePath.replace(/\/$/u, "")}${normalizedPath}`;

  return `${parsed.origin}${finalPath}`;
}

function toAbsoluteEndpoint(endpoint = "", siteUrl = "") {
  if (!endpoint) return "";

  try {
    return new URL(endpoint).toString();
  } catch (error) {
    if (!siteUrl) return endpoint;
  }

  try {
    const base = new URL(siteUrl);
    return new URL(endpoint, base.origin).toString();
  } catch (error) {
    return endpoint;
  }
}

function parseArgs(argv = process.argv.slice(2)) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;

    if (token === "--help" || token === "-h") {
      parsed.help = true;
      continue;
    }

    const raw = token.slice(2);
    const [key, inlineValue] = raw.split("=", 2);
    if (typeof inlineValue !== "undefined") {
      parsed[key] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

function defaultEssayPath(slug, siteData = site) {
  const basePath = ensureTrailingSlash(siteData.baseUrl || "/");
  if (basePath === "/") {
    return `/essays/published/${slug}/`;
  }
  return `${basePath}essays/published/${slug}/`;
}

function buildConfig(args = {}, env = process.env, siteData = site) {
  const siteUrl =
    args["site-url"] ||
    env.COMMENTS_VERIFY_SITE_URL ||
    env.SITE_URL ||
    env.URL ||
    siteData.siteUrl;

  const endpoint = toAbsoluteEndpoint(
    args.endpoint ||
      env.COMMENTS_VERIFY_ENDPOINT ||
      env.COMMENTS_ENDPOINT ||
      siteData.comments?.endpoint ||
      "",
    siteUrl
  );

  const repo =
    args.repo ||
    env.COMMENTS_VERIFY_REPO ||
    env.COMMENTS_REPO ||
    env.GITHUB_REPOSITORY ||
    inferRepo(siteData.repoUrl);

  const token =
    args.token ||
    env.COMMENTS_VERIFY_TOKEN ||
    env.COMMENTS_TOKEN ||
    env.GITHUB_TOKEN ||
    "";

  const slug = args.slug || env.COMMENTS_VERIFY_SLUG || "drafty-draft";
  const essayPath =
    args["essay-path"] ||
    env.COMMENTS_VERIFY_ESSAY_PATH ||
    defaultEssayPath(slug, siteData);
  const essayUrl = withSiteBasePath(
    siteUrl,
    args["essay-url"] || env.COMMENTS_VERIFY_ESSAY_URL || essayPath
  );

  const nowIso = new Date().toISOString();
  const intent = args.intent || env.COMMENTS_VERIFY_INTENT || "minor";
  const name = args.name || env.COMMENTS_VERIFY_NAME || "Live Intake Verification";
  const contact = args.contact || env.COMMENTS_VERIFY_CONTACT || "";
  const comment =
    args.comment ||
    env.COMMENTS_VERIFY_COMMENT ||
    `Live verification submitted at ${nowIso}. Please moderate or remove after confirming the comment pipeline.`;
  const essayTitle =
    args["essay-title"] ||
    env.COMMENTS_VERIFY_ESSAY_TITLE ||
    `Live verification for ${slug}`;

  return {
    endpoint,
    repo,
    token,
    slug,
    intent,
    name,
    contact,
    comment,
    essayTitle,
    essayPath,
    essayUrl,
    branch: args.branch || env.COMMENTS_VERIFY_BRANCH || "",
    skipGithubCheck: Boolean(args["skip-github-check"]),
  };
}

function buildPayload(config = {}) {
  return {
    slug: config.slug,
    intent: config.intent,
    name: config.name,
    contact: config.contact,
    comment: config.comment,
    essayTitle: config.essayTitle,
    essayPath: config.essayPath,
    essayUrl: config.essayUrl,
  };
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (error) {
    return { raw: text };
  }
}

async function submitComment(config = {}) {
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "due-live-comment-verifier",
    },
    body: JSON.stringify(buildPayload(config)),
  });

  const data = await readJsonResponse(response);

  if (!response.ok || !data.success) {
    const message =
      data.message ||
      (Array.isArray(data.errors) ? data.errors.join(" ") : "") ||
      `Request failed with status ${response.status}.`;
    const error = new Error(message);
    error.statusCode = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

async function fetchCommittedFile(config = {}, submission = {}) {
  if (config.skipGithubCheck) {
    return { checked: false, reason: "GitHub verification skipped." };
  }

  if (!config.repo || !submission.filePath) {
    return { checked: false, reason: "Missing repo or file path for GitHub verification." };
  }

  const branch = submission.branch || config.branch || "main";
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "due-live-comment-verifier",
  };

  if (config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }

  const response = await fetch(
    `https://api.github.com/repos/${config.repo}/contents/${encodePath(submission.filePath)}?ref=${encodeURIComponent(branch)}`,
    { headers }
  );

  const data = await readJsonResponse(response);
  if (!response.ok || !data.content) {
    return {
      checked: true,
      verified: false,
      branch,
      fileUrl: `https://github.com/${config.repo}/blob/${branch}/${submission.filePath}`,
      reason: data.message || `GitHub fetch failed with status ${response.status}.`,
    };
  }

  const decoded = Buffer.from(data.content, "base64").toString("utf8");
  const parsed = yaml.load(decoded);

  const verified = Boolean(
    parsed &&
      parsed.essay === config.slug &&
      parsed.intent === config.intent &&
      parsed.name === config.name &&
      parsed.comment === config.comment &&
      parsed.status === "pending"
  );

  return {
    checked: true,
    verified,
    branch,
    fileUrl: `https://github.com/${config.repo}/blob/${branch}/${submission.filePath}`,
    data: parsed,
    reason: verified ? "" : "Stored YAML did not match the submitted payload.",
  };
}

function printHelp() {
  console.log(`Usage: npm run verify:comments-live -- [options]

Options:
  --endpoint <url>        Absolute or site-relative submit endpoint.
  --site-url <url>        Deployed site URL used to build the essay URL.
  --repo <owner/repo>     GitHub repo used to fetch the committed comment file.
  --token <token>         Optional GitHub token for reading the committed file.
  --slug <slug>           Essay slug to target. Defaults to drafty-draft.
  --essay-path <path>     Essay path stored in the comment payload.
  --essay-url <url>       Full essay URL stored in the comment payload.
  --essay-title <title>   Essay title stored in the comment payload.
  --intent <minor|major>  Feedback intent. Defaults to minor.
  --name <value>          Comment author shown in the stored YAML.
  --contact <value>       Optional contact field.
  --comment <value>       Comment body to submit.
  --branch <name>         Expected branch when fetching the committed file.
  --skip-github-check     Skip the GitHub contents fetch after submission.

Environment fallbacks:
  COMMENTS_VERIFY_ENDPOINT, COMMENTS_VERIFY_SITE_URL, COMMENTS_VERIFY_REPO,
  COMMENTS_VERIFY_TOKEN, COMMENTS_VERIFY_SLUG, COMMENTS_VERIFY_ESSAY_PATH,
  COMMENTS_VERIFY_ESSAY_URL, COMMENTS_VERIFY_ESSAY_TITLE, COMMENTS_VERIFY_INTENT,
  COMMENTS_VERIFY_NAME, COMMENTS_VERIFY_CONTACT, COMMENTS_VERIFY_COMMENT,
  COMMENTS_VERIFY_BRANCH
`);
}

async function main() {
  const args = parseArgs();
  if (args.help) {
    printHelp();
    return;
  }

  const config = buildConfig(args);

  if (!config.endpoint || !/^https?:\/\//u.test(config.endpoint)) {
    throw new Error(
      "Missing absolute verification endpoint. Set COMMENTS_VERIFY_ENDPOINT or pass --endpoint."
    );
  }

  console.log(`Submitting verification comment to ${config.endpoint}`);
  console.log(`Essay slug: ${config.slug}`);
  console.log(`Essay URL: ${config.essayUrl}`);

  const submission = await submitComment(config);
  console.log(`Submission accepted: ${submission.message}`);
  console.log(`Created file: ${submission.filePath}`);

  const fileCheck = await fetchCommittedFile(config, submission);
  if (!fileCheck.checked) {
    console.log(`GitHub verification skipped: ${fileCheck.reason}`);
  } else if (fileCheck.verified) {
    console.log(`GitHub file verified: ${fileCheck.fileUrl}`);
  } else {
    console.log(`GitHub file could not be fully verified: ${fileCheck.reason}`);
    if (fileCheck.fileUrl) {
      console.log(`Inspect manually: ${fileCheck.fileUrl}`);
    }
  }

  console.log("");
  console.log("Next manual checks:");
  console.log(`1. Open ${config.essayUrl} after the next deploy and confirm the new comment appears as Unmoderated.`);
  console.log("2. Update the stored YAML to approved, implemented, or rejected and confirm the status chip changes on rebuild.");
  console.log("3. Reject or remove the verification comment after the pipeline has been confirmed.");
}

module.exports = {
  buildConfig,
  buildPayload,
  inferRepo,
  parseArgs,
  toAbsoluteEndpoint,
  withSiteBasePath,
  fetchCommittedFile,
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
  });
}
