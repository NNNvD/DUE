# Contributing

Thanks for improving DUE!

## Start a new essay
Use the **Start a new essay** issue form:
- {{ repoUrl }}/issues/new?template=new-essay.yml

Then copy the front matter snippet into a new file under:
```
site/essays/drafts/your-slug.md
```

### Canonical URLs
- If the essay also lives elsewhere, add `canonical_url` to the front matter and point it at the canonical location.
- When `CANONICAL_BASE` (or `CANONICAL_URL`) is set in the environment, Eleventy will derive `canonical_url` automatically using the page URL. Override it with front matter when needed.

## Suggest a change
Use the **Suggest a change** issue form:
- {{ repoUrl }}/issues/new?template=suggest-change.yml

For substantial changes, open a PR and ask a maintainer to apply the **major** label. For small fixes, add **minor** yourself.

> **Major label policy**
>
> GitHub does not currently support restricting label usage by role, so automation enforces this policy instead. A workflow monitors PR label events and will automatically remove **major** if it is applied by anyone without _maintain_ (or higher) permissions, leaving a reminder comment. Mention a maintainer in the PR if you believe the label should stick.

## Reviews for published essays
- Any PR that touches files under `site/essays/published/**` now requires approval from @noahvandongen before it can merge.
- GitHub automatically requests this review via CODEOWNERS and branch protection will block merges until it is granted.
- Please factor this into release timelines so reviewers have time to respond.

## Versioning & credit
- Minor → patch bump and Acknowledgments
- Major → major bump and Coauthor
