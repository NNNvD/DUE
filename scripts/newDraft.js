#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const readline = require("node:readline");
const yaml = require("js-yaml");
const dayjs = require("dayjs");

const draftsDir = path.join(__dirname, "..", "site", "essays", "drafts");

let rl;

function getReadline() {
  if (!rl) {
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }
  return rl;
}

function ask(question, { defaultValue, required = false, validate } = {}) {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const prompt = `${question}${suffix}: `;

  return new Promise(resolve => {
    const query = () => {
      getReadline().question(prompt, answer => {
        const trimmed = answer.trim();
        const value = trimmed || defaultValue || "";

        if (required && !value) {
          console.log("This field is required.\n");
          return query();
        }

        if (validate) {
          const result = validate(value);
          if (result !== true) {
            console.log(`${result}\n`);
            return query();
          }
        }

        resolve(value);
      });
    };

    query();
  });
}

function slugify(input) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .replace(/--+/g, "-");
}

function ensureUniqueSlug(baseSlug, targetDraftsDir = draftsDir) {
  let candidate = baseSlug;
  let counter = 1;
  while (fs.existsSync(path.join(targetDraftsDir, `${candidate}.md`))) {
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
  return candidate;
}

function createDraft({
  title,
  keywords = [],
  author,
  slug,
  now = dayjs(),
  targetDraftsDir = draftsDir,
} = {}) {
  if (!title) {
    throw new Error("title is required");
  }

  if (!author) {
    throw new Error("author is required");
  }

  const baseSlug = slug || slugify(title);
  if (!baseSlug) {
    throw new Error("slug is required");
  }

  if (!/^[a-z0-9-]+$/.test(baseSlug)) {
    throw new Error("slug may only contain lowercase letters, numbers, and hyphens");
  }

  const createdAt = dayjs(now);
  const startedAt = createdAt.format("YYYY-MM-DD");
  const finalSlug = ensureUniqueSlug(baseSlug, targetDraftsDir);
  const normalizedKeywords = Array.isArray(keywords)
    ? keywords.map(entry => String(entry).trim()).filter(Boolean)
    : [];

  const frontMatter = {
    title,
    keywords: normalizedKeywords,
    author,
    coauthors: [],
    acknowledgments: [],
    status: "proposed",
    started_at: startedAt,
    proposed_at: startedAt,
    deadline_at: createdAt.add(30, "day").format("YYYY-MM-DD"),
    initial_status: "unfinished",
    version: "0.1.0",
    word_range: "500-1000",
    word_count: 0,
    release_notes: [],
  };

  const fmString = yaml.dump(frontMatter, {
    lineWidth: 1000,
    noRefs: true,
  }).trim();

  const contents = `---\n${fmString}\n---\n\n`; // leave body empty for now

  fs.ensureDirSync(targetDraftsDir);
  const filePath = path.join(targetDraftsDir, `${finalSlug}.md`);
  fs.writeFileSync(filePath, contents, "utf8");

  return {
    slug: finalSlug,
    filePath,
    frontMatter,
  };
}

async function main() {
  console.log("\nCreate a new draft\n===================\n");

  const title = await ask("Title", { required: true });
  const keywordsRaw = await ask("Keywords (comma-separated)", { required: false });
  const keywords = keywordsRaw
    ? keywordsRaw.split(",").map(entry => entry.trim()).filter(Boolean)
    : [];

  const defaultAuthor = process.env.GIT_AUTHOR_NAME || process.env.USER || "";
  const author = await ask("Author", { required: true, defaultValue: defaultAuthor });

  const baseSlug = slugify(title);
  const slug = await ask("Slug", {
    defaultValue: baseSlug,
    required: true,
    validate: value => {
      if (!value) return "Slug cannot be empty.";
      if (!/^[a-z0-9-]+$/.test(value)) {
        return "Slug may only contain lowercase letters, numbers, and hyphens.";
      }
      return true;
    },
  });

  const draft = createDraft({
    title,
    keywords,
    author,
    slug,
  });
  const finalSlug = draft.slug;
  if (finalSlug !== slug) {
    console.log(`Slug '${slug}' already exists. Using '${finalSlug}' instead.`);
  }

  console.log(`\nDraft created: site/essays/drafts/${finalSlug}.md`);
  getReadline().close();
}

if (require.main === module) {
  getReadline().on("SIGINT", () => {
    console.log("\nAborted.");
    getReadline().close();
    process.exit(1);
  });

  main().catch(error => {
    console.error(error);
    getReadline().close();
    process.exit(1);
  });
}

module.exports = {
  createDraft,
  ensureUniqueSlug,
  slugify,
};
