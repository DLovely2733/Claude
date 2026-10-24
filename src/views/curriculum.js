// Priority 1: accurate curriculum extraction, review and mapping.

import { h, toast, modal, field, input, select, textarea, checkbox, download, badge } from '../ui.js';
import { getState, update, activeVersion, addVersion } from '../store.js';
import { go, rerender } from '../router.js';
import { parseCurriculumText, layoutPdfPages, parseCurriculumJson, htmlToText } from '../curriculum/parser.js';
import { readPdfPages } from '../curriculum/pdf.js';
import { diffVersions, lessonImpact } from '../curriculum/diff.js';
import { migrateLesson } from '../linking.js';
import { CONTENT_AREAS, OFFICIAL_SOURCES, TARGET_CURRICULUM, BUNDLED_CURRICULUM, STATEMENT_KEYS, STATEMENT_TYPES, suggestedAreaIds, areasOf, statementsOf } from '../curriculum/model.js';
import { uid, todayISO } from '../util.js';
import { pageHeader, areaNames, empty } from './common.js';

export function renderCurriculum(sub, id) {
  if (sub === 'review') return renderReview(id);
  if (sub === 'browse') return renderBrowse(id);
  if (sub === 'compare') return renderCompare();
  return renderOverview();
}

// ---------------------------------------------------------------------------
// Overview + ingestion
// ---------------------------------------------------------------------------

function renderOverview() {
  const s = getState();
  return h(
    'section',
    {},
    pageHeader('Curriculum', `${TARGET_CURRICULUM.title}. ${TARGET_CURRICULUM.status}. This is the authoritative framework for every lesson and assessment in this app.`),
    ingestPanel(),
    h('h2', {}, 'Curriculum versions'),
    s.versions.length
      ? h(
          'table',
          { class: 'table' },
          h('thead', {}, h('tr', {}, ['Version', 'Source', 'Uploaded', 'Grade 9 outcomes', 'Verified', 'Status', ''].map((t) => h('th', {}, t)))),
          h(
            'tbody',
            {},
            s.versions.map((v) => {
              const g9 = v.outcomes.filter((o) => o.grade === 9 || o.grade == null);
              const verified = g9.filter((o) => o.verified).length;
              const isActive = v.id === s.activeVersionId;
              return h(
                'tr',
                {},
                h('td', {}, h('strong', {}, v.label), isActive ? [' ', badge('Active', 'ok')] : null),
                h('td', {}, v.sourceName || '—', h('br'), h('small', {}, v.sourceType)),
                h('td', {}, v.uploadedAt?.slice(0, 10)),
                h('td', {}, String(g9.length)),
                h('td', {}, `${verified} / ${g9.length}`),
                h('td', {}, verified === g9.length && g9.length ? badge('Teacher-verified', 'ok') : badge('Needs review', 'warn')),
                h(
                  'td',
                  { class: 'row-actions' },
                  h('a', { class: 'button small', href: `#/curriculum/review/${v.id}` }, 'Review & map'),
                  h('a', { class: 'button small ghost', href: `#/curriculum/browse/${v.id}` }, 'Original wording'),
                  !isActive ? h('button', { class: 'small ghost', onclick: () => setActive(v.id) }, 'Make active') : null,
                  h('button', { class: 'small ghost', onclick: () => download(`curriculum-${v.label.replace(/\W+/g, '-')}.json`, JSON.stringify({ label: v.label, outcomes: v.outcomes }, null, 2)) }, 'Export'),
                  h('button', { class: 'small danger ghost', onclick: () => deleteVersion(v) }, 'Delete')
                )
              );
            })
          )
        )
      : empty('No curriculum has been uploaded yet. The app will not substitute the 2005 curriculum or generate outcomes on its own.'),
    s.versions.length > 1 ? h('p', {}, h('a', { class: 'button', href: '#/curriculum/compare' }, 'Compare versions and review changes →')) : null,
    contentAreaSummary()
  );
}

export async function loadBundledCurriculum() {
  if (getState().versions.some((v) => v.id === BUNDLED_CURRICULUM.id)) {
    toast('The June 2026 draft is already loaded.', 'info');
    return go(`curriculum/review/${BUNDLED_CURRICULUM.id}`);
  }
  try {
    const res = await fetch(BUNDLED_CURRICULUM.path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const version = await res.json();
    version.uploadedAt = new Date().toISOString();
    addVersion(version, `Loaded ${version.label} (${version.sourceName})`);
    toast(`Loaded ${version.outcomes.length} Grade 9 outcomes. Verify each one against the source before relying on it.`, 'info');
    go(`curriculum/review/${version.id}`);
  } catch (e) {
    toast(`Could not load the bundled curriculum (${e.message}). Upload the PDF instead.`, 'error');
  }
}

function setActive(id) {
  update((s) => (s.activeVersionId = id), 'Changed active curriculum version');
  toast('Active curriculum version changed. Lessons created from other versions will show a review warning.', 'warn');
  rerender();
}

function deleteVersion(v) {
  const used = getState().lessons.filter((l) => l.curriculumVersionId === v.id).length;
  modal('Delete curriculum version?', h('p', {}, `“${v.label}” will be removed. ${used ? `${used} lesson(s) were created from it and will show a warning.` : ''}`), [
    { label: 'Cancel', class: 'ghost', onClick: (c) => c() },
    {
      label: 'Delete',
      class: 'danger',
      onClick: (c) => {
        update((s) => {
          s.versions = s.versions.filter((x) => x.id !== v.id);
          if (s.activeVersionId === v.id) s.activeVersionId = s.versions[0]?.id || null;
        }, `Deleted curriculum version ${v.label}`);
        c();
        rerender();
      },
    },
  ]);
}

function ingestPanel() {
  const status = h('div', { class: 'ingest-status', 'aria-live': 'polite' });
  const fileInput = h('input', { type: 'file', accept: '.pdf,.txt,.html,.htm,.json,application/pdf,text/plain,text/html,application/json' });
  fileInput.addEventListener('change', () => fileInput.files[0] && ingestFile(fileInput.files[0], status));
  let pasted = '';
  let autoUrl = OFFICIAL_SOURCES[1].url;

  return h(
    'div',
    { class: 'card ingest' },
    h('h2', {}, 'Add the official curriculum'),
    h('p', {}, 'Official sources: ', OFFICIAL_SOURCES.map((src, i) => [i ? ' · ' : '', h('a', { href: src.url, target: '_blank', rel: 'noopener' }, src.label)])),
    getState().versions.some((v) => v.id === BUNDLED_CURRICULUM.id)
      ? null
      : h('div', { class: 'alert info' },
          h('strong', {}, 'June 2026 draft available. '),
          `Extracted word-for-word from ${BUNDLED_CURRICULUM.source}: 7 Grade 9 learning outcomes with their knowledge, understanding and skills statements. `,
          h('button', { class: 'small', onclick: loadBundledCurriculum }, 'Load the June 2026 draft')),
    h('div', { class: 'grid3' },
      h('div', { class: 'ingest-opt' },
        h('h3', {}, 'A. Try automatic retrieval'),
        h('p', { class: 'help' }, 'Attempts to download the document directly. Most government sites block this from a web app; if it fails you will be asked to upload a copy.'),
        input(autoUrl, (v) => (autoUrl = v), { 'aria-label': 'Curriculum URL', type: 'url' }),
        h('button', { onclick: () => tryAutomatic(autoUrl, status) }, 'Try retrieval')),
      h('div', { class: 'ingest-opt' },
        h('h3', {}, 'B. Upload the curriculum'),
        h('p', { class: 'help' }, 'Recommended. Download the June 2026 draft Social Studies 7–9 PDF from LearnAlberta (or another authorized copy) and upload it here. Text (.txt), saved web pages (.html) and exported JSON also work.'),
        fileInput),
      h('div', { class: 'ingest-opt' },
        h('h3', {}, 'C. Paste text'),
        h('p', { class: 'help' }, 'Copy the Grade 9 section from LearnAlberta and paste it. Keep the headings (Organizing Idea, Guiding Question, Learning Outcome, Knowledge, Understanding, Skills & Procedures).'),
        textarea('', (v) => (pasted = v), { rows: 4, 'aria-label': 'Pasted curriculum text' }),
        h('button', { onclick: () => (pasted.trim() ? finishIngest({ lines: pasted, sourceName: 'Pasted text', sourceType: 'text' }, status) : toast('Paste the curriculum text first.', 'warn')) }, 'Extract from text'))
    ),
    status
  );
}

async function tryAutomatic(url, status) {
  status.textContent = `Trying ${url} …`;
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get('content-type') || '';
    if (type.includes('pdf')) {
      const buf = await res.arrayBuffer();
      return ingestPdf(buf, url, status);
    }
    const text = await res.text();
    return finishIngest({ lines: type.includes('html') ? htmlToText(text) : text, sourceName: url, sourceType: type.includes('html') ? 'web page' : 'text', requireOutcomes: true }, status);
  } catch (e) {
    status.replaceChildren(
      h('div', { class: 'alert warn' },
        h('strong', {}, 'Automatic retrieval was not possible. '),
        `(${e.message || e}) Please upload a PDF or other authorized copy of the June 2026 draft Grade 7–9 Social Studies curriculum using option B. The app will not substitute the 2005 curriculum or fabricate outcomes.`)
    );
  }
}

async function ingestFile(file, status) {
  status.textContent = `Reading ${file.name} …`;
  try {
    if (/\.pdf$/i.test(file.name) || file.type === 'application/pdf') return ingestPdf(await file.arrayBuffer(), file.name, status);
    const text = await file.text();
    if (/\.json$/i.test(file.name)) {
      const parsed = parseCurriculumJson(text);
      return confirmVersion({ parsed, sourceName: file.name, sourceType: 'JSON', sourceLines: [] }, status);
    }
    const isHtml = /\.html?$/i.test(file.name);
    return finishIngest({ lines: isHtml ? htmlToText(text) : text, sourceName: file.name, sourceType: isHtml ? 'web page' : 'text' }, status);
  } catch (e) {
    console.error(e);
    status.replaceChildren(h('div', { class: 'alert error' }, `Could not read ${file.name}: ${e.message}`));
  }
}

async function ingestPdf(buf, name, status) {
  const { pages, numPages } = await readPdfPages(buf, (n, total) => (status.textContent = `Extracting text: page ${n} of ${total} …`));
  const lines = layoutPdfPages(pages);
  if (lines.length < 5) {
    status.replaceChildren(h('div', { class: 'alert error' }, 'This PDF has little or no selectable text (it may be scanned). Please upload a text-based copy or paste the text.'));
    return;
  }
  return finishIngest({ lines, sourceName: name, sourceType: `PDF (${numPages} pages)` }, status);
}

function finishIngest({ lines, sourceName, sourceType, requireOutcomes }, status) {
  const parsed = parseCurriculumText(lines);
  const sourceLines = typeof lines === 'string' ? lines.split(/\r?\n/).filter((t) => t.trim()).map((text) => ({ text, page: null })) : lines;
  if (!parsed.outcomes.length) {
    status.replaceChildren(
      h('div', { class: 'alert error' },
        h('strong', {}, 'No learning outcomes were recognised. '),
        requireOutcomes
          ? 'The retrieved page does not contain the curriculum text (LearnAlberta pages are often built by scripts). Please upload the PDF instead.'
          : 'Check that this is the official curriculum document with its headings. You can still save the source and enter outcomes manually, copying the exact wording.',
        requireOutcomes ? null : h('div', {}, h('button', { onclick: () => confirmVersion({ parsed, sourceName, sourceType, sourceLines }, status) }, 'Save source and enter outcomes manually')))
    );
    return;
  }
  return confirmVersion({ parsed, sourceName, sourceType, sourceLines }, status);
}

function confirmVersion({ parsed, sourceName, sourceType, sourceLines }, status) {
  let label = `June 2026 draft – uploaded ${todayISO()}`;
  let notes = '';
  const g9 = parsed.outcomes.filter((o) => o.grade === 9).length;
  const body = h(
    'div',
    {},
    h('p', {}, `Found ${parsed.outcomes.length} learning outcome(s) (${g9} in Grade 9) and ${parsed.stats.statements ?? '—'} knowledge, understanding and skills statements.`),
    parsed.stats.grades?.length ? h('p', {}, `Grades detected: ${parsed.stats.grades.join(', ')}`) : h('p', { class: 'alert warn' }, 'No grade headings were detected. You will assign grades during review.'),
    parsed.warnings.length ? h('details', {}, h('summary', {}, `${parsed.warnings.length} extraction warning(s)`), h('ul', {}, parsed.warnings.slice(0, 40).map((w) => h('li', {}, w)))) : null,
    field('Version name', input(label, (v) => (label = v))),
    field('Notes (source, date published, what changed)', textarea('', (v) => (notes = v))),
    h('p', { class: 'help' }, 'Every outcome starts as “Needs review”. Check each one against the source document before using it for verified lessons.')
  );
  modal('Save curriculum version', body, [
    { label: 'Cancel', class: 'ghost', onClick: (c) => c() },
    {
      label: 'Save and review',
      onClick: (c) => {
        const id = uid('cv');
        update((s) => {
          s.versions.push({ id, label, notes, sourceName, sourceType, uploadedAt: new Date().toISOString(), outcomes: parsed.outcomes, warnings: parsed.warnings, stats: parsed.stats, sourceLines });
          if (!s.activeVersionId) s.activeVersionId = id;
        }, `Uploaded curriculum version ${label}`);
        status.textContent = '';
        c();
        go(`curriculum/review/${id}`);
      },
    },
  ]);
}

// ---------------------------------------------------------------------------
// Review & mapping
// ---------------------------------------------------------------------------

const reviewFilter = { grade: '9', area: 'all', status: 'all' };

function renderReview(versionId) {
  const s = getState();
  const v = s.versions.find((x) => x.id === versionId);
  if (!v) return empty('Curriculum version not found.', h('a', { href: '#/curriculum' }, 'Back'));
  const save = (msg) => update(() => {}, msg);

  const outcomes = v.outcomes.filter(
    (o) =>
      (reviewFilter.grade === 'all' || String(o.grade) === reviewFilter.grade || (reviewFilter.grade === '9' && o.grade == null)) &&
      (reviewFilter.area === 'all' || (reviewFilter.area === 'none' ? !areasOf(o).length : areasOf(o).includes(reviewFilter.area))) &&
      (reviewFilter.status === 'all' || (reviewFilter.status === 'verified') === Boolean(o.verified))
  );
  const grades = [...new Set(v.outcomes.map((o) => o.grade))];

  return h(
    'section',
    {},
    pageHeader(
      `Review: ${v.label}`,
      'Check each extracted outcome against the source document. Correct extraction errors only — the original wording must be preserved. Assign each outcome to a Grade 9 content area.',
      h('a', { class: 'button ghost', href: '#/curriculum' }, '← All versions'),
      h('button', { class: 'ghost', onclick: () => applySuggestions(v) }, 'Suggest content areas for unassigned'),
      h('button', { class: 'ghost', onclick: () => addOutcome(v) }, '+ Add outcome manually')
    ),
    v.warnings?.length ? h('details', { class: 'card' }, h('summary', {}, `${v.warnings.length} extraction warning(s) to resolve`), h('ul', {}, v.warnings.map((w) => h('li', {}, w)))) : null,
    h(
      'div',
      { class: 'filters' },
      field('Grade', select([{ id: 'all', label: 'All grades' }, ...grades.map((g) => ({ id: String(g), label: g == null ? 'Unknown' : `Grade ${g}` }))], reviewFilter.grade, (x) => ((reviewFilter.grade = x), rerender()))),
      field('Content area', select([{ id: 'all', label: 'All' }, { id: 'none', label: 'Unassigned' }, ...CONTENT_AREAS.map((a) => ({ id: a.id, label: a.name }))], reviewFilter.area, (x) => ((reviewFilter.area = x), rerender()))),
      field('Status', select([{ id: 'all', label: 'All' }, { id: 'unverified', label: 'Needs review' }, { id: 'verified', label: 'Verified' }], reviewFilter.status, (x) => ((reviewFilter.status = x), rerender())))
    ),
    outcomes.length ? outcomes.map((o) => outcomeReviewCard(v, o, save)) : empty('No outcomes match these filters.')
  );
}

function outcomeReviewCard(v, o, save) {
  const sugg = suggestedAreaIds(o);
  const sourcePanel = h('div', { class: 'source-panel', hidden: true });
  const toggleSource = () => {
    if (!sourcePanel.hidden) return (sourcePanel.hidden = true);
    const pages = new Set([o.sourcePage, ...[...statementsOf(o)].map((s) => s.sourcePage)].filter(Boolean));
    const lines = (v.sourceLines || []).filter((l) => pages.has(l.page));
    sourcePanel.replaceChildren(h('h4', {}, `Source text${pages.size ? ` – page(s) ${[...pages].join(', ')}` : ''}`), lines.length ? h('pre', {}, lines.map((l) => l.text).join('\n')) : h('p', {}, 'Source text is not available for this outcome. Check the original document.'));
    sourcePanel.hidden = false;
  };

  return h(
    'article',
    { class: `card outcome-card ${o.verified ? 'is-verified' : ''}`, id: `o-${o.id}` },
    h(
      'header',
      { class: 'outcome-head' },
      h('div', {}, h('code', {}, o.id), ' ', o.grade != null ? badge(`Grade ${o.grade}`, 'neutral') : badge('Grade unknown', 'warn'), ' ', o.sourcePage ? h('small', {}, `p. ${o.sourcePage}`) : null),
      h('div', { class: 'row-actions' },
        h('button', { class: 'small ghost', onclick: toggleSource }, 'Show source'),
        checkbox('Checked against the source document', o.verified, (val) => {
          o.verified = val;
          for (const key of STATEMENT_KEYS) for (const x of o[key]) x.verified = val;
          o.verifiedAt = val ? new Date().toISOString() : null;
          save(`${val ? 'Verified' : 'Un-verified'} outcome ${o.id}`);
          rerender();
        }))
    ),
    sourcePanel,
    h('div', { class: 'grid2' },
      field('Grade', select([{ id: '', label: 'Unknown' }, ...[7, 8, 9].map((g) => ({ id: String(g), label: `Grade ${g}` }))], o.grade == null ? '' : String(o.grade), (x) => ((o.grade = x ? Number(x) : null), save()))),
      h('div', { class: 'field' },
        h('strong', {}, 'Grade 9 content area(s) '),
        o.contentAreaSource === 'suggested' ? badge('Suggested – please confirm', 'warn') : areasOf(o).length ? badge('Teacher-confirmed', 'ok') : null,
        CONTENT_AREAS.map((a) => checkbox(a.name, areasOf(o).includes(a.id), (val) => {
          const cur = new Set(areasOf(o));
          val ? cur.add(a.id) : cur.delete(a.id);
          o.contentAreaIds = CONTENT_AREAS.map((x) => x.id).filter((id) => cur.has(id));
          delete o.contentAreaId;
          o.contentAreaSource = 'teacher';
          save();
        })),
        o.contentAreaSource === 'suggested' ? h('button', { class: 'tiny', onclick: () => ((o.contentAreaSource = 'teacher'), save(), rerender()) }, 'Confirm areas') : null,
        h('p', { class: 'help' }, sugg.length ? `Keyword suggestion: ${areaNames(sugg)}` : 'No keyword suggestion.'))
    ),
    verbatimField('Organizing idea', o, 'organizingIdea', save),
    verbatimField('Guiding question', o, 'guidingQuestion', save),
    verbatimField('Learning outcome', o, 'text', save, true),
    h('div', { class: 'grid3 statements' }, STATEMENT_KEYS.map((key) => statementColumn(o, key, save)))
  );
}

function verbatimField(label, obj, prop, save, track = false) {
  const changed = track && obj.extractedText && obj.extractedText !== obj[prop];
  return field(
    label,
    textarea(obj[prop], (val) => {
      obj[prop] = val;
      if (track) obj.teacherEdited = obj.extractedText !== val;
      save();
    }, { rows: 2 }),
    changed ? `Edited by teacher. Extracted text: “${obj.extractedText}”` : null
  );
}

function statementColumn(o, key, save) {
  const list = o[key];
  const t = STATEMENT_TYPES[key];
  const renumber = () => list.forEach((s, i) => !s.manualId && (s.id = s.id || `${o.id}-${t.code}${i + 1}`));
  return h(
    'div',
    { class: 'stmt-col' },
    h('h4', {}, `${t.label} (${list.length})`),
    list.map((st, i) =>
      h(
        'div',
        { class: `stmt level-${st.level || 1}` },
        h('code', {}, st.id),
        textarea(st.text, (val) => ((st.text = val), (st.teacherEdited = val !== st.extractedText), save()), { rows: 2, 'aria-label': `${t.label} statement ${st.id}` }),
        st.teacherEdited ? h('small', { class: 'help' }, `Extracted: “${st.extractedText}”`) : null,
        h('div', { class: 'stmt-tools' },
          i > 0 ? h('button', { class: 'tiny ghost', title: 'Merge with the statement above (fixes a wrongly split line)', onclick: () => {
            const prev = list[i - 1];
            prev.text = `${prev.text} ${st.text}`;
            prev.extractedText = `${prev.extractedText} ${st.extractedText}`;
            list.splice(i, 1);
            save(`Merged statements in ${o.id}`);
            rerender();
          } }, '⤒ Merge up') : null,
          h('button', { class: 'tiny ghost', title: 'Split at the first sentence break', onclick: () => {
            const m = st.text.match(/^(.+?[.;])\s+(.+)$/);
            if (!m) return toast('No sentence break found to split on.', 'warn');
            st.text = m[1];
            st.extractedText = m[1];
            list.splice(i + 1, 0, { id: `${st.id}b`, text: m[2], extractedText: m[2], level: st.level, sourcePage: st.sourcePage, verified: false });
            save(`Split statement ${st.id}`);
            rerender();
          } }, 'Split'),
          h('button', { class: 'tiny ghost', title: 'Move to another type', onclick: () => moveStatement(o, key, i, save) }, 'Move'),
          h('button', { class: 'tiny ghost danger', title: 'Remove (not curriculum text)', onclick: () => {
            list.splice(i, 1);
            save(`Removed statement ${st.id}`);
            rerender();
          } }, 'Remove'))
      )
    ),
    h('button', { class: 'small ghost', onclick: () => {
      const n = list.length + 1;
      let sid = `${o.id}-${t.code}${n}`;
      while (list.some((s) => s.id === sid)) sid += '′';
      list.push({ id: sid, text: '', extractedText: '', level: 1, verified: false, manual: true });
      renumber();
      save();
      rerender();
    } }, `+ Add ${t.label.toLowerCase()} (copy exact wording)`)
  );
}

function moveStatement(o, fromKey, index, save) {
  const others = STATEMENT_KEYS.filter((k) => k !== fromKey);
  modal('Move statement', h('p', {}, 'Move this statement to:'), [
    ...others.map((k) => ({
      label: STATEMENT_TYPES[k].label,
      onClick: (c) => {
        const [st] = o[fromKey].splice(index, 1);
        st.id = `${o.id}-${STATEMENT_TYPES[k].code}${o[k].length + 1}`;
        while ([...statementsOf(o)].some((x) => x.id === st.id)) st.id += '′';
        o[k].push(st);
        save(`Moved statement in ${o.id}`);
        c();
        rerender();
      },
    })),
    { label: 'Cancel', class: 'ghost', onClick: (c) => c() },
  ]);
}

function applySuggestions(v) {
  let n = 0;
  update(() => {
    for (const o of v.outcomes) {
      if (areasOf(o).length) continue;
      const sg = suggestedAreaIds(o);
      if (sg.length) (o.contentAreaIds = sg), (o.contentAreaSource = 'suggested'), n++;
    }
  }, 'Applied content-area suggestions');
  toast(`${n} outcome(s) given a suggested content area. Please check each one.`, 'warn');
  rerender();
}

function addOutcome(v) {
  const g = 9;
  const n = v.outcomes.filter((o) => o.grade === g).length + 1;
  let id = `G${g}-LO${n}`;
  while (v.outcomes.some((o) => o.id === id)) id += 'm';
  update(() => v.outcomes.push({ id, grade: g, organizingIdea: '', guidingQuestion: '', text: '', extractedText: '', knowledge: [], understanding: [], skills: [], contentAreaIds: [], verified: false, manual: true }), `Added outcome ${id} manually`);
  rerender();
  setTimeout(() => document.getElementById(`o-${id}`)?.scrollIntoView({ behavior: 'smooth' }), 50);
}

// ---------------------------------------------------------------------------
// Original wording (read-only, preserves official organization)
// ---------------------------------------------------------------------------

function renderBrowse(versionId) {
  const s = getState();
  const v = versionId ? s.versions.find((x) => x.id === versionId) : activeVersion();
  if (!v) return empty('No curriculum loaded.', h('a', { href: '#/curriculum' }, 'Upload curriculum'));
  const g9 = v.outcomes.filter((o) => o.grade === 9 || o.grade == null);
  const groups = [];
  for (const o of g9) {
    let g = groups.find((x) => x.oi === o.organizingIdea);
    if (!g) groups.push((g = { oi: o.organizingIdea, items: [] }));
    g.items.push(o);
  }
  return h(
    'section',
    { class: 'browse' },
    pageHeader(`Grade 9 – original curriculum wording`, `${v.label}. Shown in the document’s own order and organization.`, h('a', { class: 'button ghost', href: '#/curriculum' }, '← Versions')),
    groups.map((g) =>
      h('div', { class: 'oi-group' },
        h('h2', {}, g.oi ? `Organizing Idea: ${g.oi}` : 'Organizing Idea: (not captured)'),
        g.items.map((o) =>
          h('article', { class: 'card' },
            o.guidingQuestion ? h('p', { class: 'gq' }, h('strong', {}, 'Guiding Question: '), o.guidingQuestion) : null,
            h('p', { class: 'lo' }, h('strong', {}, 'Learning Outcome: '), o.text || h('em', {}, '(missing)')),
            h('p', {}, h('code', {}, o.id), ' ', o.verified ? badge('✔ Verified', 'ok') : badge('Needs review', 'warn'), ' ', badge(areaNames(areasOf(o)), areasOf(o).length ? 'neutral' : 'warn')),
            h('div', { class: 'grid3' }, STATEMENT_KEYS.map((k) => h('div', {}, h('h4', {}, STATEMENT_TYPES[k].label), h('ul', {}, o[k].map((st) => h('li', { class: `level-${st.level || 1}` }, st.text)))))),
            h('a', { class: 'button', href: `#/new-lesson/${encodeURIComponent(o.id)}` }, 'Create accessible lesson for this outcome →')
          )
        )
      )
    )
  );
}

// ---------------------------------------------------------------------------
// Compare versions
// ---------------------------------------------------------------------------

const compareSel = { from: null, to: null };

function renderCompare() {
  const s = getState();
  if (s.versions.length < 2) return empty('Upload a second curriculum version to compare.', h('a', { href: '#/curriculum' }, 'Back'));
  compareSel.from ||= s.versions[s.versions.length - 2].id;
  compareSel.to ||= s.versions[s.versions.length - 1].id;
  const from = s.versions.find((v) => v.id === compareSel.from);
  const to = s.versions.find((v) => v.id === compareSel.to);
  const opts = s.versions.map((v) => ({ id: v.id, label: v.label }));
  const diff = from && to && from !== to ? diffVersions(from, to, { grade: 9 }) : null;
  const affected = diff ? s.lessons.filter((l) => l.curriculumVersionId === from.id) : [];

  return h(
    'section',
    {},
    pageHeader('Compare curriculum versions', 'Review what changed in a revised draft. Lessons keep working; you decide when to move each one to the new version.', h('a', { class: 'button ghost', href: '#/curriculum' }, '← Versions')),
    h('div', { class: 'filters' }, field('Earlier version', select(opts, compareSel.from, (x) => ((compareSel.from = x), rerender()))), field('Revised version', select(opts, compareSel.to, (x) => ((compareSel.to = x), rerender())))),
    !diff
      ? empty('Choose two different versions.')
      : [
          h('p', { class: 'summary' }, ['unchanged', 'modified', 'added', 'removed'].map((k) => badge(`${diff.summary[k]} ${k}`, { unchanged: 'neutral', modified: 'warn', added: 'ok', removed: 'error' }[k]))),
          h('h2', {}, `Lessons created from “${from.label}” (${affected.length})`),
          affected.length
            ? h('table', { class: 'table' }, h('tbody', {}, affected.map((l) => {
                const imp = lessonImpact(l, diff);
                return h('tr', {},
                  h('td', {}, h('a', { href: `#/lesson/${l.id}` }, l.title)),
                  h('td', {}, imp.clean ? badge('No linked statements changed', 'ok') : h('ul', {}, imp.issues.map((i) => h('li', {}, `${i.id}: ${i.status}${i.newText ? ` → “${i.newText}”` : ''}`)))),
                  h('td', {}, h('button', { class: 'small', onclick: () => {
                    const { lesson } = migrateLesson(l, diff, to);
                    update((st) => (st.lessons = st.lessons.map((x) => (x.id === l.id ? lesson : x))), `Moved lesson “${l.title}” to ${to.label}`);
                    toast(imp.clean ? 'Lesson moved to the revised version.' : 'Lesson moved. Review the flagged links in the editor.', imp.clean ? 'info' : 'warn');
                    rerender();
                  } }, `Move to “${to.label}”`)));
              })))
            : h('p', {}, 'No lessons use the earlier version.'),
          h('h2', {}, 'Outcome changes'),
          diff.outcomes.filter((o) => o.status !== 'unchanged').map((o) =>
            h('article', { class: `card diff ${o.status}` },
              h('header', {}, badge(o.status, { modified: 'warn', added: 'ok', removed: 'error' }[o.status]), ' ', h('code', {}, o.old?.id || ''), o.old && o.new ? ' → ' : '', h('code', {}, o.new?.id || '')),
              o.status === 'modified' && o.textChanged ? h('div', { class: 'grid2' }, h('p', { class: 'old' }, o.old.text), h('p', { class: 'new' }, o.new.text)) : h('p', {}, (o.new || o.old).text),
              (o.statements || []).filter((x) => x.status !== 'unchanged').length
                ? h('ul', {}, o.statements.filter((x) => x.status !== 'unchanged').map((x) => h('li', { class: x.status }, `${STATEMENT_TYPES[x.type].label} – ${x.status}: `, x.old ? h('del', {}, x.old.text) : null, x.old && x.new ? ' ' : null, x.new ? h('ins', {}, x.new.text) : null)))
                : null
            )
          ),
        ]
  );
}

// ---------------------------------------------------------------------------

function contentAreaSummary() {
  const s = getState();
  const v = activeVersion();
  return h(
    'div',
    {},
    h('h2', {}, 'Grade 9 content areas'),
    h('p', { class: 'help' }, 'Starting categories identified by Alberta Education. They organize the official outcomes; they do not replace them.'),
    h('div', { class: 'area-grid' }, CONTENT_AREAS.map((a) => {
      const outs = v ? v.outcomes.filter((o) => areasOf(o).includes(a.id) && (o.grade === 9 || o.grade == null)) : [];
      const lessons = s.lessons.filter((l) => l.unit === a.id);
      return h('div', { class: 'card area' }, h('h3', {}, a.name), h('p', { class: 'help' }, a.scope), h('p', {}, badge(`${outs.length} outcome(s)`, outs.length ? 'ok' : 'warn'), ' ', badge(`${lessons.length} lesson(s)`, 'neutral')));
    }))
  );
}
