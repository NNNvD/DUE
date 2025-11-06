# Contributing

Thanks for improving DUE!

## Start a new essay
Use the **Start a new essay** issue form:
- {{ repoUrl }}/issues/new?template=new-essay.yml

Then copy the front matter snippet into a new file under:
```
site/essays/drafts/your-slug.md
```

## Suggest a change
Use the **Suggest a change** issue form:
- {{ repoUrl }}/issues/new?template=suggest-change.yml

For substantial changes, open a PR and add the **major** label. For small fixes, add **minor**.

## Reviews for published essays
- Any PR that touches files under `site/essays/published/**` now requires approval from @noahvandongen before it can merge.
- GitHub automatically requests this review via CODEOWNERS and branch protection will block merges until it is granted.
- Please factor this into release timelines so reviewers have time to respond.

## Versioning & credit
- Minor → patch bump and Acknowledgments
- Major → major bump and Coauthor
