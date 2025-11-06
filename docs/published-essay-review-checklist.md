# Published essay review protection

This repository now enforces Code Owner review for any pull request that edits
`site/essays/published/**`.

## Verification attempt

1. Create a feature branch and modify a file under `site/essays/published/`.
2. Push the branch and open a draft pull request.
3. GitHub should automatically request a review from @noahvandongen and block
   merge until the approval is granted.

> **Note:** Branch protection lives on GitHub, so the final confirmation must be
> observed in the GitHub UI after pushing the test branch.

## Maintainer reminder

- Keep an eye on the review queue so published essays do not get blocked for
  long.
- If the primary reviewer is unavailable, add an alternate in `CODEOWNERS` and
  update this checklist accordingly.
