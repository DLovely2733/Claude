// The NovelVerse content schema. Every engine reads the same novel knowledge
// (chapters, characters, events, evidence, themes) so a new novel works
// everywhere once its knowledge is entered.

/**
 * Where a piece of novel knowledge came from.
 * - needs-check: drafted by NovelVerse; the teacher has not confirmed it
 *   against their copy of the book yet. Shown with a visible badge.
 * - teacher-verified: the teacher confirmed it.
 * - teacher-added: the teacher wrote it.
 */
export type Verification = 'needs-check' | 'teacher-verified' | 'teacher-added';

/** Visual world for a novel. Each skin is a full set of design tokens. */
export type Skin = 'holo' | 'noir' | 'archive' | 'surveillance' | 'atlas';

export interface Chapter {
  id: string;
  number: number;
  title: string;
  summary: string;
  /** Same ideas in shorter sentences and everyday words. */
  plain?: string;
  /** Students only see chapters the teacher has unlocked (spoiler control). */
  unlocked: boolean;
  verification: Verification;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  plain?: string;
  /** First chapter the character matters in; hidden from students before it unlocks. */
  firstChapter: number;
  verification: Verification;
}

export type EventKind = 'event' | 'turning-point' | 'conflict';

export interface StoryEvent {
  id: string;
  chapter: number;
  text: string;
  plain?: string;
  kind: EventKind;
  characters: string[];
  verification: Verification;
}

/** A teacher-entered quotation. NovelVerse never writes these itself. */
export interface Quotation {
  text: string;
  /** Page numbers differ between editions, so a page is always tied to one. */
  edition: string;
  page: string;
}

export interface Evidence {
  id: string;
  chapter: number;
  /**
   * fact: something that happens in the text (a plot detail).
   * interpretation: a reading of what the text means; it needs support.
   */
  kind: 'fact' | 'interpretation';
  text: string;
  plain?: string;
  quote?: Quotation;
  characters: string[];
  themes: string[];
  verification: Verification;
}

export interface ThemeIdea {
  id: string;
  topic: string;
  question: string;
  /** Example thematic statements, from simple to sophisticated. */
  ladder: string[];
}

export interface VocabTerm {
  id: string;
  term: string;
  definition: string;
  /** Literary terms are about the craft; story terms come from the novel's world. */
  kind: 'story' | 'literary';
}

export interface Technique {
  id: string;
  name: string;
  description: string;
  example: string;
  chapter: number;
  verification: Verification;
}

export type RelationshipType = 'alliance' | 'conflict' | 'mentor' | 'manipulation' | 'family' | 'rivalry';

export interface Relationship {
  id: string;
  from: string;
  to: string;
  type: RelationshipType;
  chapter: number;
  note: string;
  verification: Verification;
}

export interface Novel {
  id: string;
  title: string;
  author: string;
  skin: Skin;
  tagline: string;
  setting: string;
  contentNotes: string[];
  chapters: Chapter[];
  characters: Character[];
  events: StoryEvent[];
  evidence: Evidence[];
  themes: ThemeIdea[];
  vocab: VocabTerm[];
  techniques: Technique[];
  relationships: Relationship[];
  createdBy: 'demo' | 'teacher';
}

// ---------------------------------------------------------------- Missions

export type ReadingLevel = 'supported' | 'standard' | 'extended';
export type ThinkingLevel = 'foundational' | 'developing' | 'sophisticated';
export type Grouping = 'independent' | 'partner' | 'group' | 'whole-class';
export type Duration = 10 | 20 | 45 | 80;

interface StepBase {
  id: string;
  title: string;
  /** The literacy skill this step practises, in student-friendly words. */
  skill: string;
  outcomes: string[];
  instructions: string;
  plainInstructions: string;
}

export interface BriefingChunk {
  heading: string;
  text: string;
  plain: string;
}

export interface BriefingStep extends StepBase {
  type: 'briefing';
  chunks: BriefingChunk[];
  vocab: string[];
  /** The first-thought prompt students revisit at the end of the mission. */
  firstThought?: string;
}

export interface Hotspot {
  id: string;
  label: string;
  /** Short glyph name used by the scene and the 2D map. */
  icon: 'intel' | 'squad' | 'orders' | 'log';
  text: string;
  plain: string;
}

export interface DilemmaChoice {
  id: string;
  /** Optional battleroom replay for the 3D consequence scene (science-fiction skin). */
  replay?: 'hold' | 'surprise' | 'rushed' | 'overrun';
  label: string;
  plain: string;
  values: string[];
  consequence: string;
  plainConsequence: string;
  followUp?: {
    prompt: string;
    choices: { id: string; label: string; consequence: string }[];
  };
}

export interface DilemmaStep extends StepBase {
  type: 'dilemma';
  scenario: string;
  plainScenario: string;
  hotspots: Hotspot[];
  choices: DilemmaChoice[];
  /** What actually happens in the book, for the compare screen. */
  canonNote: string;
  canonVerification: Verification;
  /** Evidence card ids students may cite. */
  evidenceIds: string[];
  valueOptions: string[];
}

export interface Theory {
  id: string;
  label: string;
  plain: string;
  /** Can a careful reader defend this with the evidence? Several can be. */
  defensible: boolean;
  /** Shown when a student builds a case on a theory the evidence strains. */
  challenge: string;
}

export interface BoardCardLink {
  evidenceId: string;
  supports: string[];
  challenges: string[];
}

export interface EvidenceBoardStep extends StepBase {
  type: 'evidence-board';
  caseTitle: string;
  caseQuestion: string;
  theories: Theory[];
  cards: BoardCardLink[];
}

export interface SequenceLock {
  kind: 'sequence';
  id: string;
  title: string;
  prompt: string;
  /** Event ids in the order they happen. */
  eventIds: string[];
  hints: string[];
}

export interface ChoiceOption {
  id: string;
  text: string;
  strong: boolean;
  why: string;
}

export interface CraftLock {
  kind: 'craft';
  id: string;
  title: string;
  prompt: string;
  options: ChoiceOption[];
  explainPrompt: string;
  hints: string[];
}

export interface ThemeLock {
  kind: 'theme';
  id: string;
  title: string;
  topic: string;
  prompt: string;
  options: (ChoiceOption & { flaw?: 'too-general' | 'summary' | 'absolute' | 'cliche' })[];
  explainPrompt: string;
  hints: string[];
}

export type Lock = SequenceLock | CraftLock | ThemeLock;

export interface ReasoningLockStep extends StepBase {
  type: 'reasoning-lock';
  vaultName: string;
  locks: Lock[];
}

export interface ConnectionsStep extends StepBase {
  type: 'connections';
  characterIds: string[];
  /** Chapter the map "starts" at; students revisit after later chapters. */
  fromChapter: number;
  toChapter: number;
}

export interface ReflectionStep extends StepBase {
  type: 'reflection';
  themeId: string;
  prompts: string[];
}

export type ObjectionType = 'speculation' | 'ignores-evidence' | 'overgeneralization';

/** An argument from the other side, for students to object to or accept. */
export interface OpposingArgument {
  id: string;
  side: 'prosecution' | 'defence';
  text: string;
  /** The teacher's judgement of its weakness; 'sound' means no objection holds. */
  flaw: ObjectionType | 'sound';
  why: string;
}

export interface CourtroomStep extends StepBase {
  type: 'courtroom';
  caseTitle: string;
  /** The question on trial, phrased as a charge. */
  charge: string;
  defendantId: string;
  evidenceIds: string[];
  opposing: OpposingArgument[];
  verdicts: string[];
}

export type CreativeFormat = 'journal' | 'interview' | 'perspective' | 'newspaper' | 'profile' | 'storyboard' | 'argument' | 'analysis';

export interface CreativeStep extends StepBase {
  type: 'creative';
  prompt: string;
  formats: CreativeFormat[];
  characterIds: string[];
  /** Success criteria shared by every format, so choice never lowers the bar. */
  criteria: string[];
}

export type MissionStep =
  | BriefingStep
  | DilemmaStep
  | EvidenceBoardStep
  | ReasoningLockStep
  | ConnectionsStep
  | ReflectionStep
  | CourtroomStep
  | CreativeStep;

export type StepType = MissionStep['type'];

export interface Mission {
  id: string;
  novelId: string;
  title: string;
  codename: string;
  summary: string;
  chapterNumbers: number[];
  outcomes: string[];
  readingLevel: ReadingLevel;
  thinkingLevel: ThinkingLevel;
  grouping: Grouping;
  duration: Duration;
  status: 'draft' | 'published';
  steps: MissionStep[];
  createdBy: 'demo' | 'generator' | 'teacher';
  updatedAt: number;
}

// ---------------------------------------------------------------- Curriculum

export interface Outcome {
  id: string;
  /** Code exactly as it appears in the official document. Never invented. */
  code: string;
  label: string;
  group: string;
  status: 'unverified' | 'verified';
}

export interface CurriculumProfile {
  id: string;
  name: string;
  source: string;
  note: string;
  outcomes: Outcome[];
}

// ---------------------------------------------------------------- Assessment

export interface RubricCriterion {
  id: string;
  name: string;
  levels: string[];
}

export interface Rubric {
  levelNames: string[];
  criteria: RubricCriterion[];
}

export interface Student {
  id: string;
  /** Synthetic call sign. NovelVerse never asks for real names in the demo. */
  callSign: string;
  synthetic: true;
  /**
   * Supports the teacher turns on by default for this student. Students can
   * still change their own settings; nothing here labels ability.
   */
  presets?: Partial<Settings>;
}

export interface Settings {
  textScale: number;
  wideSpacing: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  plainLanguage: boolean;
  shortInstructions: boolean;
  readAloud: boolean;
  sentenceFrames: boolean;
  sound: boolean;
  scene: 'auto' | '3d' | '2d';
  mentor: boolean;
  ambient: boolean;
}

export interface Revision {
  at: number;
  summary: string;
  data: unknown;
}

export interface TeacherReview {
  scores: Record<string, number>;
  feedback: string;
  finalized: boolean;
  at: number;
}

export interface StepResponse {
  studentId: string;
  missionId: string;
  stepId: string;
  status: 'in-progress' | 'submitted';
  data: Record<string, unknown>;
  revisions: Revision[];
  /** Supports the student chose. For the teacher only; never lowers a result. */
  supports: string[];
  updatedAt: number;
  review?: TeacherReview;
}

// ---------------------------------------------------------------- Templates

/** A reusable mission shape that can be applied to any novel and chapters. */
export interface MissionTemplate {
  id: string;
  name: string;
  description: string;
  engines: StepType[];
  readingLevel: ReadingLevel;
  thinkingLevel: ThinkingLevel;
  grouping: Grouping;
  duration: Duration;
  /** Outcome codes (not ids), so a template survives a curriculum profile change. */
  outcomeCodes: string[];
  /** Room titles and instructions the teacher customised, by engine. */
  overrides: Partial<Record<StepType, { title?: string; instructions?: string; plainInstructions?: string }>>;
  builtIn: boolean;
}

// ---------------------------------------------------------------- Live sessions

export type LiveActivity = 'four-corners' | 'this-or-that' | 'showdown' | 'prediction' | 'wall' | 'courtroom';

export interface LiveParticipant {
  id: string;
  callSign: string;
  team: string;
  joinedAt: number;
}

export interface LiveResponse {
  participantId: string;
  round: number;
  choice?: string;
  text?: string;
  evidenceId?: string;
  /** Courtroom: objection target and type. */
  target?: string;
  objection?: ObjectionType;
  at: number;
}

export interface LiveSession {
  code: string;
  activity: LiveActivity;
  novelId: string;
  title: string;
  prompt: string;
  options: { id: string; label: string }[];
  evidenceIds: string[];
  /** Evidence the teacher introduced between rounds. */
  introduced: string[];
  phase: 'lobby' | 'open' | 'locked' | 'reveal' | 'ended';
  round: number;
  /** Courtroom sub-stage. */
  stage?: 'arguments' | 'objections' | 'verdict';
  rulings: Record<string, 'sustained' | 'overruled'>;
  hidden: string[];
  participants: LiveParticipant[];
  responses: LiveResponse[];
  createdAt: number;
  endedAt?: number;
}
