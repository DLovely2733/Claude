# Grade 9 Social Studies – Accessible Lesson Builder

A teacher tool for building student-accessible lessons that stay connected to what the rest of the class is studying. It is built only around the **June 2026 updated Draft Alberta Grade 7–9 Social Studies Curriculum**, released for optional classroom piloting in 2026–2027.

Official sources:
- https://www.alberta.ca/curriculum-social-studies
- https://curriculum.learnalberta.ca/home/en

## Curriculum integrity

- **The app ships with no curriculum wording.** You load the official draft (PDF, saved web page, text or JSON), and the app extracts every Organizing Idea, Guiding Question, Learning Outcome, and Knowledge, Understanding and Skills & Procedures statement word for word, with page references.
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

Their instruction is general Canadian civics written for accessible delivery. **They deliberately ship without curriculum links:** after you upload and verify the official draft, open each lesson and link its Grade 9 outcome and statements. The editor suggests likely matches, and you confirm them. Until then, each lesson shows the unverified warning.

## Running

The app is static HTML/JS with no build step. Data stays in the browser's local storage, so use **Dashboard → Export backup** regularly.

```bash
npm start      # serves on http://localhost:8080
npm test       # unit tests for extraction, diffing, alignment, generation
```

It can also be hosted on any static web server. PDF text extraction uses a vendored copy of pdf.js (`vendor/pdfjs`, Apache-2.0).

## Code map

| Path | Purpose |
| --- | --- |
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
