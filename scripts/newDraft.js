#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const readline = require("node:readline");
const yaml = require("js-yaml");
const dayjs = require("dayjs");

const draftsDir = path.join(__dirname, "..", "site", "essays", "drafts");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question, { defaultValue, required = false, validate } = {}) {
  const suffix = defaultValue ? ` [${defaultValue}]` : "";
  const prompt = `${question}${suffix}: `;

  return new Promise(resolve => {
    const query = () => {
      rl.question(prompt, answer => {
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

function ensureUniqueSlug(baseSlug) {
  let candidate = baseSlug;
  let counter = 1;
  while (fs.existsSync(path.join(draftsDir, `${candidate}.md`))) {
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
  return candidate;
}

async function main() {
  console.log("\nCreate a new draft\n===================\n");

  const title = await ask("Title", { required: true });
  const topic = await ask("Topic", { required: true });

  const keywordsRaw = await ask("Keywords (comma-separated, up to 5)", {
    required: false,
    validate: value => {
      if (!value) return true;
      const entries = value.split(",").map(item => item.trim()).filter(Boolean);
      if (entries.length > 5) return "Please provide 5 or fewer keywords.";
      return true;
    },
  });
  const keywords = keywordsRaw
    ? keywordsRaw.split(",").map(entry => entry.trim()).filter(Boolean).slice(0, 5)
    : [];

  const defaultAuthor = process.env.GIT_AUTHOR_NAME || process.env.USER || "";
  const author = await ask("Author", { required: true, defaultValue: defaultAuthor });

  const startedAt = dayjs().format("YYYY-MM-DD");
  const deadlineAt = dayjs().add(30, "day").format("YYYY-MM-DD");
  const initialStatus = "unfinished";

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

  const finalSlug = ensureUniqueSlug(slug);
  if (finalSlug !== slug) {
    console.log(`Slug '${slug}' already exists. Using '${finalSlug}' instead.`);
  }

  const normalizedStatus = "proposed";
  const version = "0.1.0";
  const wordRange = "500-1000";
  const frontMatter = {
    title,
    topic,
    keywords,
    author,
    coauthors: [],
    acknowledgments: [],
    status: normalizedStatus,
    started_at: startedAt,
    proposed_at: dayjs().format("YYYY-MM-DD"),
    deadline_at: deadlineAt,
    initial_status: initialStatus,
    version,
    word_range: wordRange,
    word_count: 0,
    release_notes: [],
  };

  const fmString = yaml.dump(frontMatter, {
    lineWidth: 1000,
    noRefs: true,
  }).trim();

  const contents = `---\n${fmString}\n---\n\n`; // leave body empty for now

  fs.ensureDirSync(draftsDir);
  const filePath = path.join(draftsDir, `${finalSlug}.md`);
  fs.writeFileSync(filePath, contents, "utf8");

  console.log(`\nDraft created: site/essays/drafts/${finalSlug}.md`);
  rl.close();
}

rl.on("SIGINT", () => {
  console.log("\nAborted.");
  rl.close();
  process.exit(1);
});

main().catch(error => {
  console.error(error);
  rl.close();
  process.exit(1);
});
