import type { Mission } from '../types';
import { ALBERTA_ELA_HEADINGS } from '../curriculum';

const out = (...codes: string[]) => codes.map((c) => ALBERTA_ELA_HEADINGS.outcomes.find((x) => x.code === c)!.id);

// Second demonstration mission: a trial, a creative dispatch and a
// responsibility theme log. Original content; opposing arguments are written
// for students to evaluate, and each carries the teacher's judgement of it.

export const tribunal: Mission = {
  id: 'm-tribunal',
  novelId: 'enders-game',
  title: 'Operation Tribunal',
  codename: 'TRIBUNAL',
  summary: 'Chapters 11–13. Put Colonel Graff on trial, object to weak evidence, reach a verdict, then file a creative dispatch from Battle School.',
  chapterNumbers: [11, 12, 13],
  outcomes: out('2.2', '3.3', '2.4', '4.1', '5.2'),
  readingLevel: 'standard',
  thinkingLevel: 'developing',
  grouping: 'independent',
  duration: 45,
  status: 'published',
  createdBy: 'demo',
  updatedAt: 0,
  steps: [
    {
      id: 't-brief',
      type: 'briefing',
      title: 'Court is in session',
      skill: 'Get ready to argue from evidence, not opinion.',
      outcomes: out('2.1'),
      instructions: 'Today the class puts Colonel Graff on trial. You will argue one side, challenge the other side’s evidence, and then decide what you really think. Every argument has to come from Chapters 11–13 or earlier.',
      plainInstructions: 'You will argue for or against Graff. Then you decide what you really think. Use the book.',
      chunks: [
        { heading: 'The charge', text: 'Graff is charged with knowingly endangering a child in his care to reach a military goal.', plain: 'Did Graff put Ender in danger on purpose?' },
        { heading: 'Facts and interpretations', text: 'A fact is something that happens in the novel. An interpretation is a reading of what it means. Good lawyers use both, and never pass off one as the other.', plain: 'A fact happens in the book. An interpretation is what you think it means. Do not mix them up.' },
      ],
      vocab: ['v-interp', 'v-motivation', 'v-objection', 'v-speculation', 'v-manip'],
    },
    {
      id: 't-court',
      type: 'courtroom',
      title: 'The People v. Colonel Graff',
      skill: 'Build an argument from evidence, challenge weak reasoning, and weigh both sides.',
      outcomes: out('2.2', '3.3', '5.2'),
      instructions: 'Choose your side. Enter exhibits and label each as fact or interpretation. Cross-examine the other side’s arguments: object when they misuse evidence, and accept them when they are sound. Close your case, then step out of your role and give the verdict you think the evidence supports.',
      plainInstructions: 'Pick a side. Choose evidence. Challenge weak arguments. Then say what you really think.',
      caseTitle: 'THE PEOPLE v. COLONEL GRAFF',
      charge: 'Colonel Graff knowingly endangered Ender Wiggin, a child in his care, to achieve a military goal.',
      defendantId: 'graff',
      evidenceIds: ['ec-rules', 'ec-exhausted', 'ec-openings', 'ec-no-rescue', 'ec-valentine', 'ec-lake-talk', 'ec-honest', 'ec-shuttle', 'ec-int-weight', 'ec-int-isolate'],
      opposing: [
        { id: 'op-p1', side: 'prosecution', text: 'Graff wanted Ender to be hurt. He enjoys controlling him.', flaw: 'speculation',
          why: 'Nothing in the chapters shows Graff enjoying it, and the chapter openings show adults arguing about how much is too much. This presents a guess about his feelings as a fact.' },
        { id: 'op-p2', side: 'prosecution', text: 'The adults knew Ender was in danger from Bonzo and chose not to step in.', flaw: 'sound',
          why: 'This matches the evidence (Chapter 12). An objection would not hold; the defence has to answer it with reasons, not deny it.' },
        { id: 'op-p3', side: 'prosecution', text: 'Every adult at Battle School only cares about winning the war.', flaw: 'overgeneralization',
          why: 'It sweeps in every adult and uses “only”. The trial is about Graff’s choices, and the chapter openings show adults disagreeing.' },
        { id: 'op-d1', side: 'defence', text: 'Graff was honest with Ender from the start that Battle School would be hard and lonely.', flaw: 'sound',
          why: 'This matches the evidence (Chapter 3). The prosecution has to explain why honesty at the start does not excuse what came later.' },
        { id: 'op-d2', side: 'defence', text: 'Graff was only following orders, so he is not responsible for anything.', flaw: 'ignores-evidence',
          why: 'Graff shapes the schedule, the shuttle speech and Valentine’s visit. The evidence shows him making plans, not just following them.' },
        { id: 'op-d3', side: 'defence', text: 'Graff obviously loves Ender like a son.', flaw: 'speculation',
          why: 'There are signs Graff feels the weight of his choices, but “loves him like a son” goes beyond anything the chapters show.' },
      ],
      verdicts: ['Responsible', 'Partly responsible', 'Not responsible'],
    },
    {
      id: 't-studio',
      type: 'creative',
      title: 'Dispatches from Battle School',
      skill: 'Show your understanding through a creative or analytical piece, held to the same criteria.',
      outcomes: out('2.4', '4.1'),
      instructions: 'Show how pressure and isolation are changing Ender in Chapters 11–13. Choose the format that suits you. Every format is assessed on the same criteria, and each one ends with a craft note explaining your choices.',
      plainInstructions: 'Show how Ender is changing. Pick a format. Explain your choices at the end.',
      prompt: 'How are pressure and isolation changing Ender in Chapters 11–13?',
      formats: ['journal', 'interview', 'perspective', 'newspaper', 'profile', 'storyboard', 'argument', 'analysis'],
      characterIds: ['ender', 'graff', 'valentine', 'bean', 'bonzo', 'petra', 'alai'],
      criteria: [
        'Shows an accurate understanding of events in Chapters 11–13',
        'Reveals a character’s motivations or feelings, not just actions',
        'Connects to a theme: leadership, isolation, manipulation or responsibility',
        'Uses at least one piece of evidence from the novel',
        'Explains your choices in a craft note',
      ],
    },
    {
      id: 't-log',
      type: 'reflection',
      title: 'Closing the record',
      skill: 'Develop a thematic interpretation of responsibility.',
      outcomes: out('1.2', '4.1'),
      instructions: 'Climb the theme ladder for responsibility, then reflect on how arguing a side changed what you think.',
      plainInstructions: 'Build a theme sentence about responsibility. Then say how your thinking changed.',
      themeId: 'responsibility',
      prompts: [
        'Did arguing one side change what you actually believe about Graff? Explain.',
        'Which objection, yours or the other side’s, was the most important in the trial, and why?',
      ],
    },
  ],
};
