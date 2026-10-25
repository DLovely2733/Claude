import type {
  Mission, MissionStep, MissionTemplate, Novel, StepType, ReadingLevel, ThinkingLevel, Grouping, Duration, Lock,
} from '../data/types';
import { uid } from './id';

// Drafts a mission from the novel's knowledge base. The knowledge base is the
// only source: when it lacks something a step needs, the draft says so with a
// "[Teacher: …]" placeholder and a gap note instead of making content up.
// Drafts are never visible to students until the teacher publishes them.

export interface GenerateOptions {
  title?: string;
  chapters: number[];
  engines: StepType[];
  themeId: string;
  outcomes: string[];
  readingLevel: ReadingLevel;
  thinkingLevel: ThinkingLevel;
  grouping: Grouping;
  duration: Duration;
  /** Room wording carried over from a template. */
  overrides?: MissionTemplate['overrides'];
}

export interface GenerateResult {
  mission: Mission;
  gaps: string[];
}

export const TEACHER = (what: string) => `[Teacher: ${what}]`;
export const isPlaceholder = (s: string) => /\[Teacher:/.test(s);

/** Suggested engines for each lesson length. Teachers can change them. */
export const DURATION_ENGINES: Record<Duration, StepType[]> = {
  10: ['reasoning-lock'],
  20: ['dilemma', 'reflection'],
  45: ['briefing', 'dilemma', 'evidence-board', 'reflection'],
  80: ['briefing', 'dilemma', 'evidence-board', 'reasoning-lock', 'connections', 'reflection'],
};

export function generateMission(novel: Novel, o: GenerateOptions): GenerateResult {
  const gaps: string[] = [];
  const opts = (t: StepType) => o.overrides?.[t];
  const inRange = new Set(o.chapters);
  const chapters = novel.chapters.filter((c) => inRange.has(c.number)).sort((a, b) => a.number - b.number);
  const events = novel.events.filter((e) => inRange.has(e.chapter)).sort((a, b) => a.chapter - b.chapter);
  const evidence = novel.evidence.filter((e) => inRange.has(e.chapter));
  const theme = novel.themes.find((t) => t.id === o.themeId) ?? novel.themes[0];
  const range = rangeLabel(o.chapters);
  const maxCh = Math.max(...o.chapters);

  if (!theme) gaps.push('Add at least one theme to the novel so missions can explore it.');
  const themeEvidence = evidence.filter((e) => theme && e.themes.includes(theme.id));
  const steps: MissionStep[] = [];
  const base = (type: StepType, title: string, skill: string) => ({
    id: uid(`s-${type}`), title, skill, outcomes: o.outcomes,
  });

  for (const engine of o.engines) {
    if (engine === 'briefing') {
      if (!chapters.length) gaps.push('Briefing: no chapters selected.');
      chapters.forEach((c) => isPlaceholder(c.summary) || /^Add a summary/.test(c.summary) ? gaps.push(`Briefing: Chapter ${c.number} has no summary yet.`) : null);
      steps.push({
        ...base('briefing', 'Mission Briefing', 'Recall the reading and the words you need.'),
        type: 'briefing',
        instructions: `This mission is about ${range}. Read them first. The recap helps you remember but does not replace the chapters.`,
        plainInstructions: `Read ${range} first. The recap helps you remember.`,
        chunks: chapters.map((c) => ({ heading: `Chapter ${c.number}: ${c.title}`, text: c.summary, plain: c.plain || c.summary })),
        vocab: novel.vocab.slice(0, 6).map((v) => v.id),
      });
    }

    if (engine === 'dilemma') {
      const conflict = events.find((e) => e.kind === 'conflict') ?? events[0];
      if (!conflict) gaps.push('Dilemma: add a conflict event in these chapters to base the dilemma on.');
      const lead = conflict?.characters[0];
      const who = novel.characters.find((c) => c.id === lead)?.name ?? TEACHER('character');
      gaps.push('Dilemma: write the consequence of each choice, and what actually happens in the novel.');
      const values = ['loyalty', 'fairness', 'responsibility', 'trust', 'compassion', 'honesty', 'winning', 'control'];
      steps.push({
        ...base('dilemma', 'The Decision Point', 'Make a decision as a character might, and justify it with the novel.'),
        type: 'dilemma',
        instructions: 'This is a simulation inspired by the chapters. Explore, decide, justify, then compare with the novel. Outcomes here are hypothetical.',
        plainInstructions: 'This is pretend, based on the book. Choose, explain why, then compare with the book.',
        scenario: conflict ? `Inspired by Chapter ${conflict.chapter}: ${conflict.text} You are ${who}. What do you do next?` : TEACHER('describe the situation'),
        plainScenario: conflict ? `${conflict.plain || conflict.text} You are ${who}. What do you do?` : TEACHER('describe the situation in plain words'),
        hotspots: evidence.filter((e) => e.kind === 'fact').slice(0, 4).map((e, i) => ({
          id: uid('h'), icon: (['intel', 'squad', 'orders', 'log'] as const)[i % 4], label: `Clue ${i + 1}`,
          text: e.text, plain: e.plain || e.text,
        })),
        choices: [
          { id: uid('c'), label: TEACHER('choice that protects others'), plain: TEACHER('plain version'), values: ['responsibility', 'compassion'], consequence: TEACHER('SIMULATION: plausible consequence'), plainConsequence: TEACHER('plain consequence') },
          { id: uid('c'), label: TEACHER('choice that puts the goal first'), plain: TEACHER('plain version'), values: ['winning', 'control'], consequence: TEACHER('SIMULATION: plausible consequence'), plainConsequence: TEACHER('plain consequence') },
          { id: uid('c'), label: TEACHER('choice that challenges authority'), plain: TEACHER('plain version'), values: ['fairness', 'honesty'], consequence: TEACHER('SIMULATION: plausible consequence'), plainConsequence: TEACHER('plain consequence') },
        ],
        canonNote: TEACHER('summarize what actually happens in the novel'),
        canonVerification: 'teacher-added',
        evidenceIds: evidence.map((e) => e.id),
        valueOptions: values,
      });
    }

    if (engine === 'evidence-board') {
      if (themeEvidence.length < 3) gaps.push(`Evidence board: only ${themeEvidence.length} evidence card(s) for “${theme?.topic ?? 'this theme'}” in ${range}. Add more to the evidence bank.`);
      gaps.push('Evidence board: check which theories each card supports or challenges, and write the weak theory.');
      const ladder = theme?.ladder ?? [];
      const theories = [
        ...ladder.slice(2).map((s) => ({ id: uid('th'), label: s, plain: s, defensible: true, challenge: 'Which card makes this theory harder to defend? How does your case answer it?' })),
        { id: uid('th'), label: TEACHER('a theory the evidence does not support'), plain: TEACHER('plain version'), defensible: false, challenge: TEACHER('the question that shows why the evidence strains this theory') },
      ];
      steps.push({
        ...base('evidence-board', 'Case File', 'Investigate. Sort facts from interpretations and build a case.'),
        type: 'evidence-board',
        instructions: 'Sort each card as fact or interpretation, pin cards to the theory they support or challenge, rule out a weak theory, and file a case report. More than one theory can be defended.',
        plainInstructions: 'Sort the cards. Pin them to a theory. Rule out a weak theory. Write your report.',
        caseTitle: `CASE: ${(theme?.topic ?? 'Untitled').toUpperCase()}`,
        caseQuestion: theme?.question ?? TEACHER('case question'),
        theories,
        cards: themeEvidence.map((e) => ({ evidenceId: e.id, supports: theories.filter((t) => t.defensible).map((t) => t.id), challenges: [] })),
      });
    }

    if (engine === 'reasoning-lock') {
      const locks: Lock[] = [];
      if (events.length >= 3) {
        locks.push({ kind: 'sequence', id: uid('l'), title: 'Lock · Timeline Reconstruction', prompt: `Put these moments from ${range} in order.`,
          eventIds: events.slice(0, 7).map((e) => e.id), hints: ['Think about cause and effect: which event makes the next one possible?'] });
      } else gaps.push(`Vault: add at least 3 events in ${range} for a timeline lock.`);
      const tech = novel.techniques.find((t) => t.chapter <= maxCh);
      if (tech) {
        gaps.push(`Vault: write two weaker options for the “${tech.name}” lock.`);
        locks.push({ kind: 'craft', id: uid('l'), title: 'Lock · The Author’s Choice', prompt: `${tech.description} What does this choice do for readers?`,
          options: [
            { id: uid('o'), strong: true, text: tech.example, why: 'Strong. It explains the effect on readers.' },
            { id: uid('o'), strong: false, text: TEACHER('a weaker option'), why: TEACHER('why it is weaker') },
            { id: uid('o'), strong: false, text: TEACHER('an absolute or off-target option'), why: TEACHER('why it is weaker') },
          ],
          explainPrompt: 'Explain the effect in your own words.', hints: ['An effect is what a choice does to the reader.'] });
      }
      if (theme && theme.ladder.length >= 3) {
        locks.push({ kind: 'theme', id: uid('l'), title: 'Lock · Theme Signal', topic: theme.topic,
          prompt: `“${theme.topic}” is a topic, not a theme. Choose the statement that best expresses what ${range} suggest.`,
          options: [
            { id: uid('o'), strong: false, flaw: 'too-general', text: theme.ladder[0], why: 'Too general to say anything about this novel.' },
            { id: uid('o'), strong: false, flaw: 'summary', text: theme.ladder[1], why: 'Closer, but it describes the story rather than an idea about people.' },
            { id: uid('o'), strong: true, text: theme.ladder[2], why: 'Strong. It makes a supportable claim about people.' },
            { id: uid('o'), strong: false, flaw: 'absolute', text: `${theme.topic} always matters more than anything else.`, why: 'Too absolute. Novels usually complicate “always”.' },
          ],
          explainPrompt: `Which detail from ${range} best supports your choice?`, hints: ['A theme is a full sentence about people or life.'] });
      } else gaps.push('Vault: add a theme ladder (at least 3 statements) for a theme lock.');
      steps.push({
        ...base('reasoning-lock', 'The Vault', 'Reconstruct, analyse craft, and build theme statements.'),
        type: 'reasoning-lock',
        instructions: 'Open each lock by thinking about the chapters. Hints never count against you.',
        plainInstructions: 'Open each lock. Use hints any time.',
        vaultName: 'THE VAULT',
        locks,
      });
    }

    if (engine === 'connections') {
      const chars = novel.characters.filter((c) => c.firstChapter <= maxCh).slice(0, 8);
      if (chars.length < 3) gaps.push('Connections: add at least 3 characters who appear by these chapters.');
      steps.push({
        ...base('connections', 'Character Connections', 'Map relationships and justify them with evidence.'),
        type: 'connections',
        instructions: 'Connect the characters, choose the kind of connection, and justify each one with evidence.',
        plainInstructions: 'Connect characters and explain each link with the book.',
        characterIds: chars.map((c) => c.id),
        fromChapter: Math.min(...o.chapters),
        toChapter: maxCh,
      });
    }

    if (engine === 'courtroom') {
      const defendant = novel.characters.find((c) => events.some((e) => e.characters.includes(c.id) && e.kind !== 'event')) ?? novel.characters[0];
      if (!defendant) gaps.push('Courtroom: add characters so one can be put on trial.');
      if (evidence.length < 4) gaps.push(`Courtroom: only ${evidence.length} evidence card(s) in ${range}; trials need at least 4.`);
      gaps.push('Courtroom: write the charge and the opposing arguments, and mark which ones are sound.');
      const opp = (side: 'prosecution' | 'defence', flaw: 'speculation' | 'ignores-evidence' | 'overgeneralization' | 'sound') =>
        ({ id: uid('op'), side, text: TEACHER(`${side} argument (${flaw === 'sound' ? 'a sound point' : `one with ${flaw}`})`), flaw, why: TEACHER('why the judge rules this way') });
      steps.push({
        ...base('courtroom', 'Character Courtroom', 'Build an argument from evidence, challenge weak reasoning, and weigh both sides.'),
        type: 'courtroom',
        instructions: 'Choose a side, enter labelled exhibits, cross-examine the other side, close your case, then give the verdict you think the evidence supports.',
        plainInstructions: 'Pick a side. Choose evidence. Challenge weak arguments. Then say what you really think.',
        caseTitle: `THE CLASS v. ${(defendant?.name ?? 'THE DEFENDANT').toUpperCase()}`,
        charge: TEACHER(`the charge against ${defendant?.name ?? 'the character'}, linked to ${theme?.topic.toLowerCase() ?? 'the theme'}`),
        defendantId: defendant?.id ?? '',
        evidenceIds: evidence.map((e) => e.id),
        opposing: [opp('prosecution', 'speculation'), opp('prosecution', 'sound'), opp('defence', 'ignores-evidence'), opp('defence', 'sound')],
        verdicts: ['Responsible', 'Partly responsible', 'Not responsible'],
      });
    }

    if (engine === 'creative') {
      const chars = novel.characters.filter((c) => c.firstChapter <= maxCh).slice(0, 8);
      steps.push({
        ...base('creative', 'Creative Studio', 'Show your understanding through a creative or analytical piece, held to the same criteria.'),
        type: 'creative',
        instructions: 'Choose a format that suits you. Every format is assessed on the same criteria and ends with a craft note explaining your choices.',
        plainInstructions: 'Pick a format. Show what you understand. Explain your choices.',
        prompt: theme ? `What do ${range} suggest about ${theme.topic.toLowerCase()}?` : TEACHER('the creative prompt'),
        formats: ['journal', 'interview', 'perspective', 'newspaper', 'profile', 'storyboard', 'argument', 'analysis'],
        characterIds: chars.map((c) => c.id),
        criteria: [
          `Shows an accurate understanding of events in ${range}`,
          'Reveals a character’s motivations or feelings, not just actions',
          `Connects to the theme of ${theme?.topic.toLowerCase() ?? 'the unit'}`,
          'Uses at least one piece of evidence from the novel',
          'Explains your choices in a craft note',
        ],
      });
    }

    if (engine === 'reflection') {
      steps.push({
        ...base('reflection', 'Reflection Log', 'Develop a theme statement and reflect on your thinking.'),
        type: 'reflection',
        instructions: 'Climb the theme ladder from topic to defensible statement, then reflect on how your thinking changed.',
        plainInstructions: 'Turn a topic into a theme sentence. Then say how your thinking changed.',
        themeId: theme?.id ?? '',
        prompts: ['Which evidence changed or sharpened your thinking most?', 'How did your decision compare with what happens in the novel?'],
      });
    }
  }

  for (const s of steps) {
    const o = opts(s.type);
    if (o) Object.assign(s, Object.fromEntries(Object.entries(o).filter(([, v]) => v)));
  }

  const mission: Mission = {
    id: uid('m'),
    novelId: novel.id,
    title: o.title?.trim() || `${theme?.topic ?? 'Novel'} Mission: ${range}`,
    codename: (theme?.topic ?? 'MISSION').toUpperCase(),
    summary: `A ${o.duration}-minute ${o.grouping} mission on ${range}, exploring ${theme?.topic.toLowerCase() ?? 'the novel'}.`,
    chapterNumbers: [...o.chapters].sort((a, b) => a - b),
    outcomes: o.outcomes,
    readingLevel: o.readingLevel,
    thinkingLevel: o.thinkingLevel,
    grouping: o.grouping,
    duration: o.duration,
    status: 'draft',
    steps,
    createdBy: 'generator',
    updatedAt: Date.now(),
  };
  if (!o.outcomes.length) gaps.push('Choose at least one learning outcome.');
  return { mission, gaps: [...new Set(gaps)] };
}

export function rangeLabel(chs: number[]): string {
  const s = [...chs].sort((a, b) => a - b);
  if (!s.length) return 'no chapters';
  if (s.length === 1) return `Chapter ${s[0]}`;
  const contiguous = s.every((n, i) => i === 0 || n === s[i - 1] + 1);
  return contiguous ? `Chapters ${s[0]}–${s[s.length - 1]}` : `Chapters ${s.join(', ')}`;
}

/** Capture a mission's shape as a reusable template. */
export function templateFromMission(m: Mission, name: string, description: string, outcomeCode: (id: string) => string | undefined): MissionTemplate {
  return {
    id: uid('tpl'), name, description, builtIn: false,
    engines: m.steps.map((s) => s.type), readingLevel: m.readingLevel, thinkingLevel: m.thinkingLevel, grouping: m.grouping, duration: m.duration,
    outcomeCodes: m.outcomes.map(outcomeCode).filter((c): c is string => !!c),
    overrides: Object.fromEntries(m.steps.map((s) => [s.type, { title: s.title, instructions: s.instructions, plainInstructions: s.plainInstructions }])),
  };
}

/** Every placeholder still left in a mission, for the publish check. */
export function placeholdersIn(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return isPlaceholder(value) ? [path] : [];
  if (Array.isArray(value)) return value.flatMap((v, i) => placeholdersIn(v, `${path}[${i}]`));
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([k, v]) => placeholdersIn(v, path ? `${path}.${k}` : k));
  return [];
}
