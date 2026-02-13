# DUE classification system proposal

## Why change now

The current model works for a small catalog, but it mixes **storage state** (draft/published folders), **editorial state** (`status`, `initial_status`, `version`), and **derived display state** (`time_status`, length bins, badge copy) across multiple layers.

As DUE grows, this creates three risks:

1. Inconsistent classification across backend scripts and frontend filters.
2. Harder analytics/reporting because lifecycle data is inferred rather than normalized.
3. UI filtering that reflects available strings (keywords/authors) more than editorial intent.

## Target architecture

### 1) Backend: separate identity, lifecycle, and taxonomy

Keep Markdown as source of truth, but normalize each essay into three conceptual blocks when building `essayIndex`:

- `identity`: stable identifiers and ownership.
- `lifecycle`: where the piece is in DUE's time/version process.
- `taxonomy`: how the piece should be discoverable.

Suggested normalized shape:

```json
{
  "id": "published-on-deadlines-and-honesty",
  "slug": "on-deadlines-and-honesty",
  "identity": {
    "author": "noahvandongen",
    "contributors": ["coauthorA", "editorB"]
  },
  "lifecycle": {
    "workflow_state": "published",
    "outcome_state": "unfinished-on-time",
    "phase": "initial-release",
    "started_at": "2025-11-06",
    "deadline_at": "2025-12-06",
    "published_at": "2025-12-06",
    "version": "0.1.0"
  },
  "taxonomy": {
    "topic": "time pressure clarity",
    "themes": ["deadlines", "honesty", "iteration"],
    "length_bucket": "tiny"
  },
  "metrics": {
    "word_count": 286
  }
}
```

### 2) Controlled vocabulary for discoverability

Move from free-form `keywords` to:

- `themes` (controlled set, multi-select, max 5)
- `topic` (short free text, still max 5 words)

Keep backward compatibility by mapping old `keywords` into `themes` during migration.

Suggested starter theme set:

- `deadlines`
- `iteration`
- `publishing`
- `collaboration`
- `quality`
- `process`
- `scope`
- `authorship`
- `feedback`
- `revision`

### 3) Explicit lifecycle facets

Treat lifecycle as first-class classification:

- `workflow_state`: `proposed | draft | published`
- `outcome_state`: `draft | finished-on-time | unfinished-on-time`
- `phase`: `proposal | in-progress | initial-release | post-release-revision`

`phase` is what readers usually mean when browsing DUE: “What is still forming?” vs “What has already gone through at least one iteration?”

### 4) Frontend facet model

Use facet groups that mirror DUE's purpose:

1. **Lifecycle**: Drafting, Initial release, Revised release
2. **Outcome**: Finished on time, Unfinished on time
3. **Length**: Tiny, Minute, Short
4. **Themes**: controlled vocabulary chips
5. **People**: author + contributors

This makes discovery less dependent on inconsistent text values and more aligned with DUE's deadline/iteration identity.

## Minimal schema updates

Front matter (new/adjusted fields):

```yaml
status: draft                    # keep
initial_status: unfinished       # keep
keywords: []                     # legacy, deprecated
themes: [deadlines, process]     # new controlled vocabulary
phase: in-progress               # computed fallback if missing
```

Computation rules in build step:

- If `themes` is missing and `keywords` exists, map/sanitize `keywords -> themes`.
- If `phase` missing:
  - `proposed|draft` => `proposal` or `in-progress` based on `started_at`
  - first publish (`version` starts with `0.1` or `1.0`) => `initial-release`
  - later versions => `post-release-revision`

## Incremental rollout plan

### Phase 1 (safe, no content break)

- Add normalized blocks in `site/_data/essayIndex.js` while keeping existing flat keys.
- Keep existing filters working.
- Add new optional frontend filters for lifecycle/phase.

### Phase 2 (editorial tooling)

- Add `themes` multiselect in CMS config.
- Introduce validation script for allowed theme values.
- Keep writing `keywords` for one release cycle as compatibility mirror.

### Phase 3 (cleanup)

- Switch frontend filters to `themes` only.
- Remove keyword fallback once all essays are migrated.
- Tighten CI to fail unknown theme values.

## Success criteria

1. Every indexed essay has deterministic `workflow_state`, `outcome_state`, and `phase`.
2. Frontend filters no longer rely on ad-hoc keyword strings.
3. CMS + scripts enforce vocabulary and lifecycle consistency.
4. Existing essay URLs and publishing automation remain unchanged.
