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

For substantial changes, open a PR and ask a maintainer to apply the **major** label. For small fixes, add **minor** yourself.

> **Major label policy**
>
> GitHub does not currently support restricting label usage by role, so automation enforces this policy instead. A workflow monitors PR label events and will automatically remove **major** if it is applied by anyone without _maintain_ (or higher) permissions, leaving a reminder comment. Mention a maintainer in the PR if you believe the label should stick.

## Versioning & credit
- Minor → patch bump and Acknowledgments
- Major → major bump and Coauthor
