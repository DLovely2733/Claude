import type { ReasoningSignals } from './reasoning';
import type { ThinkingLevel } from '../data/types';

// The Literary Mentor: a questioning coach, not an answer machine.
//
// The built-in mentor runs entirely in the browser. It reads the reasoning
// signals of what the student wrote and answers with questions, sentence
// frames, or a worked model drawn from a *different* story, so it can show
// the shape of good reasoning without doing the student's thinking.
// It never produces quotations, page numbers, plot facts or finished answers.

export type MentorTone = 'question' | 'frame' | 'model' | 'notice' | 'guard';

export interface MentorMessage {
  tone: MentorTone;
  text: string;
}

export interface MentorContext {
  task: 'justify' | 'case' | 'explain' | 'theme' | 'reflect' | 'connection';
  thinkingLevel: ThinkingLevel;
  /** Evidence cards the student attached, if the task has cards. */
  evidenceCount?: number;
  /** Chapters the student is allowed to see. */
  unlockedChapters: number[];
  /** How many times the student has asked for help on this response. */
  depth: number;
}

const MODELS: Record<MentorContext['task'], string> = {
  justify:
    'Model from a different story: “I would warn the village, because in the first chapter the boy saw how fast the river was rising. Someone who has seen danger up close feels responsible for others.”',
  case:
    'Model from a different story: “The wolf is more desperate than evil. He only attacks after his own den is flooded (fact), which suggests hunger drives him (interpretation). Some readers see him as a villain, but that ignores what he loses.”',
  explain:
    'Model from a different story: “Opening with the storm makes readers feel uneasy before anything happens, so we expect the trip to go wrong.”',
  theme:
    'Model from a different story: Topic “courage” → “Courage is often quiet: the novel suggests standing up for one person can matter more than a dramatic act.”',
  reflect:
    'Model from a different story: “At first I thought the captain was selfish. After seeing him give up his lifeboat seat, I now think he hides his fear behind rudeness.”',
  connection:
    'Model from a different story: “Mira → Tomas: mentor. She teaches him to sail in chapter 2, but by chapter 9 he no longer listens to her, so the mentorship becomes a rivalry.”',
};

const FRAMES: Record<MentorContext['task'], string> = {
  justify: 'Try: “I chose ___ because in Chapter ___, ___. This shows that ___ matters to me as commander.”',
  case: 'Try: “I believe ___. When ___ happens in Chapter ___, it suggests ___. Some readers might argue ___, but ___.”',
  explain: 'Try: “Because readers know ___ and Ender does not, the chapter feels ___.”',
  theme: 'Try: “In Chapters ___, the novel suggests that leaders ___, but ___.”',
  reflect: 'Try: “At first I thought ___. After ___, I now think ___.”',
  connection: 'Try: “___ and ___ are connected because in Chapter ___, ___.”',
};

export function mentorRespond(text: string, s: ReasoningSignals, ctx: MentorContext): MentorMessage[] {
  const msgs: MentorMessage[] = [];

  const lockedRefs = s.chapters.filter((c) => !ctx.unlockedChapters.includes(c));
  if (lockedRefs.length) {
    msgs.push({
      tone: 'guard',
      text: `Chapter ${lockedRefs.join(', ')} is not unlocked for this mission, so I can’t talk about it. Keep your thinking to the chapters your class has read.`,
    });
  }

  if (!text.trim()) {
    msgs.push({ tone: 'question', text: 'What is your first idea? Write it in any words, and we will sharpen it together.' });
    return msgs;
  }

  // Name a strength first, so feedback starts from what the student did.
  const strengths: string[] = [];
  if (s.citesEvidence) strengths.push('you pointed to something in the text');
  if (s.explains) strengths.push('you explained how your evidence connects to your idea');
  if (s.counters) strengths.push('you considered another point of view');
  if (s.qualifies && !s.absolutes.length) strengths.push('you used careful language');
  if (strengths.length) msgs.push({ tone: 'notice', text: `I notice ${joinList(strengths)}.` });

  const questions: string[] = [];
  const needsEvidence = !s.citesEvidence && !(ctx.evidenceCount && ctx.evidenceCount > 0);
  if (needsEvidence) questions.push('What happened in the chapter that makes you think that?');
  if (!s.explains) questions.push('How does that evidence prove your point? Try connecting them with “because” or “this shows”.');
  if (s.absolutes.length)
    questions.push(`You wrote “${s.absolutes[0]}”. Is that true every single time in the novel, or is it more complicated?`);
  if (!s.counters && ctx.thinkingLevel !== 'foundational')
    questions.push('Could another reader see this differently? What would they point to?');
  if (ctx.task === 'theme' && s.characters.length && !/\b(people|leaders?|someone|a person|humans?)\b/i.test(text))
    questions.push('Your statement is about a character. Can you widen it into an idea about people or leaders in general?');
  if (ctx.task === 'case' && ctx.thinkingLevel === 'sophisticated' && !s.qualifies)
    questions.push('How certain can you be? Which word would show how strongly the evidence supports you?');
  if (s.words < 12) questions.push('Can you say more? What does the author’s choice reveal about this character?');
  if (!questions.length) questions.push('Strong thinking. What is the single best piece of evidence for your idea, and why is it better than the others?');

  // Deeper help each time the student asks: question → frame → model.
  msgs.push({ tone: 'question', text: questions[ctx.depth % questions.length] });
  if (ctx.depth >= 1) msgs.push({ tone: 'frame', text: FRAMES[ctx.task] });
  if (ctx.depth >= 2) msgs.push({ tone: 'model', text: MODELS[ctx.task] });
  return msgs;
}

function joinList(items: string[]) {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * Interface for a server-side AI mentor. A hosted deployment can implement
 * this with a model call that receives only the unlocked chapter knowledge,
 * using the same rules: questions only, no quotations, no finished answers.
 * The demo uses the built-in mentor above.
 */
export interface MentorProvider {
  respond(text: string, ctx: MentorContext): Promise<MentorMessage[]>;
}
