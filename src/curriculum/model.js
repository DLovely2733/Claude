// Curriculum data model.
//
// A CurriculumVersion is created only from a teacher-supplied (or
// automatically retrieved) official document. Nothing in this module contains
// curriculum wording: outcomes and statements always come from ingestion.

import { normalize, tokens } from '../util.js';

export const OFFICIAL_SOURCES = [
  { label: 'Alberta Education – Social studies curriculum', url: 'https://www.alberta.ca/curriculum-social-studies' },
  { label: 'LearnAlberta – New LearnAlberta curriculum', url: 'https://curriculum.learnalberta.ca/home/en' },
];

// The June 2026 draft as extracted (verbatim) from the copy supplied by the
// teacher, generated with scripts/extract-curriculum.mjs. Loading it is a
// teacher action; every outcome still has to be verified against the source.
export const BUNDLED_CURRICULUM = {
  id: 'ab-ss79-draft-2026-06',
  label: 'Draft Social Studies (7–9), June 2026 – Grade 9',
  path: 'curriculum/draft-2026-06-ss7-9.json',
  source: 'Social_Studies_7_9-2026-10-24.pdf (12 pages, Government of Alberta, June 2026 draft)',
};

export const TARGET_CURRICULUM = {
  subject: 'Social Studies',
  grade: 9,
  title: 'Draft Social Studies 7–9 Curriculum (June 2026 update)',
  status: 'Draft – optional classroom piloting 2026–2027',
};

// The five Grade 9 content areas named by Alberta Education. These are
// organising categories only; teachers assign extracted outcomes to them.
// `scope` describes what each module should address (from the project brief),
// `keywords` drive *suggestions* the teacher must confirm.
export const CONTENT_AREAS = [
  {
    id: 'urbanization',
    name: 'Canadian Urbanization and Growth',
    scope: 'Postwar immigration, population movement, urbanization and the transformation of Canadian industries.',
    keywords: ['urban', 'urbanization', 'urbanized', 'city', 'cities', 'immigration', 'immigrants', 'population', 'migration', 'migrate', 'industry', 'industries', 'industrial', 'suburbs', 'growth', 'rural', 'demographics', 'petroleum', 'sectors'],
  },
  {
    id: 'collective-security',
    name: 'Canadian Collective Security',
    scope: 'Canada’s role and contributions during the Second World War and Canadian involvement in international affairs after the war.',
    keywords: ['military', 'security', 'collective', 'nato', 'norad', 'peacekeeping', 'peace', 'international', 'alliance', 'allied', 'korean', 'cold', 'battle', 'battles', 'armed', 'forces', 'defence', 'wwii', 'navies', 'diplomacy', 'global'],
  },
  {
    id: 'government-policies',
    name: 'Canadian Government Policies',
    scope: 'Changes to Canada’s constitution, residential schools, trade agreements and their consequences.',
    keywords: ['constitution', 'constitutional', 'patriation', 'residential', 'sixties', 'scoop', 'trade', 'agreement', 'agreements', 'policy', 'policies', 'nafta', 'free', 'autonomy', 'sovereign', 'sovereignty', 'statute', 'independence', 'program', 'programs'],
  },
  {
    id: 'political-system',
    name: 'Canada’s Political System',
    scope: 'Government organization, federal and provincial powers, and the process of creating legislation.',
    keywords: ['federal', 'provincial', 'municipal', 'legislative', 'parliament', 'parliamentary', 'laws', 'bill', 'jurisdiction', 'power', 'powers', 'accountability', 'accountable', 'elected', 'senate', 'commons', 'riding', 'judiciary', 'courts', 'crown', 'responsible'],
  },
  {
    id: 'citizenship',
    name: 'Citizenship in Canada',
    scope: 'The expansion of citizenship and rights, immigration, multiculturalism, and Canadian rights and responsibilities.',
    keywords: ['citizenship', 'citizen', 'citizens', 'rights', 'responsibilities', 'multiculturalism', 'multicultural', 'pluralism', 'charter', 'freedoms', 'suffrage', 'franchise', 'immigration', 'immigrants', 'advocacy', 'equality'],
  },
];

export const STATEMENT_TYPES = {
  knowledge: { key: 'knowledge', code: 'K', label: 'Knowledge' },
  understanding: { key: 'understanding', code: 'U', label: 'Understanding' },
  skills: { key: 'skills', code: 'S', label: 'Skills & Procedures' },
};

export const STATEMENT_KEYS = Object.keys(STATEMENT_TYPES);

/** Iterate every statement in an outcome with its type key. */
export function* statementsOf(outcome) {
  for (const key of STATEMENT_KEYS) {
    for (const st of outcome[key] || []) yield { ...st, type: key };
  }
}

export function findOutcome(version, outcomeId) {
  return version?.outcomes?.find((o) => o.id === outcomeId) || null;
}

/** Look up a statement by id anywhere in a version. Returns {outcome, statement, type}. */
export function findStatement(version, statementId) {
  for (const outcome of version?.outcomes || []) {
    for (const key of STATEMENT_KEYS) {
      const st = (outcome[key] || []).find((s) => s.id === statementId);
      if (st) return { outcome, statement: st, type: key };
    }
  }
  return null;
}

/**
 * Suggest content areas for an outcome from keyword overlap. Returns areas
 * sorted by score; a suggestion is never applied without teacher confirmation.
 */
export function suggestContentAreas(outcome) {
  const text = [outcome.organizingIdea, outcome.guidingQuestion, outcome.text, ...[...statementsOf(outcome)].map((s) => s.text)].join(' ');
  const toks = tokens(text);
  const counts = new Map();
  for (const t of toks) counts.set(t, (counts.get(t) || 0) + 1);
  return CONTENT_AREAS.map((area) => {
    let score = 0;
    for (const k of area.keywords) score += counts.get(normalize(k)) || 0;
    return { areaId: area.id, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * Content areas proposed for an outcome: the best match plus any area scoring
 * at least 35% of it (outcomes often span several areas).
 */
export function suggestedAreaIds(outcome) {
  const s = suggestContentAreas(outcome);
  return s.filter((x) => x.score >= s[0].score * 0.35).map((x) => x.areaId);
}

/** Content areas assigned to an outcome (supports the older single-area field). */
export function areasOf(outcome) {
  return outcome?.contentAreaIds || (outcome?.contentAreaId ? [outcome.contentAreaId] : []);
}

/** Outcome is usable for verified lesson links only after teacher verification. */
export function isOutcomeVerified(outcome) {
  return Boolean(outcome?.verified);
}
