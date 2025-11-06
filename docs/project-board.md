# GitHub Project Board

This repository uses a GitHub Project board to coordinate work across the automation scripts, Eleventy site, and contributor experience.

## Board layout

The board is organized with priority-first columns that align to the maintenance expectations documented in [`AdditionalDevelopment.rtf`](../AdditionalDevelopment.rtf) and the GitHub workflow automation in [`.github/workflows`](../.github/workflows):

| Column | Purpose |
| --- | --- |
| **P0** | Must-do work to keep automation and publishing unblocked.
| **P1** | Important improvements that unlock upcoming releases or polish the contributor flow.
| **P2** | Nice-to-have optimizations, documentation polish, or stretch features.
| **Done** | Completed work awaiting retro notes or deployment confirmation.

## Current issue placement

| Column | Issue title |
| --- | --- |
| P0 | ["Verify auto-publish workflow handles overdue drafts"](https://github.com/your-username/your-repo/issues/1) |
| P0 | ["Keep word-range enforcement script up to date with Eleventy content"](https://github.com/your-username/your-repo/issues/2) |
| P1 | ["Document version bump and credit automation in contributor docs"](https://github.com/your-username/your-repo/issues/3) |
| P1 | ["Require change-intent labels on published essay PRs"](https://github.com/your-username/your-repo/issues/4) |
| P2 | ["Clarify GitHub Discussions and giscus setup steps"](https://github.com/your-username/your-repo/issues/5) |
| Done | ["Seed starter essay: A Short Defense of Imperfect Publishing"](https://github.com/your-username/your-repo/issues/6) |

Update the linked issue numbers once the repository lives on GitHub and the issues exist. The titles mirror the maintenance backlog described in the implementation spec so that the project board stays in sync with the engineering checklist.

## How to update the board

1. Visit the project board: [https://github.com/your-username/your-repo/projects/1](https://github.com/your-username/your-repo/projects/1).
2. Drag issues between columns as work progresses.
3. When closing an issue, move it to **Done** so the archive remains tidy.
4. For new issues, assign them a priority column immediately after triage so automation coverage stays healthy.

For advanced automation, consider the GitHub CLI workflow below:

```bash
# Authenticate once per machine
gh auth login

# Example: add issue #42 to the P0 column
gh project item-add 1 --owner your-username --url https://github.com/your-username/your-repo/issues/42 --field "Status=P0"
```

Replace `your-username` with the actual repository owner when publishing this starter.
