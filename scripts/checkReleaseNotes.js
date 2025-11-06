const fs = require('fs');

const PLACEHOLDER_REGEX = /^(?:tbd|to be determined|todo|pending|n\/a|na|none|no release notes)$/i;

function isPlaceholder(text) {
  return PLACEHOLDER_REGEX.test(text.trim());
}

function stripCheckbox(text) {
  return text.replace(/^\[[ xX]\]\s*/, '');
}

function hasReleaseNotesInBody(body) {
  if (!body) {
    return false;
  }

  const match = body.match(/##+\s*Release notes([\s\S]*)/i);
  if (!match) {
    return false;
  }

  const remainder = match[1];
  const headingMatch = remainder.match(/\n##+\s+/);
  const section = headingMatch ? remainder.slice(0, headingMatch.index) : remainder;
  const lines = section.split(/\r?\n/);

  for (const line of lines) {
    let text = line.trim();
    if (!text || text.startsWith('<!--') || /^>/.test(text) || /^##+\s*/.test(text)) {
      continue;
    }

    if (/^(-|\*|\d+\.)\s+/.test(text)) {
      text = text.replace(/^(-|\*|\d+\.)\s+/, '');
    }

    text = stripCheckbox(text).trim();

    if (!text || isPlaceholder(text)) {
      continue;
    }

    return true;
  }

  return false;
}

function normalizeInlineValue(value) {
  return value
    .replace(/^\[\s*/, '')
    .replace(/\s*\]$/, '')
    .replace(/["']/g, '')
    .trim();
}

function patchHasReleaseNotes(patch) {
  if (!patch) {
    return false;
  }

  const lines = patch.split('\n');
  let inReleaseNotesBlock = false;

  for (const rawLine of lines) {
    if (rawLine.startsWith('@@')) {
      inReleaseNotesBlock = false;
      continue;
    }

    if (!rawLine.startsWith('+') || rawLine.startsWith('+++')) {
      continue;
    }

    const line = rawLine.slice(1);
    const trimmed = line.trim();

    if (!inReleaseNotesBlock) {
      const match = trimmed.match(/^release_notes:\s*(.*)$/i);
      if (match) {
        const value = match[1].trim();
        if (value && !/^\[\s*\]$/.test(value)) {
          const normalized = normalizeInlineValue(value);
          if (normalized && /[A-Za-z0-9]/.test(normalized) && !isPlaceholder(normalized)) {
            return true;
          }
        } else {
          inReleaseNotesBlock = true;
        }
        continue;
      }
    } else {
      if (!trimmed) {
        continue;
      }

      if (/^[A-Za-z0-9_."'-]+\s*:/.test(trimmed) && !trimmed.startsWith('-')) {
        inReleaseNotesBlock = false;
        continue;
      }

      if (trimmed.startsWith('-')) {
        let text = trimmed.slice(1).trim();
        text = stripCheckbox(text).trim();
        if (text && !isPlaceholder(text)) {
          return true;
        }
      }
    }
  }

  return false;
}

async function hasReleaseNotesInFiles(event, token) {
  const pr = event.pull_request;
  const [owner, repo] = event.repository.full_name.split('/');
  let page = 1;

  while (true) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pr.number}/files?per_page=100&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    );

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Failed to load pull request files (status ${response.status}): ${details}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return false;
    }

    for (const file of data) {
      if (file.status === 'removed' || !file.patch) {
        continue;
      }

      if (patchHasReleaseNotes(file.patch)) {
        return true;
      }
    }

    if (data.length < 100) {
      return false;
    }

    page += 1;
  }
}

async function main() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) {
    console.log('No event payload found; skipping release note validation.');
    return;
  }

  const event = JSON.parse(fs.readFileSync(eventPath, 'utf8'));
  const pr = event.pull_request;

  if (!pr) {
    console.log('This workflow run is not associated with a pull request; skipping release note validation.');
    return;
  }

  const labels = (pr.labels || []).map(label => (label.name || '').toLowerCase());
  const needsReleaseNotes = labels.some(name => name === 'minor' || name === 'major');

  if (!needsReleaseNotes) {
    console.log('Release notes not required because neither the minor nor major label is applied.');
    return;
  }

  if (hasReleaseNotesInBody(pr.body || '')) {
    console.log('Release notes detected in the pull request body.');
    return;
  }

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    const foundInFiles = await hasReleaseNotesInFiles(event, token);
    if (foundInFiles) {
      console.log('Release notes detected in modified files.');
      return;
    }
  } else {
    console.warn('GITHUB_TOKEN is not available; unable to inspect modified files for release notes.');
  }

  console.error(
    'This PR is labeled "minor" or "major" but no release notes were found. ' +
      'Add at least one release note under the "## Release notes" heading in the PR body, ' +
      'or update the `release_notes` front matter in the files you changed.'
  );
  process.exit(1);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
