# NovelVerse: novel studies for Grade 9 ELA

NovelVerse is an interactive novel-study platform for Alberta Grade 9 English Language Arts. Students take on missions inside the world of the novel: they make decisions, investigate, crack reasoning locks and build theme statements. Every interaction asks the same question: *what does the book make you think, and how do you know?*

It deepens engagement with the novel. It does not replace reading it.

## Run it

```bash
cd novelverse
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests (vitest)
npm run build        # production build in dist/
npm run lint         # ESLint (TypeScript, React hooks, jsx-a11y)
npm run e2e          # full browser run (needs a build): every engine, live sessions, relay, axe scans
npm run classroom    # after a build: serve the app + live-session relay on your school network (port 8787)
```

Project status, decisions and next priorities: [`docs/PROJECT.md`](docs/PROJECT.md).

## What works locally vs. what needs a hosted service

| Works with no server (static site) | Needs the classroom server on a school laptop (`npm run classroom`) | Needs a hosted service (not built) |
|---|---|---|
| All student missions and engines, the teacher portal, templates, review, export, print | Students joining live sessions from **their own devices** on the same network | Live sessions across different networks, teacher and student accounts, data across devices, an AI mentor |
| Live sessions between tabs of **one browser** (e.g. a projector-only lesson) | | |

The build is static and uses hash URLs, so `dist/` runs from any web server or sub-path. On a push to the default branch, the repository's GitHub Pages workflow publishes it at `/novelverse/`.

## What's built

### Student portal: Enter the Story
- **Landing screen:** an animated starfield and two portals, Student and Teacher.
- **Star chart:** each chapter is a node on the map. Chapters the teacher hasn't unlocked show as "Classified".
- **Operation Pressure Point** (*Ender's Game*, Chapters 11–13), six rooms:

| Room | Engine | Literacy skill |
|---|---|---|
| Mission Briefing | Briefing | Chunked recap (labelled as no substitute for reading), word bank, first-thought prompt |
| The Dawn Battle | Moral Dilemma Simulator in a **3D command deck** (React Three Fiber) with a full **2D map fallback** | Decide as a commander, justify the choice with values and evidence cards, see *simulated* consequences and a follow-up decision, then compare with the novel. The "explore another path" option leaves the book's events unchanged. |
| The Graff File | Literary Detective | Sort facts from interpretations, drag cards onto competing theories (supports / challenges), connect cards with threads, rule out weak theories with reasons, file a case report. A **case strength** meter scores the quality of the reasoning, not which theory was picked. Several theories are defensible. |
| The Signal Vault | Escape the Chapter | Timeline reconstruction, an author's-craft lock (the chapter-opening adult conversations, i.e. dramatic irony) and a theme lock that explains why weak statements are weak. Hints are free and never count against the student. |
| Shifting Alliances | Character Connections | A relationship network with evidence for every link. A chapter slider shows how relationships change, and students can compare with the teacher's reference map. |
| Commander's Log | Theme Explorer | A theme ladder from topic to observation to theme statement to complication, tied to evidence, plus a look back at the student's own earlier thinking. |

- **Literary Mentor:** a questioning coach. It starts by naming a strength, then asks a question. If asked again it offers a sentence starter, then a worked model from a *different* story. It never writes the answer, quotes the novel or discusses locked chapters.
- **Insights:** recognise reasoning moves such as anchoring in the text, taking on the other side, or revising. There are no points, streaks, timers or leaderboards.
- **Commander's Log:** every decision, claim and revision, plus feedback the teacher has returned.

**Operation Tribunal** (also Chapters 11–13) adds two more engines:
- **Character Courtroom:** students pick a side, enter exhibits labelled as fact or interpretation, and cross-examine the other side's arguments. They either object (speculation, ignores evidence, overgeneralization) or accept a sound point, and the judge rules with an explanation. Then they close their case and finally *step out of role* to give the verdict the evidence supports.
- **Creative Studio:** journal, mock interview, another perspective, newspaper, character profile, storyboard, persuasive argument or analytical paragraph. Each format has its own live preview, all share the same success criteria, and each ends in a craft note, so choosing a creative format never drops the analytical writing.

### Live classroom (Mission Control → Live)
Students join at `#/join` with a code and a call sign. The projector only shows anonymous, aggregated results; call signs stay on the teacher's roster.
- **Four Corners** and **This or That:** vote, reveal, introduce an evidence card, vote again, and see **how the room moved**.
- **Evidence Showdown:** everyone picks the strongest card for a claim, then a final vote among the top three.
- **Prediction Challenge** and **Response Wall:** anonymous responses that you **moderate** (hide) before revealing.
- **Live Courtroom:** two teams build arguments together (each team sees only its own), object to the other side's arguments, you sustain or overrule from the console, then everyone votes a verdict.
- **Present mode** for the projector, a teacher-only roster, and CSV export of every response.

### Teacher portal: Mission Control
- **Dashboard:** room-by-room progress, anonymous decision and theory tallies, the evidence the class used most, and thinking patterns to address (decisions without evidence, interpretations treated as facts, absolute language, no counter-evidence), each with a teaching move.
- **Novel Engine:** a knowledge base per novel covering chapters, characters, events, an evidence bank (fact vs interpretation), themes with ladders, relationships, techniques and vocabulary. Items can be edited, reordered and marked verified. Optional quotations are tied to an edition and page.
- **Spoiler control:** unlock chapters one at a time or up to a frontier. Students and the mentor only ever receive unlocked knowledge.
- **Add a novel:** title, author, chapters, themes and one of five visual worlds: holographic sci-fi, noir mystery, historical archive, surveillance dystopia, or fantasy atlas. Chapter notes can be pasted in.
- **Mission generator:** choose chapters, theme, engines, outcomes, grouping and length (10 / 20 / 40–50 / 80 min). **Reading demand and thinking demand are set separately.** Drafts are built only from the knowledge base. Anything that can't be drafted becomes a `[Teacher: …]` placeholder with a gap note.
- **Templates:** six built-in mission shapes (Quick Check, Decision Lab, Full Investigation, Trial Day, Maker Studio, Block Expedition). You can also save any mission as a template and apply it to another novel or chapter range. There's also a blank-mission option.
- **Outcome coverage map:** each outcome against your missions, with how many responses were logged and assessed.
- **Mission editor:** every generated word is editable. A publish check blocks placeholders and locked chapters, and warns about unverified facts and outcomes.
- **Preview as student**, with answers stored separately from student data.
- **Review:** each student's decision, evidence, reasoning and revision history, plus editable rubric scoring and an editable draft comment. The teacher finalizes and returns feedback. Export as CSV or JSON.
- **Print / projector** versions of every mission, and an anonymous **projector view** of class results.
- **Curriculum profiles** and an editable **rubric** (interpretation, evidence, reasoning, communication, creativity).
- **Class:** per-cadet default supports. Supports never label ability.

### Accessibility and differentiation
Students can set: text size, wider spacing, high contrast, reduced motion, plain language, short instructions, read-aloud (browser speech), sentence starters, a 2D alternative to 3D, and sound (off by default). All controls are keyboard-operable, with visible focus, a skip link, labelled controls and live regions for feedback. Plain language changes the wording, never the thinking task. Supports are visible to the teacher and never reduce a result. There are no timers, and speed is never measured.

## Curriculum: please read
The Alberta government sites could not be reached from the build environment, so outcome wording could not be verified. The built-in profile therefore lists **only the general and specific outcome headings** of the Alberta ELA (K–9) Program of Studies (1.1–5.2), each marked **unverified**. NovelVerse does not invent bullet-level outcome codes. Before relying on it for reporting, do one of:
- mark each heading verified in **Mission Control → Curriculum** after checking it, or
- paste your own outcomes (`CODE | description`) as a new profile. This also handles any newer Alberta ELA curriculum.

## Ender's Game content: please read
All demo content is original paraphrase: there are **no quotations and no page numbers**. Every chapter summary, character, event and evidence card is marked **needs check**, and students see a "teacher check pending" badge until the teacher confirms it against the book. Chapters 14–15 are locked and left empty to avoid spoilers. The dilemma's consequences are always labelled as simulations.

## Privacy
Demo mode uses synthetic call signs only. There are no accounts, names, emails or recordings, and nothing is sent to the internet. In live sessions run through the classroom server, messages pass through that laptop's memory on the school network and are never stored there. Students are asked not to use real names. All state lives in the browser's local storage, falling back to memory if storage is blocked. Real classroom use needs a school-approved, access-controlled backend designed around Alberta's privacy obligations for school authorities, with data minimization, retention limits and teacher-only access to identifiable work.

## Architecture
```
src/
  data/        types.ts (content schema), curriculum, novels/, missions/, synthetic class
  lib/         reasoning signals, mentor, case strength, generator, spoiler filters,
               class analytics, sound, speech, router
  state/       zustand store with persisted, versioned state (migrations in store.ts)
  live/        live-session logic (pure, unit-tested), transports, host/student hooks, results view
  student/     story map, mission path, step player, steps/ (one per engine), 3D/2D scene
  teacher/     dashboard, novel editor, generator, mission/step editors, review,
               curriculum, class, print, projector
  styles/      design tokens + five novel skins + accessibility modes
tests/unit     vitest: logic, content integrity, generator, store
tests/e2e      Playwright: full playthroughs, live sessions, relay, new-unit creation, axe scans
server/        classroom.mjs: static server + in-memory WebSocket relay for live sessions
```
Every engine reads the same novel knowledge base, so adding a novel requires no code changes. The 3D scene is lazy-loaded and only downloads when used.

### Immersion and performance
- A 3D command deck, plus a **3D battle replay** of the student's own orders after the decision. It's always labelled as a simulation, with a 2D version and a static final frame under reduced motion.
- Typed "transmissions" (skippable, and given to screen readers as full text), room-to-room warp transitions, and an optional ambient soundscape for each visual world. Sound and ambience are off by default.
- Engines and 3D scenes are lazy-loaded, 3D stops rendering when off-screen or the tab is hidden, and pixel ratio is capped for school devices.

## Roadmap
See [`docs/PROJECT.md`](docs/PROJECT.md) → Next priorities. In short: a hosted relay and sign-in for use beyond one network, document import, a second public-domain demo novel, and an optional server-side AI mentor behind the `MentorProvider` interface. That mentor would be grounded only in unlocked knowledge and follow the same rules: questions only, no quotations, no finished answers.
