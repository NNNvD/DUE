#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const fg = require("fast-glob");
const matter = require("gray-matter");
const Ajv = require("ajv");

const schemaPath = path.join(__dirname, "schema", "essay-frontmatter.json");
const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

const ajv = new Ajv({
  allErrors: true,
  strict: false
});

const validate = ajv.compile(schema);

function pointerToPath(pointer = "") {
  if (!pointer) return "";
  return pointer
    .slice(1)
    .split("/")
    .map(part => part.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce((acc, segment) => {
      if (!segment.length) return acc;
      if (/^\d+$/.test(segment)) {
        return acc + `[${segment}]`;
      }
      return acc ? `${acc}.${segment}` : segment;
    }, "");
}

function formatError(error) {
  const path = pointerToPath(error.instancePath);
  const location = path ? `${path}: ` : "";

  switch (error.keyword) {
    case "required":
      return `${location}Missing required property '${error.params.missingProperty}'.`;
    case "additionalProperties":
      return `${location}Unexpected property '${error.params.additionalProperty}'.`;
    case "enum":
      return `${location}Invalid value. Allowed: ${error.params.allowedValues.join(", ")}.`;
    default:
      return `${location}${error.message}`;
  }
}

async function main() {
  const files = await fg(["site/essays/**/*.md"], {
    dot: false
  });

  if (!files.length) {
    console.log("No essays found to validate.");
    return;
  }

  let hasErrors = false;

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const doc = matter(raw);
    const data = doc.data || {};

    if (!Object.keys(data).length) {
      hasErrors = true;
      console.error(`\n${file}`);
      console.error("  - Missing front matter or front matter is empty.");
      continue;
    }

    const valid = validate(data);

    if (!valid) {
      hasErrors = true;
      const errors = validate.errors || [];
      console.error(`\n${file}`);
      errors.forEach(err => {
        console.error(`  - ${formatError(err)}`);
      });
    }
  }

  if (hasErrors) {
    console.error("\nFront matter validation failed.");
    process.exit(1);
  }

  console.log("Front matter looks good.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
