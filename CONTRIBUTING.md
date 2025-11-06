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

For substantial changes, open a PR and add the **major** label. For small fixes, add **minor**. Pull requests that modify `site/essays/published/` must include one of these labels or CI will fail.

## Versioning & credit
- Minor → patch bump and Acknowledgments
- Major → major bump and Coauthor
