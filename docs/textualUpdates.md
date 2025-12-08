# DUE – Textual Updates Specification

This document describes all requested textual changes to the DUE website.

## Global conventions

**Length bands and labels**

Everywhere on the site, use the following scheme:

* **Tiny** · **100–500 words** · **purple square**
* **Minute** · **500–1000 words** · **orange triangle**
* **Short** · **1000–1500 words** · **teal circle**

**Color naming**

* In all user-facing copy: say **“orange”**, not “warm orange”.
* Exception: the **style guide** may still refer to “warm orange”.

**Dates**

* Change phrases like `Publishes at 2024-07-01` to `Publishes on 2024-07-01`.
* Change `— publishes 2024-07-01` to `— publishing on 2024-07-01` in lists.

---

## 1. Global footer

**Action (Codex)**
Update the footer text used across the site to:

```text
Built with Eleventy · Content © 2024–present Noah van Dongen & contributors. Subscribe via Atom or JSON feeds.
```

Adjust years or names as needed later; this is the default.

---

## 2. Home page (`/`)

### 2.1 Hero / intro block

**Action (Codex)**
Replace the current introductory text on the home page with:

```markdown
DUE is a collaborative platform for short-form essays written under pressure. Writers propose a topic, choose a word range—Tiny (100–500 words), Minute (500–1000), or Short (1000–1500)—and have 30 days to deliver. When the deadline hits, the essay goes live, finished or not.

Purple squares mark Tiny essays, orange triangles Minute essays, and teal circles Short essays.
```

### 2.2 “In progress” section heading and intro

**Action (Codex)**
Use the following text for the heading and intro above the list of in-progress drafts:

```markdown
### In progress

Deadlines arrive fast—here’s what is currently being drafted. Drafts are read-only until they publish.
```

### 2.3 “Most recently published” section heading and intro

**Action (Codex)**
Use the following text for the “latest published” section:

```markdown
### Most recently published

Catch the latest release before the next round of edits.
```

### 2.4 “Explore / Keep reading” block

**Action (Codex)**
Use this block where the site points to other main pages (library, drafts, about):

```markdown
### Keep reading and contributing

#### Browse all essays
See everything that has shipped and what is still cooking, all in one place.

#### Draft schedule
View every draft ordered by publish date so you can plan your reading. Drafts are read-only.

#### About DUE
Learn how deadlines, credits, and feedback shape the project.
```

---

## 3. Essay library page (`/essays/`)

### 3.1 Top description

**Action (Codex)**
Replace the introductory paragraph with:

```markdown
Scan the full catalogue to see what’s shipping next and what has already launched. Length badges use purple squares for Tiny essays (100–500 words), orange triangles for Minute essays (500–1000 words), and teal circles for Short essays (1000–1500 words).
```

### 3.2 Length filter legend

**Action (Codex)**
For the length filter/legend, use:

```markdown
Length

Pick any length band.

Tiny · 100–500 words · purple square  
Minute · 500–1000 words · orange triangle  
Short · 1000–1500 words · teal circle
```

If these are separate filter controls, the label on each can be:

* `Tiny (100–500 words)`
* `Minute (500–1000 words)`
* `Short (1000–1500 words)`

### 3.3 “Latest releases” and “Publishing soon” headings

**Action (Codex)**
Use these headings and intros:

```markdown
### Latest releases

The newest essays first, with version numbers and release notes.

### Publishing soon

Drafts are ordered by their publish date so you can jump in where momentum is highest.
```

---

## 4. Draft schedule page (`/drafts/`)

### 4.1 Main heading and intro

**Action (Codex)**
Use this copy for the draft schedule page:

```markdown
Draft schedule

## What’s publishing next

Every active draft is listed by its publish date so you can see where help is needed most—ideally before the deadline hits.
```

### 4.2 Per-draft date line

**Action (Codex)**
Where you show the publish date for each draft, change “Publishes at” to:

```text
Publishes on 2024-07-01
```

and in any list:

```text
— publishing on 2024-07-01
```

(Use the appropriate dynamic date in templates.)

---

## 5. Essay page template (per essay)

### 5.1 Metadata line under the title

**Action (Codex)**
Update the metadata line to use Tiny / Minute / Short and the new ranges. A good pattern is:

```markdown
Tiny (100–500 words) • 295 words total
Minute (500–1000 words) • 842 words total
Short (1000–1500 words) • 1340 words total
```

Use the correct label based on the essay’s range and the actual word count. The square/triangle/circle and colors are handled by CSS or SVG next to this label.

### 5.2 “Propose edits for this essay” section

**Action (Codex)**
Replace the current explanatory text for the “Propose edits” section with:

```markdown
### Propose edits for this essay

Choose how substantial your contribution is.

- Use **Minor change** for phrasing, typos, and small clarifications.  
- Use **Major change** for structural revisions, new arguments, or substantial rewrites. Major contributions are reviewed as potential coauthorship.

Each button opens a pre-filled GitHub issue linked to this essay’s source file.
```

### 5.3 Release notes / Acknowledgments / Version history blocks

**Action (Codex)**
Use these standard texts as defaults where no history exists yet:

```markdown
### Release notes

- Initial publication as complete (v1.0.0).

### Acknowledgments

Minor improvements (grammar, phrasing, examples, references) are credited here after they are merged.

### Version history

No earlier versions yet—this essay is at its initial release.  
Browse full history →
```

When actual release notes/acknowledgments exist, this structure should still be used.

---

## 6. About page (`/about/`)

**Action (Codex)**
Replace the entire main body content of `/about/` with the following markdown:

```markdown
About

## Deadline for Unfinished Essays

DUE is a writing experiment built around a simple rule: every essay ships within 30 days—finished or not. Drafts are not private diaries; they are public commitments with a clock. Once the deadline expires, the essay goes live and can then evolve through future versions.

For readers, DUE is a place for short, focused essays with a transparent history. For contributors, it is a way to get ideas out of notebooks and into the world.

---

### Cadence · 30 days to publish

Each essay starts with three choices:

- a topic;
- a target length band: Tiny, Minute, or Short;
- a fixed publication date, 30 days away.

Once an essay begins, the deadline does not move. On that date it is published in whatever state it has reached: unfinished but on time, or finished and on time. After publication, the essay can be revised in later versions, but the original deadline is preserved as part of the record.

Drafting and edits happen in the backend so the schedule stays predictable. Public participation starts once an essay is published.

---

### Length · Tiny, Minute, Short

Length is part of the constraint. Every essay commits to one of three bands:

- **Tiny**  
  **100–500 words** · purple **square**  
  Short notes, sharp arguments, or single ideas.

- **Minute**  
  **500–1000 words** · orange **triangle**  
  Room for a few steps in the argument, plus one or two examples.

- **Short**  
  **1000–1500 words** · teal **circle**  
  Short-essay territory, enough space for a structured case.

The icons use outlines rather than filled shapes so the colors stay visible without overwhelming the text. Each essay also shows its exact word count next to the Tiny/Minute/Short badge.

---

### Credit & versioning

DUE treats essays as evolving objects, not frozen pieces.

Minor contributions—grammar, phrasing, small clarifications, examples, references—are credited in the acknowledgments once merged. Major contributions that change structure, arguments, or conclusions can lead to shared authorship. These are negotiated at the time of revision.

Each essay has a three-part version number, for example `version 1.2.6`:

- **Right number**  
  Very small fixes such as typos or adding a single reference.

- **Middle number**  
  Substantive local edits, such as adding or removing several sentences or a paragraph.

- **Left number**  
  Completion and meaning:  
  - `0` for essays that were published as *Unfinished on time*;  
  - `1` for essays that reached their first finished version;  
  - `2` or higher when the core message or conclusion changes.

Starting points follow the deadline logic:

- Essays published before they are finished start at `version 0.1.0` and are labeled *Unfinished on time*.
- Essays published when or after they are finished start at `version 1.0.0` and are labeled *Finished on time*.

Release notes and version history document what changed and why.

---

### Comments & feedback

Public participation happens through comments on **published** essays.

- Comments are **pre-moderated**.
- Accepted comments may be shown under the essay with a status such as:
  - **Not yet implemented** — considered but not (yet) in the text;
  - **Implemented** — already incorporated in a specific version;
  - **Rejected (with reason)** — not adopted, with a short explanation.

Minor feedback that leads to a change is acknowledged in the essay credits. Major feedback that materially shifts an essay is reflected in the release notes and version number, and may lead to coauthorship.

The **Contribute** page contains the full comment policy, privacy notes, and terms of use.

---

### Roles · reader, commenter, essayist

There are three main roles on DUE:

- **Readers** explore essays, follow version histories, and see which drafts are scheduled next.
- **Commenters** respond to published essays, suggest changes, and help refine arguments. Anyone can comment, subject to moderation.
- **Essayists (members)** propose essays, commit to deadlines, and maintain pieces over time.

Only essayists can start or edit essays in the backend. This keeps responsibility for Tiny, Minute, and Short deadlines and versioning clear, while still allowing broad input through comments.

---

### Becoming an essayist / member

DUE is intentionally small and opinionated. New essayists are added gradually so the workflow can remain lightweight and accountable.

If you would like to become an essayist:

1. **Read a few essays** to get a sense of scope, tone, and length—Tiny, Minute, and Short.
2. **Sketch 1–3 possible topics** you might want to write about, each with a tentative length band  
   (Tiny, Minute, or Short).
3. **Send a short note** via the contact route listed here or in the repository, including:
   - your name and affiliation (if relevant);
   - your proposed topics and length bands;
   - links to any existing writing you feel is representative.

Current maintainers review these requests irregularly. When a new essayist is added, they receive access to the backend workflow (Git-based editing, versioning, and release notes) and are expected to:

- respect deadlines once a Tiny, Minute, or Short essay is started;
- treat external comments seriously and reply where appropriate;
- follow the credit and coauthorship rules described above.

There is no formal membership fee or legal structure. The “member” label is purely functional: it indicates who can start and maintain essays inside the system.

---

### Where to go next

Navigation stays simple:

- **Home →** shows the latest publication and any current draft.  
- **Essay library →** lists all published essays and drafts, with filters for topic and length (Tiny, Minute, Short).  
- **Draft schedule →** orders in-progress essays by their publish date.  
- **Contribute →** explains how comments work and how they are handled.  
- **Style guide →** documents the visual system and content patterns for people working on the site.

The details of how your comments are stored, displayed, and attributed are defined on the Contribute page.
```

---

## 7. Contribute page (`/contribute/`)

**Action (Codex)**
Replace the main body content of `/contribute/` with:

```markdown
Contribute

## Commenting on DUE

DUE is comments-only for the public. Drafting and edits happen in the backend, but anyone can respond to **published** essays.

Comments are the main way non-members influence what changes over time.

---

### Where and how to comment

- **Where to comment**  
  Visit any published Tiny, Minute, or Short essay and scroll to the comments section. Drafts are visible but cannot be commented on.

- **What to include**  
  Indicate whether your feedback is:
  - **minor** — typos, phrasing, references, small clarifications; or
  - **major** — structural suggestions, missing arguments, alternative framing.

  The form lets you pick minor or major intent before you type. This helps route and credit your comment correctly.

- **How specific to be**  
  Point to particular sentences or sections when possible. If you propose cuts or additions, state them plainly. You do not have to solve everything; it is enough to identify what feels off.

- **Scope of topics and keywords**  
  Keep topics and keywords tight (≤ 5 each) so discussions stay searchable and on-topic.

- **Tone and evidence**  
  Stay close to the existing tone of the essay. When challenging a claim, say what you would change **and why**, and cite sources where that matters.

---

## What happens to your feedback

Comments are **pre-moderated**. Each accepted comment is given a status and may be published under the essay.

Possible statuses:

- **Not yet implemented** — the point is noted but not (yet) in the text;
- **Implemented** — the text has changed in response to the comment;
- **Rejected (with reason)** — the suggestion was not adopted, with a short explanation.

Once a comment has been processed:

- **Minor feedback** that leads to a change is acknowledged in the essay’s credits.
- **Major feedback** that materially shifts the argument or structure is reflected in the release notes and the version number. In some cases this may lead to coauthorship, which is decided with the essay’s maintainer.

For sensitive or potentially harmful issues, explicitly flag this in your comment so moderators can prioritise review.

If you want to understand how version numbers work, see the section *Semantic version rules for essays* below or the overview on the About page.

---

## Code of conduct for commenters

The project depends on people being able to disagree productively. Comments that include harassment, spam, or unrelated self-promotion will be rejected.

A few simple rules:

- **Critique ideas, not people**  
  No personal attacks, slurs, or discrimination.

- **Be clear and grounded**  
  When you claim something is wrong or misleading, say what you would replace it with and why. Cite sources where appropriate.

- **Protect privacy**  
  Do not post phone numbers, addresses, or other personal data about yourself or others.

- **Stay on topic**  
  Keep the comment tied to the specific essay—Tiny, Minute, or Short. If you have a broader idea for a new essay, mention it briefly rather than derailing the thread.

- **One account per person**  
  Do not create multiple identities to influence discussion or moderation.

If you encounter behaviour that violates these rules, you can flag it in your comment or contact the maintainers via the About page.

---

## Privacy statement

When you submit a comment, DUE stores:

- the comment text;
- the name or handle you provide for display;
- any optional contact details you choose to share (for example, an email address).

This data is used for moderation, follow-up questions, and version tracking.

- **Data use**  
  Your comment and chosen display name may be published under the relevant essay once approved. Optional contact information is used only for clarifications and is not shared publicly.

- **Retention**  
  Comments and their moderation history remain on record so that release notes and version histories can be audited later.

- **Removal and corrections**  
  You can request updates or deletion of your comments by contacting the maintainers through the route indicated on the About page. Technical and legal limits may apply, but requests will be taken seriously.

- **Cookies and analytics**  
  No advertising trackers are used. Only essential site cookies are required for basic functionality and aggregate analytics.

---

## Terms of use for comments

By commenting on DUE, you agree to the following conditions.

- **Licensing**  
  You retain ownership of your words while granting DUE permission to publish, lightly edit for clarity, and archive your comment alongside the relevant essay.

- **Moderation rights**  
  Comments may be declined, edited for tone or brevity, or removed if they break this policy or applicable law.

- **No professional advice**  
  Essays and comments are informational only. They are not medical, legal, financial, or other professional advice.

- **Attribution**  
  When a comment leads to a change in a Tiny, Minute, or Short essay, credit appears in the acknowledgments or release notes depending on impact. Major, repeated contributions may lead to coauthorship; this is decided together with the essay’s maintainer.

If these conditions are not acceptable to you, please do not submit comments.

---

## Semantic version rules for essays

Each Tiny, Minute, or Short essay uses a three-part version number, for example `version 1.2.6`, to signal how much has changed between releases.

- **Right number (patch)**  
  Very small fixes such as correcting typos, adjusting a single sentence, or adding a reference without changing the argument.

- **Middle number (minor)**  
  Local but substantive edits: adding several sentences, inserting or removing a paragraph, clarifying sections, or rearranging examples without changing the overall conclusion.

- **Left number (major)**  
  Completion and meaning:
  - `0` — essay was published as *Unfinished on time* and is still developing;
  - `1` — first finished version;
  - `2` or higher — shifts in core message, conclusion, or structure.

Starting points:

- Essays published before they are finished start at **`0.1.0`** (*Unfinished on time*).
- Essays published when or after they are finished start at **`1.0.0`** (*Finished on time*).

Comments that lead to changes are reflected in the appropriate digit: patch, minor, or major. This helps readers see at a glance whether an update was a light polish or a deeper revision.

---

## While comments are closed on drafts

Drafts remain visible so readers can see what is coming next, including their target length band:

- Tiny (100–500 words) — purple square  
- Minute (500–1000 words) — orange triangle  
- Short (1000–1500 words) — teal circle  

and their scheduled publication date.

Comments open **only after** publication. To see when a draft will accept comments, consult:

- the **Draft schedule**, which lists all in-progress essays by publish date;
- the header on the draft itself, which shows its planned publication date.

---

## Need more?

If you want to go further:

- read the **About** page for the project story, roles, and membership;
- browse the **published essays** to see how versioning and credits look in practice;
- follow the **Draft schedule** to know when new Tiny, Minute, and Short essays will open for comments.

For questions that do not fit into a comment, use the contact information listed on the About page or in the repository.
```

---

## 8. Style guide snippets

**Action (Codex)**
In the style guide, adjust the relevant sections to describe the length chips and colors. It is fine to keep “warm orange” here if you prefer.

### 8.1 Palette usage snippet

```markdown
Use purple for links and Tiny length badges (100–500 words, square outline), teal for outlines and focus rings and Short badges (1000–1500 words, circle outline), and warm orange for Minute badges (500–1000 words, triangle outline) and gentle highlight states.
```

### 8.2 Components snippet

```markdown
Use `.length-chip` and `.legend-badge` for word-count cues. Length chips follow the standard bands: Tiny (100–500 words, purple square), Minute (500–1000 words, warm orange triangle), and Short (1000–1500 words, teal circle). Use `.badge--tone-*` for status messaging and `.accent-pill` for inline notes.
```

---

You can paste this entire document into an issue for Codex and let them work through each section.
