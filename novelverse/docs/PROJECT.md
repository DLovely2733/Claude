# NovelVerse: project file

This is the running record for continuing development across sessions: what's done and verified, what's outstanding, the decisions behind the design, and the next priorities. **Update it at the end of every working session.**

Last updated: 2026-10-25 (Phases 1–5 complete; finishing pass done).

## Guiding question
*What would make a reluctant Grade 9 reader genuinely want to take part in tomorrow's novel study?*

Our answer so far:
- **A role that matters.** Commander, investigator, prosecutor, juror, journalist.
- **Choices with visible consequences.** These are always labelled as simulations, never as the book.
- **A room that reacts.** Live votes, opinion shifts, objections that get sustained.
- **No stakes for being slow or needing support.**

## Verification status

How things are checked:
- `npm run typecheck`, `npm run lint` (ESLint: TypeScript, React hooks, jsx-a11y) and `npm test` (vitest, 42 tests) must all pass.
- `npm run build && npm run e2e` drives Chromium through every feature (92 checks), including axe-core scans of 20 screens for serious or critical issues and phone-width (375px) layout checks.
- `npm run e2e` also starts the classroom server, joins from separate browser contexts, and runs the AI mentor against a local mock of the Anthropic API.

| Area | Feature | Status | How it is verified |
|---|---|---|---|
| Student | Landing, star chart, mission path, room unlocking, Commander's Log | Done | e2e |
| Student | Dilemma in a 3D command deck, with a 2D map fallback | Done | e2e (3D renders with SwiftShader; the test plays in 2D) |
| Student | Simulated 3D battle replay of the student's orders (2D, and a static frame with reduced motion) | Done | Visual check. Not asserted in e2e |
| Student | Evidence board, vault, connections, theme ladder | Done | e2e |
| Student | **Character Courtroom**: side, labelled exhibits, typed objections with rulings, closing, verdict out of role | Done | e2e |
| Student | **Creative Studio**: 8 formats with live previews, shared criteria, craft note | Done | e2e (newspaper) |
| Student | Literary Mentor (local, rule-based, questions only) | Done | Unit and e2e |
| Teacher | Knowledge base editor, spoiler control, quotations tied to an edition | Done | e2e |
| Teacher | **New novel unit built entirely through the UI**: wizard, chapter notes, events, theme ladder, template, publish, student play | Done | e2e |
| Teacher | Generator with placeholders, **templates** (6 built-in plus save-your-own), blank missions | Done | Unit and e2e |
| Teacher | **Outcome coverage map** (outcomes × missions × logged and assessed evidence) | Done | Visual check |
| Teacher | Review: rubric, editable draft feedback, revisions, CSV/JSON export | Done | e2e |
| Teacher | Print / projector packets, including courtroom and studio | Done | Visual check |
| Live | Four Corners, This-or-That (round 2 and opinion shift), Evidence Showdown (top-3 final vote), Prediction, moderated Response Wall, Live Courtroom (team-private building, objections, rulings, verdict) | Done | Unit tests on the logic; e2e for Four Corners with shift, and Wall with moderation |
| Live | Same-browser transport (BroadcastChannel) | Done | e2e |
| Live | **Classroom relay server** (`npm run classroom`) for real student devices on a LAN | Done | e2e with separate browser contexts |
| Live | Live Courtroom (team-private building, objections, sustain, verdict) and Showdown (top-3 final) | Done | e2e |
| Live | **Lesson playbook** on the dashboard (warm-up → mission → debate → exit ticket), plus a recent-sessions list | Done | e2e |
| Mentor | **Optional AI mentor** (`server/mentor.mjs`): `claude-opus-5-5` through the official SDK, low effort, `fallbacks: "default"`; only unlocked knowledge sent; every reply filtered (no quotations, page numbers, answers or locked chapters); built-in mentor as fallback | Done, verified against a **mock** API | e2e with a mock Anthropic server. **Not yet run against the real API**: needs a key and school approval |
| Content | **Second demo novel**: *Dr Jekyll and Mr Hyde* (public domain, noir), with the 6-room mission *The Utterson Files* set before the twist (Ch. 7–10 locked) | Done | Unit (integrity) and e2e |
| Content | Plain-text file import for chapter notes, outcomes and knowledge-base JSON | Done | Visual check |
| Teacher | Teaching patterns for the courtroom (mislabelled exhibits, missed speculation, objecting to sound evidence) and the studio (craft notes that don’t explain choices) | Done | Visual check |
| Immersion | Typed transmissions, room "warp" transitions, ambient soundscape per skin (off by default), five skins | Done | Visual check. Audio isn't tested automatically |
| Performance | Lazy loading for each engine and 3D scene; 3D stops rendering when hidden or off-screen; DPR capped at 1.5 | Done | Build output |
| A11y | Keyboard path, skip link, focus return, high contrast, reduced motion, plain language, read-aloud, axe scans | Done | e2e |

## What needs a hosted service (not built)
Be honest with teachers about these:
- **Internet-wide live sessions** (students on different networks, or joining from home). The relay works on a school LAN only. A hosted relay with TLS, authentication and rate limits is needed.
- **Accounts, rosters and data that persist across devices.** Everything is in the browser's localStorage today. Real student data needs a school-approved backend with access control, data minimization, retention limits and Alberta privacy compliance (FOIP, plus school-authority policy).
- **AI mentor in production.** It's implemented in the classroom server and tested against a mock API. Using it for real needs an Anthropic API key on the teacher's laptop, `NOVELVERSE_AI_MENTOR=on`, and **school approval**, because it sends student drafts to an external service. It isn't available on the static GitHub Pages build. AI-generated missions aren't built; the generator is template-based.
- **Curriculum verification.** Alberta's sites were unreachable from the build environment. Outcomes are headings only and marked *unverified* until the teacher checks them.

## Architecture decisions
1. **One knowledge base per novel is the source of truth** for every engine, the generator, the mentor and live sessions. Missing knowledge becomes a `[Teacher: …]` placeholder. Publishing is blocked until placeholders are filled.
2. **Steps are data** (`MissionStep` union in `src/data/types.ts`). The teacher's step editor walks the data generically, so a new engine only needs: a type, a player component, generator support, a `describe()` case in Review, and print support.
3. **The teacher's browser hosts live sessions.** The relay server is dumb and stateless. Students receive `publicState()` only: aggregated, anonymous, never call signs. Courtroom teams receive team-private copies.
4. **Static first.** Hash routing and a relative base, so `dist/` runs anywhere. The relay server is optional and serves the same build.
5. **Assessment stays with the teacher.** Case strength, rulings and insights are feedback to the student, not grades. The rubric is applied by the teacher. Supports are recorded but never lower a result.
6. **Persisted store is versioned** (`version: 2`, with `migrate` in `src/state/store.ts`). Add a migration whenever you add fields or demo content.

## Known limitations and small debts
- The 2D battle replay animates with React state. That's fine at 36 dots; switch to a canvas if it grows.
- The theme lock in generated vaults reuses the teacher's ladder wording, so the strong option is the teacher's rung 3.
- Toasts stack across navigation.
- No i18n or French Immersion version yet.

## Next priorities
1. **Teacher actions:** verify the curriculum headings and the demo novels’ facts against official documents and the books, then mark them verified.
2. Run the AI mentor against the real API with a small evaluation set of weak student answers, checking that it asks questions only, never quotes, and never spoils. Do this before any classroom use.
3. A hosted relay option (Cloudflare Durable Objects or similar) plus teacher sign-in, keeping data minimal, for students joining from home.
4. DOCX/PDF import of the teacher’s own notes (currently: save as .txt first), with a copyright confirmation step.
5. AI-assisted drafting of placeholder text in the generator (dilemma consequences, opposing arguments), always teacher-reviewed.
