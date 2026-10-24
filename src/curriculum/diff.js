// Compare two curriculum versions so a teacher can review a revised draft and
// carry lessons forward without rebuilding anything.

import { normalize, similarity } from '../util.js';
import { STATEMENT_KEYS } from './model.js';

const MATCH_THRESHOLD = 0.45;

function outcomeSignature(o) {
  return `${o.text} ${o.guidingQuestion || ''}`;
}

/** Greedy best-match pairing by similarity. */
function pair(oldList, newList, textOf) {
  const candidates = [];
  oldList.forEach((a, i) =>
    newList.forEach((b, j) => {
      const exact = normalize(textOf(a)) === normalize(textOf(b));
      const score = exact ? 1 : similarity(textOf(a), textOf(b));
      if (score >= MATCH_THRESHOLD) candidates.push({ i, j, score, exact });
    })
  );
  candidates.sort((x, y) => y.score - x.score);
  const usedOld = new Set();
  const usedNew = new Set();
  const pairs = [];
  for (const c of candidates) {
    if (usedOld.has(c.i) || usedNew.has(c.j)) continue;
    usedOld.add(c.i);
    usedNew.add(c.j);
    pairs.push(c);
  }
  return {
    pairs,
    removed: oldList.filter((_, i) => !usedOld.has(i)),
    added: newList.filter((_, j) => !usedNew.has(j)),
  };
}

/**
 * @returns {{outcomes:Array<{status:'unchanged'|'modified'|'removed'|'added', old?:object, new?:object, score?:number, statements?:Array}>, idMap:Object<string,string>, summary:object}}
 *   idMap maps old outcome/statement ids to their matched ids in the new version.
 */
export function diffVersions(oldVersion, newVersion, { grade = null } = {}) {
  const filter = (list) => (grade == null ? list : list.filter((o) => o.grade === grade || o.grade == null));
  const oldOutcomes = filter(oldVersion.outcomes || []);
  const newOutcomes = filter(newVersion.outcomes || []);
  const { pairs, removed, added } = pair(oldOutcomes, newOutcomes, outcomeSignature);
  const idMap = {};
  const result = [];

  for (const p of pairs) {
    const a = oldOutcomes[p.i];
    const b = newOutcomes[p.j];
    idMap[a.id] = b.id;
    const statements = [];
    let stmtChanged = false;
    for (const key of STATEMENT_KEYS) {
      const s = pair(a[key] || [], b[key] || [], (x) => x.text);
      for (const sp of s.pairs) {
        const sa = a[key][sp.i];
        const sb = b[key][sp.j];
        idMap[sa.id] = sb.id;
        const status = normalize(sa.text) === normalize(sb.text) ? 'unchanged' : 'modified';
        if (status !== 'unchanged') stmtChanged = true;
        statements.push({ type: key, status, old: sa, new: sb, score: sp.score });
      }
      for (const r of s.removed) (stmtChanged = true), statements.push({ type: key, status: 'removed', old: r });
      for (const ad of s.added) (stmtChanged = true), statements.push({ type: key, status: 'added', new: ad });
    }
    const textSame = normalize(a.text) === normalize(b.text);
    result.push({ status: textSame && !stmtChanged ? 'unchanged' : 'modified', old: a, new: b, score: p.score, textChanged: !textSame, statements });
  }
  for (const r of removed) result.push({ status: 'removed', old: r });
  for (const a of added) result.push({ status: 'added', new: a });

  const summary = { unchanged: 0, modified: 0, removed: 0, added: 0 };
  for (const r of result) summary[r.status]++;
  return { outcomes: result, idMap, summary };
}

/**
 * Determine how a lesson is affected by moving to a new version.
 * Returns the changed links and a proposed re-mapped link set.
 */
export function lessonImpact(lesson, diff) {
  const links = lesson.curriculumLinks || { outcomeIds: [], statementIds: [] };
  const changedStatements = new Map();
  const changedOutcomes = new Map();
  for (const o of diff.outcomes) {
    if (o.old) changedOutcomes.set(o.old.id, o);
    for (const s of o.statements || []) if (s.old) changedStatements.set(s.old.id, s);
  }
  const issues = [];
  for (const id of links.outcomeIds) {
    const o = changedOutcomes.get(id);
    if (!o) issues.push({ id, kind: 'outcome', status: 'missing' });
    else if (o.status === 'removed') issues.push({ id, kind: 'outcome', status: 'removed' });
    else if (o.textChanged) issues.push({ id, kind: 'outcome', status: 'modified', newText: o.new.text, oldText: o.old.text });
  }
  for (const id of links.statementIds) {
    const s = changedStatements.get(id);
    if (!s) {
      // statement belonged to a removed outcome or never matched
      if (!(id in diff.idMap)) issues.push({ id, kind: 'statement', status: 'removed' });
    } else if (s.status !== 'unchanged') issues.push({ id, kind: 'statement', status: s.status, newText: s.new?.text, oldText: s.old?.text });
  }
  const remapped = {
    outcomeIds: links.outcomeIds.map((id) => diff.idMap[id]).filter(Boolean),
    statementIds: links.statementIds.map((id) => diff.idMap[id]).filter(Boolean),
  };
  return { issues, remapped, clean: issues.length === 0 };
}
