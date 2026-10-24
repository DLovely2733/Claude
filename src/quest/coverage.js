// Curriculum coverage: maps every official statement to the learning
// experiences that address it. Pure functions (tested in Node).
//
// Statement status:
//   approved        – the teacher reviewed the experiences and approved them
//   ready           – at least one finished experience addresses it
//   in-development  – only draft experiences address it
//   not-built       – nothing addresses it yet

import { STATEMENT_KEYS } from '../curriculum/model.js';

export const COVERAGE_STATUS = {
  'not-built': { label: 'Not Built', tone: 'error' },
  'in-development': { label: 'In Development', tone: 'warn' },
  ready: { label: 'Ready for Review', tone: 'info' },
  approved: { label: 'Teacher Approved', tone: 'ok' },
};

/**
 * @param {object} version curriculum version
 * @param {Array<{id,kind,title,href,worldId,statementIds,built}>} experiences
 * @param {object} o { approvals: {statementId: {at}}, worlds: [{id,name,outcomeIds}] }
 */
export function computeCoverage(version, experiences, { approvals = {}, worlds = [] } = {}) {
  const byStatement = new Map();
  for (const ex of experiences) for (const id of ex.statementIds || []) {
    if (!byStatement.has(id)) byStatement.set(id, []);
    byStatement.get(id).push(ex);
  }
  const totals = { statements: 0, 'not-built': 0, 'in-development': 0, ready: 0, approved: 0 };
  const outcomes = (version?.outcomes || []).filter((o) => o.grade === 9 || o.grade == null).map((o) => {
    const statements = [];
    for (const key of STATEMENT_KEYS) {
      for (const st of o[key] || []) {
        const exps = byStatement.get(st.id) || [];
        const status = approvals[st.id] && exps.some((e) => e.built) ? 'approved' : exps.some((e) => e.built) ? 'ready' : exps.length ? 'in-development' : 'not-built';
        totals.statements++;
        totals[status]++;
        statements.push({ statement: st, type: key, experiences: exps, status });
      }
    }
    const count = (s) => statements.filter((x) => x.status === s).length;
    const status = statements.length && count('approved') === statements.length ? 'approved'
      : statements.length && count('ready') + count('approved') === statements.length ? 'ready'
      : statements.some((x) => x.status !== 'not-built') ? 'in-development' : 'not-built';
    return {
      outcome: o,
      worldIds: worlds.filter((w) => w.outcomeIds.includes(o.id)).map((w) => w.id),
      statements,
      status,
      counts: { total: statements.length, 'not-built': count('not-built'), 'in-development': count('in-development'), ready: count('ready'), approved: count('approved') },
    };
  });
  return { outcomes, totals, complete: totals.statements > 0 && totals.approved === totals.statements };
}
