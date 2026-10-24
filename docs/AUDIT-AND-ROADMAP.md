# Canada Quest – audit, architecture and roadmap

## 1. Audit of the existing application (before this upgrade)

| Area | What existed | Kept? |
| --- | --- | --- |
| Curriculum | Verbatim extract of the June 2026 draft (7 Grade 9 outcomes, 147 statements); PDF/HTML/text ingestion; teacher verification; version comparison and lesson migration | Kept unchanged. It is the source for coverage. |
| Alignment | Lesson → statement traceability with warnings | Kept. Missions reuse it. |
| Individualization | Teacher-controlled profile (text level, narration, choices, pacing, response modes, goals) | Kept and extended with Quest settings. |
| Lessons | Generator, editor, five Canada's Political System lessons linked to G9-LO6 | Kept. Missions play lesson steps directly. |
| Student site | Lesson player, five activities, escape room, supports drawer | Kept. Canada Quest is now the front-page experience. |
| Evidence / reports | Responses, ratings, support levels, printable reports | Kept. Quest writes to the same evidence store. |
| Gaps | No real 3D; only G9-LO6 had learning experiences; no coverage dashboard | Addressed by Stages 1–3 below. |

## 2. Architecture decision

**Plain three.js (no build step), not React Three Fiber.** The app is a set of static ES modules that runs as a hosted artifact, from a USB stick or from any school web server, with no build tooling. React Three Fiber would need a bundler, JSX compilation and React itself, which would be a rewrite of working code. Three.js gives real rendered 3D with the same scene capabilities. It is vendored (`vendor/three`, MIT), with a jsDelivr fallback where `vendor/` isn't hosted.

Migration path, if the project later moves to a full React app in Claude Code:
1. Create a Vite + React + R3F project, and import `src/curriculum`, `src/alignment.js`, `src/store.js`, `src/quest/missions`, `src/quest/coverage.js` and `src/quest/worlds.js` unchanged. They are framework-free.
2. Port `src/quest/scenes/*.js` builders to R3F components one scene at a time; the `register(id, object, {label})` contract maps to an `<Interactive id label>` wrapper.
3. Keep `runner.js` beats as data and render the panel with React components.

### Module map

| Concern | Module |
| --- | --- |
| 3D rendering, camera, picking, labels, walking | `src/quest/engine.js` |
| Low-poly asset kit (canvas-drawn textures, no third-party models) | `src/quest/builders.js` |
| Scenes | `src/quest/scenes/hub.js`, `src/quest/scenes/government.js`, `src/quest/scenes/common.js` |
| Worlds (status, outcomes, planned missions) | `src/quest/worlds.js` |
| Missions (data) | `src/quest/missions/government.js` |
| Mission runner (beats, feedback, evidence, progress) | `src/quest/runner.js` |
| Shell (navigation, modes, settings, 2D) | `src/quest/app.js` |
| Coverage engine | `src/quest/coverage.js`, `src/quest/experiences.js` |
| Mission generation (local templates, teacher approval) | `src/quest/generate.js` |
| Teacher tools | `src/views/quest.js` (Coverage, Canada Quest) |

Reusable components that work today:
- **3D information hotspot** and **narrated exhibit:** `register` + `explore` beats.
- **Interactive timeline / sequence:** `sequence3d` beats on the law path.
- **Object selection:** `select` beats.
- **Sorting with 3D response:** `sort3d` beats (flags rise).
- **Guided decision scenario:** lesson `decision` steps.
- **Map interaction:** `map` beats.
- **Knowledge check:** `select`, `map` and lesson `choice` / `yesno` steps.
- **Mission completion screen.**

## 3. Stage status (honest)

| Stage | Status | Notes |
| --- | --- | --- |
| 1. 3D foundation | **Done** | Real WebGL scenes. Hub with five gateways. Guided Adventure (camera flights to named places) and Free Exploration (arrow keys/WASD, drag to look, on-screen hold buttons). Accessible HTML labels on every interactive object. Highlight rings. Subtitles. Narration. Reduced motion (no camera flights or pulsing). Camera speed. Graphics quality (automatic, Chromebook-friendly redraw only when something changes, pixel ratio 1 on weaker devices). Full 2D mode, used automatically if WebGL is unavailable. |
| 2. Political System world | **Playable, needs teacher review** | Six missions. Together they give every G9-LO6 statement (33 of 33) at least one finished learning experience. Each mission has Discover, Learn, Try, Decide, Show What You Know and Reflect, with feedback, saved progress, evidence and an adult-assisted option. |
| 3. Curriculum infrastructure | **Done for the June 2026 draft** | All 7 Grade 9 outcomes and 147 statements, from the teacher-supplied PDF. Coverage dashboard with Not Built, In Development, Ready for Review and Teacher Approved. **Current coverage: 33 of 147 statements (22%) have finished experiences; 0 are teacher-approved.** Revised curricula can be uploaded in Curriculum. |
| 4. Remaining worlds | **Not built** | Changing Cities, Canada and the World, Decisions That Changed Canada and Living in Canada show their outcomes and planned missions, clearly labelled "Being built". Teachers can already generate approved 2D missions for any outcome that has a linked lesson. |
| 5. Personalization and teacher tools | **Partly done** | Done: supports and Quest settings, mission assignment, preview as student, approval of generated missions, evidence split into independent and with-support, coverage, lesson editing (narration and questions via the lesson editor), photo uploads in lessons, printables. Not yet done: editing mission beats directly (missions are edited through their linked lesson), uploading teaching resources into worlds, photographs or archival media in 3D exhibits. |
| 6. Testing and refinement | **Partly done** | Automated: 16 Node tests (curriculum, alignment, missions, coverage, generator). Browser runs of the hub, both modes, 2D, missions 1–3 and 6 end to end, the coverage dashboard and mission generation, at desktop and phone sizes. Not yet done: testing on real Chromebooks and iPads, screen-reader testing, and review with the student and teacher. |

### Quality checklist: World 4 missions

| Requirement | Status |
| --- | --- |
| Verified curriculum connection | Linked to G9-LO6 statements; **teacher verification pending** (Curriculum → Review, then Coverage → Approve) |
| Meaningful learning objective | Each mission has a goal and essential concepts |
| 3D environment renders | Yes (tested with software WebGL) |
| Interactive | Yes |
| Accessible instructions | Guide text, subtitles, narration, plain-language versions |
| Essential learning without complex movement | Yes. Every beat can be completed from the panel; 2D mode is equivalent |
| Questions give feedback | Yes |
| Progress saved | Yes (this browser) |
| Teacher can preview and review | Yes |
| Works on a classroom device | Designed for it; **not yet tested on physical Chromebooks or iPads** |
| Historical and civic claims reviewed | Claims follow the official statement wording; **teacher review still required** |

## 4. Next steps

1. **Teacher review of World 4.** Verify G9-LO6, preview each mission, and approve statements in Coverage.
2. **Device testing.** Test on the classroom Chromebook and iPad, and set Graphics to "Fast" if the frame rate is low.
3. **World 1: Canada's Changing Cities** (G9-LO1, parts of G9-LO5). A community scene with a timeline slider (1945 → 1970s) that rebuilds houses, roads and industry, plus the "Your town is growing!" placement mission. It reuses `select`, `sort3d`, `sequence3d` and a new `place` beat.
4. **World 2: Canada and the World** (G9-LO3, G9-LO4 international). A museum hall built with the exhibit components. It will not include battlefield simulation; it will use archival photographs with attribution from Library and Archives Canada or the Canadian War Museum, after licence checks.
5. **World 3: Decisions That Changed Canada** (G9-LO2, G9-LO4, G9-LO5). The residential schools and Sixties Scoop exhibit must be built with Indigenous-led sources (for example the National Centre for Truth and Reconciliation), with licensed testimony only, no game mechanics or rewards, and teacher review before release.
6. **World 5: Living in Canada** (G9-LO7). A civic participation mission, a citizenship timeline and rights and responsibilities.
7. **Mission editor.** Edit beats, narration and media directly, and upload resources per world.
