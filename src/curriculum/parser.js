// Curriculum extraction.
//
// Two stages:
//  1. layoutPdfPages(): turns positioned PDF text items into reading-order
//     lines. It is column-aware because Alberta curriculum documents present
//     Knowledge / Understanding / Skills & Procedures side by side.
//  2. parseCurriculumText(): a line-based state machine that recognises the
//     official structure (Grade, Organizing Idea, Guiding Question, Learning
//     Outcome, Knowledge, Understanding, Skills & Procedures) and keeps the
//     extracted wording verbatim.
//
// The parser never fills gaps: anything it cannot place is reported as a
// warning for the teacher to resolve in the review screen.

const HEADING_PATTERNS = [
  { kind: 'organizingIdea', re: /^organi[sz]ing\s+idea\b\s*[:\-–—]?\s*(.*)$/i },
  { kind: 'guidingQuestion', re: /^guiding\s+question\b\s*[:\-–—]?\s*(.*)$/i },
  { kind: 'outcome', re: /^learning\s+outcome\b\s*[:\-–—]?\s*(.*)$/i },
];
const SECTION_PATTERNS = [
  { kind: 'knowledge', re: /^knowledge\s*:?$/i },
  { kind: 'understanding', re: /^understanding\s*:?$/i },
  { kind: 'skills', re: /^skills\s*(?:&|and)\s*procedures\s*:?$/i },
];
const GRADE_RE = /^grade\s+(\d{1,2})\b(.*)$/i;
const BULLET_RE = /^(?:([•●▪■►*])|([◦○–])|(o)\s|(\d{1,2}[.)])|([a-z][.)]))\s*/;
const COLUMN_HEADERS = [
  { kind: 'knowledge', re: /^knowledge$/i },
  { kind: 'understanding', re: /^understanding$/i },
  { kind: 'skills', re: /^skills\s*(?:&|and)\s*procedures$/i },
];
const SECTION_LABEL = { knowledge: 'Knowledge', understanding: 'Understanding', skills: 'Skills & Procedures' };

export function classifyLine(line) {
  const text = line.trim();
  const g = text.match(GRADE_RE);
  if (g && text.length <= 40) return { kind: 'grade', grade: Number(g[1]), rest: g[2].replace(/^[\s:\-–—]+/, '') };
  for (const p of HEADING_PATTERNS) {
    const m = text.match(p.re);
    if (m) return { kind: p.kind, rest: m[1].trim() };
  }
  for (const p of SECTION_PATTERNS) if (p.re.test(text)) return { kind: 'section', section: p.kind };
  return { kind: 'text' };
}

function isStructural(text) {
  const c = classifyLine(text);
  return c.kind !== 'text' && c.kind !== 'section';
}

// ---------------------------------------------------------------------------
// Stage 1: PDF layout
// ---------------------------------------------------------------------------

/**
 * @param {Array<{pageNumber:number, height?:number, items:Array<{str:string,x:number,y:number,width?:number,height?:number}>}>} pages
 *   Item `y` is measured from the top of the page.
 * @returns {Array<{text:string, page:number}>}
 */
export function layoutPdfPages(pages, { gutter = 14 } = {}) {
  const pageLines = pages.map((p) => ({ page: p.pageNumber, height: p.height || 0, lines: groupLines(p.items, gutter) }));

  // Repeated running headers / footers (same text on many pages) are noise.
  const freq = new Map();
  for (const p of pageLines) {
    const seen = new Set();
    for (const l of p.lines) {
      const key = l.text.replace(/\d+/g, '#').trim().toLowerCase();
      if (!seen.has(key)) freq.set(key, (freq.get(key) || 0) + 1), seen.add(key);
    }
  }
  const threshold = Math.max(3, Math.ceil(pages.length * 0.4));
  const isNoise = (l) => {
    const t = l.text.trim();
    if (!t) return true;
    if (/^(page\s*)?\d+(\s*(of|\/)\s*\d+)?$/i.test(t)) return true;
    if (GRADE_RE.test(t) && t.length <= 40) return false;
    if (isStructural(t)) return false;
    const key = t.replace(/\d+/g, '#').toLowerCase();
    return pages.length >= 3 && (freq.get(key) || 0) >= threshold && t.split(/\s+/).length <= 14;
  };

  const out = [];
  let columns = null; // [{kind, x, lines:[]}]
  const flush = () => {
    if (!columns) return;
    for (const col of columns) {
      out.push({ text: SECTION_LABEL[col.kind], page: col.page });
      out.push(...col.lines);
    }
    columns = null;
  };

  for (const p of pageLines) {
    for (const line of p.lines) {
      if (isNoise(line)) continue;
      const headers = detectColumnHeaders(line);
      if (headers) {
        // A repeated header row on a continuation page keeps the same table.
        if (!columns) columns = headers.map((h) => ({ ...h, page: p.page, lines: [] }));
        continue;
      }
      if (columns && isStructural(line.text)) flush();
      if (columns) {
        // Assign individual items (not gap-merged segments) so narrow gutters
        // between table columns never merge text from neighbouring columns.
        const buckets = new Map();
        for (const it of line.items) {
          const col = pickColumn(columns, it.x);
          if (!buckets.has(col)) buckets.set(col, []);
          buckets.get(col).push(it);
        }
        for (const [col, items] of buckets) {
          const text = joinItems(items);
          if (text) col.lines.push({ text, page: p.page });
        }
      } else {
        out.push({ text: line.text, page: p.page });
      }
    }
  }
  flush();
  return out;
}

function groupLines(items, gutter) {
  const sorted = items
    .filter((i) => i.str && i.str.trim())
    .map((i) => ({ ...i, width: i.width ?? i.str.length * 5, height: i.height ?? 10 }))
    .sort((a, b) => a.y - b.y || a.x - b.x);
  const lines = [];
  for (const it of sorted) {
    const tol = Math.max(2, it.height * 0.45);
    let line = lines.find((l) => Math.abs(l.y - it.y) <= tol);
    if (!line) lines.push((line = { y: it.y, items: [] }));
    line.items.push(it);
  }
  lines.sort((a, b) => a.y - b.y);
  return lines.map((l) => {
    l.items.sort((a, b) => a.x - b.x);
    const items = l.items;
    const segments = [];
    let cur = null;
    for (const it of l.items) {
      const gap = cur ? it.x - cur.end : Infinity;
      if (cur && gap <= gutter) {
        cur.text += (gap > 1 && !cur.text.endsWith(' ') && !it.str.startsWith(' ') ? ' ' : '') + it.str;
        cur.end = it.x + it.width;
      } else {
        cur = { x: it.x, end: it.x + it.width, text: it.str };
        segments.push(cur);
      }
    }
    for (const s of segments) s.text = s.text.replace(/\s+/g, ' ').trim();
    return { y: l.y, items, segments, text: segments.map((s) => s.text).join(' ').trim() };
  });
}

function joinItems(items) {
  let text = '';
  let end = null;
  for (const it of items) {
    const gap = end == null ? 0 : it.x - end;
    text += (end != null && gap > 1 && !text.endsWith(' ') && !it.str.startsWith(' ') ? ' ' : '') + it.str;
    end = it.x + it.width;
  }
  return text.replace(/\s+/g, ' ').trim();
}

function detectColumnHeaders(line) {
  if (line.segments.length < 2) return null;
  const found = [];
  for (const seg of line.segments) {
    const h = COLUMN_HEADERS.find((c) => c.re.test(seg.text));
    if (!h) return null;
    found.push({ kind: h.kind, x: seg.x });
  }
  return found.sort((a, b) => a.x - b.x);
}

function pickColumn(columns, x) {
  let best = columns[0];
  for (const c of columns) if (x + 12 >= c.x) best = c;
  return best;
}

// ---------------------------------------------------------------------------
// Stage 2: structure
// ---------------------------------------------------------------------------

export function htmlToText(html) {
  return String(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<(br|\/p|\/div|\/h\d|\/li|\/tr|\/td|\/th|p|div|h\d|tr)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&rsquo;/g, '’')
    .replace(/&quot;/g, '"');
}

/**
 * @param {string|Array<{text:string,page?:number}>} input
 * @returns {{outcomes:Array, warnings:string[], stats:object}}
 */
export function parseCurriculumText(input) {
  const lines = (typeof input === 'string' ? input.split(/\r?\n/).map((text) => ({ text, page: null })) : input)
    .map((l) => ({ text: l.text.replace(/\s+/g, ' ').trim(), page: l.page ?? null }))
    .filter((l) => l.text);

  const outcomes = [];
  const warnings = [];
  const counters = new Map();
  const ctx = { grade: null, organizingIdea: '', guidingQuestion: '' };
  let field = null; // which free-text field continuation lines extend
  let outcome = null;
  let section = null;
  let current = null; // current statement
  let sawBullet = false;
  const unplaced = [];

  const newOutcome = (text, page) => {
    const g = ctx.grade ?? '?';
    const n = (counters.get(g) || 0) + 1;
    counters.set(g, n);
    outcome = {
      id: `G${g}-LO${n}`,
      grade: ctx.grade,
      organizingIdea: ctx.organizingIdea,
      guidingQuestion: ctx.guidingQuestion,
      text,
      extractedText: text,
      sourcePage: page,
      knowledge: [],
      understanding: [],
      skills: [],
      contentAreaId: null,
      verified: false,
    };
    outcomes.push(outcome);
    section = null;
    current = null;
    field = 'outcome';
  };

  const append = (target, prop, text) => {
    target[prop] = target[prop] ? `${target[prop]} ${text}` : text;
    if (prop === 'text' && 'extractedText' in target) target.extractedText = target.text;
  };

  for (const { text, page } of lines) {
    const c = classifyLine(text);
    if (c.kind === 'grade') {
      if (ctx.grade !== c.grade) {
        ctx.organizingIdea = '';
        ctx.guidingQuestion = '';
      }
      ctx.grade = c.grade;
      field = null;
      section = null;
      outcome = null;
      if (c.rest) warnings.push(`Text after "Grade ${c.grade}" heading on page ${page ?? '?'} was not placed: "${c.rest}"`);
      continue;
    }
    if (c.kind === 'organizingIdea') {
      ctx.organizingIdea = c.rest;
      ctx.guidingQuestion = '';
      field = 'organizingIdea';
      section = null;
      outcome = null;
      continue;
    }
    if (c.kind === 'guidingQuestion') {
      ctx.guidingQuestion = c.rest;
      field = 'guidingQuestion';
      section = null;
      outcome = null;
      continue;
    }
    if (c.kind === 'outcome') {
      newOutcome(c.rest, page);
      continue;
    }
    if (c.kind === 'section') {
      if (!outcome) {
        newOutcome('', page);
        warnings.push(`${SECTION_LABEL[c.section]} heading on page ${page ?? '?'} appeared before any learning outcome; created ${outcome.id} with no outcome text.`);
      }
      section = c.section;
      field = null;
      current = null;
      sawBullet = false;
      continue;
    }

    // Plain text line.
    if (section && outcome) {
      const b = text.match(BULLET_RE);
      const body = b ? text.slice(b[0].length).trim() : text;
      if (!body) continue;
      const level = b && (b[2] || b[3] || b[5]) ? 2 : 1;
      const startsLower = /^[a-z(]/.test(body);
      const continues = current && !b && (startsLower || (sawBullet && !/[.;:!?]$/.test(current.text)));
      if (b) sawBullet = true;
      if (continues) {
        current.text += ` ${body}`;
        current.extractedText = current.text;
      } else {
        const list = outcome[section];
        const code = { knowledge: 'K', understanding: 'U', skills: 'S' }[section];
        current = {
          id: `${outcome.id}-${code}${list.length + 1}`,
          text: body,
          extractedText: body,
          level,
          sourcePage: page,
          verified: false,
        };
        list.push(current);
      }
      continue;
    }

    const complete = (t) => /[.?!]$/.test(t || '') && /^[A-Z0-9“"]/.test(text);
    if ((field === 'outcome' && outcome && complete(outcome.text)) || (field === 'guidingQuestion' && complete(ctx.guidingQuestion) && !/^students\b/i.test(text))) {
      field = null;
    }
    if (field === 'outcome' && outcome) append(outcome, 'text', text);
    else if (field === 'organizingIdea') ctx.organizingIdea = ctx.organizingIdea ? `${ctx.organizingIdea} ${text}` : text;
    else if (field === 'guidingQuestion' && /^students\b/i.test(text) && /[?]$/.test(ctx.guidingQuestion)) {
      // Unlabelled outcome directly after a guiding question.
      newOutcome(text, page);
    } else if (field === 'guidingQuestion') ctx.guidingQuestion = ctx.guidingQuestion ? `${ctx.guidingQuestion} ${text}` : text;
    else unplaced.push({ text, page });
    // Unplaced text (introductions, notes) is never turned into curriculum.
  }

  if (unplaced.length) {
    warnings.push(`${unplaced.length} line(s) of text were not placed in any outcome (introductions, notes or unrecognised layout). Review them in the source panel. First: "${unplaced[0].text.slice(0, 80)}" (page ${unplaced[0].page ?? '?'})`);
  }

  for (const o of outcomes) {
    if (!o.text) warnings.push(`${o.id}: outcome statement text is missing.`);
    if (o.grade == null) warnings.push(`${o.id}: grade could not be determined.`);
    for (const key of ['knowledge', 'understanding', 'skills']) {
      if (!o[key].length) warnings.push(`${o.id}: no ${SECTION_LABEL[key]} statements were found.`);
    }
  }

  const grades = [...new Set(outcomes.map((o) => o.grade).filter((g) => g != null))].sort((a, b) => a - b);
  return {
    outcomes,
    warnings,
    unplaced,
    stats: {
      lines: lines.length,
      unplaced: unplaced.length,
      outcomes: outcomes.length,
      grades,
      statements: outcomes.reduce((n, o) => n + o.knowledge.length + o.understanding.length + o.skills.length, 0),
    },
  };
}

/** Validate a structured JSON curriculum export (e.g. from a previous version). */
export function parseCurriculumJson(json) {
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  const list = Array.isArray(data) ? data : data.outcomes;
  if (!Array.isArray(list)) throw new Error('JSON must contain an "outcomes" array.');
  const warnings = [];
  const outcomes = list.map((o, i) => {
    if (!o.id || !o.text) warnings.push(`Outcome #${i + 1} is missing an id or text.`);
    const fixList = (arr, code) =>
      (arr || []).map((s, j) => (typeof s === 'string' ? { id: `${o.id}-${code}${j + 1}`, text: s, extractedText: s, level: 1, verified: false } : { level: 1, verified: false, extractedText: s.text, ...s }));
    return {
      contentAreaId: null,
      verified: false,
      sourcePage: null,
      organizingIdea: '',
      guidingQuestion: '',
      grade: o.grade ?? null,
      ...o,
      extractedText: o.extractedText ?? o.text,
      knowledge: fixList(o.knowledge, 'K'),
      understanding: fixList(o.understanding, 'U'),
      skills: fixList(o.skills, 'S'),
    };
  });
  return { outcomes, warnings, stats: { outcomes: outcomes.length } };
}
