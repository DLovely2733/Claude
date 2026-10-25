# Grade 9 Social Studies – Accessible Lesson Builder

A teacher tool for building student-accessible lessons that stay connected to what the rest of the class is studying. It is built only around the **June 2026 updated Draft Alberta Grade 7–9 Social Studies Curriculum**, released for optional classroom piloting in 2026–2027.

Official sources:
- https://www.alberta.ca/curriculum-social-studies
- https://curriculum.learnalberta.ca/home/en

## NovelVerse (Grade 9 ELA)

`novelverse/` is a separate app: an interactive novel-study platform for Grade 9 English Language Arts, with an *Ender's Game* demo. See [`novelverse/README.md`](novelverse/README.md). It is published at `/novelverse/` alongside this site.

## Canada Quest (3D)

`index.html#quest` is the 3D learning world, built with three.js.

**Hub.** A plaza with a map of Canada and gateways to five curriculum worlds.

**Inside Canadian Government (G9-LO6) is playable.** It's a civic campus with:
- the Centre Block and Peace Tower
- the House of Commons, the Senate and the Crown
- a seven-step law path
- a map of Canada you can tap
- a street of government services
- a justice quarter: courts, the Charter and the Citizenship Act
- a riding office and a community square

Six missions run through Discover → Learn → Try → Decide → Show What You Know → Reflect. Together they cover every G9-LO6 statement.

**The other four worlds are labelled "Being built".** Each shows its outcomes and planned missions. They have no fake interactions.

**Ways to explore and supports:**
- **Guided Adventure:** the camera moves for you.
- **Free Exploration:** arrow keys or WASD, drag to look, on-screen buttons.
- **2D mode:** the same missions without 3D. It turns on automatically when WebGL isn't available.
- **Supports:** subtitles, narration, reduced motion, camera speed, graphics quality and an adult-assisted mode.

Teacher tools have two new pages:
- **Coverage:** every statement, the experiences that address it, the adapted pathway, the evidence, and a status of Not Built, In Development, Ready for Review or Teacher Approved.
- **Canada Quest:** assign missions, preview them as the student, see independent versus supported evidence, and generate a mission for any outcome from a linked lesson. Generation uses local templates with no external AI. Generated missions need your approval before students see them.

See `docs/AUDIT-AND-ROADMAP.md` for the architecture and an honest status of each build stage.

## Student site

`index.html` is the student-facing lesson and activity site for the Canada's Political System unit:

- **Lessons:** the five lessons in order, played by the accessible lesson player, with progress stars.
- **Escape from Parliament** (`#escape`): a first-person, point-and-click escape room with five rooms, one per lesson:
  1. **Riding Office:** place the three parts of Parliament on the door lock.
  2. **Jurisdiction Vault:** sort objects into federal and provincial chests.
  3. **The Chamber:** order the official bill-to-law steps on the Bill Machine.
  4. **Alberta Room:** balance "helps" and "harder" cards, then write to your MLA.
  5. **Rotunda:** decide who decides, choose a community project, and escape.

  Players turn to look at four walls, tap objects (real buttons, so keyboard and switch access work), collect items in a backpack and solve locks. There is no timer. A 💡 button gives hints in three levels, and hints used are recorded as the support level. Progress is saved so a student can continue later. Every answer is saved as evidence against its lesson and G9-LO6 statements. Bill to Law uses the five-step version when plain-language supports are on.
- **Activities:** Federal or Provincial?, Bill to Law (short version and all seven official steps), Elected or Appointed?, Rights and Responsibilities, and a Review Quiz built from the lessons' questions. Each activity cites the G9-LO6 statements it practises.
- **Supports:** read-aloud, plain language and symbols, text size, number of answer choices, step size, high contrast and reduced motion. These are the same settings as Teacher tools → Student settings.
- **For teachers:** the official G9-LO6 wording, the statements each lesson and activity covers, and a link to the teacher tools (`teacher.html`).

The site reads lessons from the same browser storage as the teacher tools, so lesson edits appear on the site and student responses show up under Evidence. Activity responses are filed under the lesson they practise.

## Curriculum integrity

- **The June 2026 draft is included as a word-for-word extract** (`curriculum/draft-2026-06-ss7-9.json`). It comes from the teacher-supplied *Social_Studies_7_9-2026-10-24.pdf* (12 pages, Government of Alberta): 7 Grade 9 learning outcomes and 147 Knowledge, Understanding and Skills & Procedures statements, with page references. Load it from the Dashboard or the Curriculum page. You can also upload the PDF in the app yourself; the browser extraction produces an identical result.
- To load any other curriculum, upload the official document (PDF, saved web page, text or JSON). The app extracts every Organizing Idea, Guiding Question, Learning Outcome and statement word for word, with page references.
- If the curriculum can't be retrieved automatically (government sites usually block in-browser downloads), the app asks you to upload an authorized copy. It never falls back to the 2005 curriculum and never makes up outcomes.
- Every extracted outcome starts as **Needs review**. Check it against the source ("Show source" displays the extracted page text) and mark it verified. Fixes to extraction errors are recorded next to the extracted wording.
- Every lesson records which curriculum version it was created from. A lesson with no verified link shows **⛔ No verified curriculum connection**. One that needs review (an unverified outcome, an activity with no link, an older version) shows **⚠**.
- You can upload a revised draft at any time. **Curriculum → Compare versions** shows which outcomes and statements were added, removed or changed, lists the lessons affected, and moves each lesson to the new version when you choose. No rebuild is needed.

## Workflow (development priority order)

1. **Curriculum**: upload, extract, review and verify the outcomes. Assign each Grade 9 outcome to one of the five content areas: Canadian Urbanization and Growth, Canadian Collective Security, Canadian Government Policies, Canada's Political System, Citizenship in Canada. The app suggests areas by keyword, and you confirm each one. *Original wording* shows the outcomes in the document's own order.
2. **Student settings**: you choose every support: text level, symbols, narration, visuals, pacing, number of choices, practice repetitions, response methods (tap, speak, type, draw, sort, AAC, yes/no, demonstrate, photo), target support level, contrast and text size. Nothing is inferred from a diagnosis. Individualized goals from the learning plan are kept separate from curriculum outcomes.
3. **Lessons**: pick any Grade 9 outcome and the statements to address, and the generator builds a structured draft from that verbatim wording. Each lesson contains:
   - the official outcome and the knowledge, understanding and skills statements
   - the original expectations and what classmates are doing
   - essential concepts, with plain-language versions
   - individualized goals
   - adapted activities: connect, teach, guided practice, apply, check
   - ways to demonstrate understanding
   - assessment criteria
   - a traceability table: activity → statement → outcome

   Anything that needs subject knowledge is marked **Teacher review**.
4. **Student view**: large touch targets, visuals, optional text-to-speech narration, one step at a time, tasks broken into small parts, and interactive practice: multiple choice, yes/no, tap-to-sort (no dragging needed), sequencing, decision-making with reasons, and open responses (typed, drawn, photographed or teacher-recorded).
5. **Evidence**: responses are captured automatically along with the curriculum version and linked statements. You rate each criterion and record the support level. Ratings on adapted criteria are labelled as *not* showing full achievement of the Grade 9 outcome. Your judgement on the outcome as written is a separate, optional entry.
6. **Print & reports**: teacher lesson plan, student handout with cut-out sort cards, and a progress report that reports adapted-curriculum progress, outcome-as-written judgement and individualized goals separately.

## Demonstration unit: Canada's Political System

Five sample lessons are included:
1. Who makes decisions in Canada?
2. What do federal and provincial governments do?
3. How does an idea become a law?
4. How do government decisions affect our communities?
5. Apply your learning: Make a decision for your community.

All five are linked to the official Grade 9 outcome **G9-LO6**: "Students analyze how power is distributed and exercised in Canada's government, including how laws are made and how rights are protected." Every activity, essential concept and assessment criterion traces to specific G9-LO6 knowledge, understanding and skills statements (e.g. G9-LO6-K8, the formal legislative process). The lesson content follows the official statements, such as the federal and provincial responsibility lists and the steps from bill drafting to Royal Assent.

Each lesson shows **⚠ needs review** until you tick "Checked against the source document" for G9-LO6 in Curriculum → Review. After that, all five show **✔ Verified curriculum connection**.

## Putting it on its own website

The app is a static site: there's no server code and no database, and everything runs in the browser.

1. Run `npm run export`, or `npm run export -- --zip` to also get `dist.zip`. This writes a complete site to `dist/`, including the local copies of Three.js and pdf.js, so it works without internet access apart from Google Fonts.
2. Upload the *contents* of `dist/` to any static host:
   - **GitHub Pages (automatic):** in the repository, go to Settings → Pages and set Source to "GitHub Actions". `.github/workflows/pages.yml` then tests, exports and publishes on every push to the default branch, at `https://<user>.github.io/<repo>/`.
   - **Netlify or Cloudflare Pages:** drag the `dist` folder onto the dashboard, or use build command `npm run export` with output directory `dist`.
   - **A school web server or shared drive:** copy the folder. It must be served over http(s), not opened as `file://`, because browsers block modules from files. For local use, run `npm start`.
3. Student site: `/`. Teacher tools: `/teacher.html`. Deep links work, for example `/#mission-gov-lawmaking` or `/#quest`.

Saved data lives in each browser (localStorage) and is separate for each website address. Students' work stays on the device they used. Use Dashboard → Export backup and Import backup to move it. Printing and file downloads work on your own site; the hosted artifact blocks them.

## Running

The app is static HTML/JS with no build step. Data stays in the browser's local storage, so use **Dashboard → Export backup** regularly.

```bash
npm start      # student site on http://localhost:8080, teacher tools at /teacher.html
npm test       # unit tests for extraction, diffing, alignment, generation
npm install && npm run extract -- <file.pdf> <out.json> <version-id> "<label>"
               # maintainers: re-extract a curriculum PDF into a loadable version file
```

It can also be hosted on any static web server. PDF text extraction uses a vendored copy of pdf.js (`vendor/pdfjs`, Apache-2.0).

## Code map

| Path | Purpose |
| --- | --- |
| `curriculum/draft-2026-06-ss7-9.json` | June 2026 draft, Grade 9: the verbatim extract |
| `src/curriculum/parser.js` | Column-aware PDF layout plus a structure parser that keeps wording verbatim |
| `src/curriculum/diff.js` | Version comparison and lesson impact |
| `src/curriculum/model.js` | Content areas, statement types, lookups |
| `src/alignment.js` | Alignment engine and warnings |
| `src/generator.js` | Accessible lesson draft generation |
| `src/linking.js` | Link suggestions; moving lessons to a new version |
| `src/profile.js` | Individualization settings |
| `src/demo/politicalSystemUnit.js` | Five demonstration lessons |
| `src/views/*` | Teacher and student screens |

Test fixtures (`tests/fixtures.js`) are synthetic text that only mimics the curriculum's *structure*. They are not curriculum content.
