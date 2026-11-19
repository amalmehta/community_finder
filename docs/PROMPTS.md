# Prompt log

Every prompt given in each working session, word for word and in order, with a
line on what it led to. Secrets, keys and personal data are redacted.

This log starts the day it was created. The sessions before it — the original
build, the circles work and the three rounds of group-dynamics reading — are
not here, and their record is the commit history and the changelog at the
bottom of the project brief.

---

## 2026-11-19 — find fifteen improvements, and bring the docs up to standard

> community_finder: update this existing project. It's already built, so change
> what's here rather than starting it again.
>
> What I want changed, in my words:
> find 15 ways to improve this
>
> Bring it up to standard too, where it isn't already:
> - Add a visual to the README: Add a clear visual to the README: a screenshot
>   of it working, or a diagram of how it works.
> - Add a system design doc: Write docs/SYSTEM-DESIGN.md: the architecture with
>   a Mermaid diagram, each component's job, the main flows, where data lives,
>   key decisions and known limits.
> - Add instructions: Write docs/INSTRUCTIONS.md: how to set it up, run it and
>   use it, checked by following the steps. Link it from the README.
> - Add a file structure doc: Write docs/FILE-STRUCTURE.md: what's where in this
>   repo, one line per file or folder that matters. Link it from the README.
>
> How to go about it:
> - Read community_finder.md and follow its META-INSTRUCTIONS, then the README
>   and docs, and work the way the project already does.
> - Edit what's here in place. Before rewriting a file wholesale or deleting
>   anything, show me what would change and wait for my yes.
> - Keep the README and docs in step with what changes, and add a CHANGELOG line
>   if the project keeps one.

Led to: a read of the whole codebase and three parallel reviews (the server,
the circles and social UI, and the tests and data). Fifteen defects were ranked
and presented, eight of them reproduced against a running server before being
reported.

Then four questions, answered through the question widget:

> **How much should I build in this pass?**
> → All 15 plus the small fixes

> **README.md is 802 lines with no screenshot or diagram — the research shape
> rather than the product shape your spec asks for. How should I handle it?**
> → Cut it down, move the rest to docs/

> **Denver has exactly one hand-picked listing for 17 of its 32 interests, so
> those chips can only ever show one group. What should I do?**
> → Add a test floor only

> **Everything on this branch is unpublished — the live site has no Circles and
> 10 of the 13 cities. What should I do at the end?**
> → Commit and push, you merge

Led to: the whole of the change described in the changelog entry for this date
— eight server defects, the client defects, the public-facing fixes, the
service worker, account export and deletion, the four documents, and the
screenshots. Both suites green at 9,532 and 458 assertions.

---

## 2026-11-19 — update via the meta doc: make it feel friendly, not vanilla

> community_finder: update this existing project. It's already built, so change
> what's here rather than starting it again.
>
> What I want changed, in my words:
> update via the meta doc
>
> How to go about it:
> - Read community_finder.md and follow its META-INSTRUCTIONS, then the README
>   and docs, and work the way the project already does.
> - Edit what's here in place. Before rewriting a file wholesale or deleting
>   anything, show me what would change and wait for my yes.
> - Keep the README and docs in step with what changes, and add a CHANGELOG line
>   if the project keeps one.

Led to: a read of the brief and a diff of the meta doc since the project's
last update (Nov 9) to see which instructions were new for it.

> update the ui/ux to feel friendly not vanilla

Led to: screenshots of the current UI, and three mockups of the first
question — A, warm welcome; B, noticeboard; C, same quiet with a warmer
voice — then two questions through the question widget:

> **Which direction for making Community Finder feel friendly rather than
> vanilla?**
> → A · Warm welcome (Recommended)

> **When it feels vanilla to you, what's doing most of it?**
> → "grayyyyy", The look, Nothing moves, Empty space

Led to: the friendly pass. Cream ground and warm neutrals in both themes, a
terracotta pill button, rounded system type, six group hues on the chips and
listing badges, the guide in a speech bubble, an opening animation with a
reduced-motion fade, motion on chips and questions, and the first question
moved up from mid-screen. Tests updated to pin the new decisions, a
`friendly` group added, the README screenshots retaken, and "The look" in
docs/SYSTEM-DESIGN.md rewritten with a manual review checklist. Both suites
green at 9,556 and 458.
