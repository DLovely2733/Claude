import type { Mission } from '../types';
import { ALBERTA_ELA_HEADINGS } from '../curriculum';

const out = (...codes: string[]) =>
  codes.map((c) => {
    const found = ALBERTA_ELA_HEADINGS.outcomes.find((x) => x.code === c);
    if (!found) throw new Error(`Unknown outcome heading ${c}`);
    return found.id;
  });

// The polished demonstration mission for Ender's Game, Chapters 11–13.
// All instructional content is original. The simulated consequences in the
// dilemma are hypothetical and are always labelled as such in the player.

export const pressurePoint: Mission = {
  id: 'm-pressure-point',
  novelId: 'enders-game',
  title: 'Operation Pressure Point',
  codename: 'PRESSURE POINT',
  summary:
    'Chapters 11–13. Lead Dragon Army through an impossible morning, open the Graff File, crack the Signal Vault, and decide what the novel is saying about leadership.',
  chapterNumbers: [11, 12, 13],
  outcomes: out('1.2', '2.2', '2.3', '3.3', '4.1'),
  readingLevel: 'standard',
  thinkingLevel: 'developing',
  grouping: 'independent',
  duration: 45,
  status: 'published',
  createdBy: 'demo',
  updatedAt: 0,
  steps: [
    {
      id: 's-briefing',
      type: 'briefing',
      title: 'Mission Briefing',
      skill: 'Get ready to think: recall what you read and the words you will need.',
      outcomes: out('2.1'),
      instructions:
        'This mission is about Chapters 11–13. Read them before you start. The recap below can help you remember, but it does not replace the chapters: your evidence has to come from the book.',
      plainInstructions: 'Read Chapters 11–13 first. The short recap helps you remember. Your evidence must come from the book.',
      chunks: [
        {
          heading: 'Where we are',
          text: 'Ender now commands Dragon Army, made up mostly of new students. The adults running Battle School are pushing him harder than any commander before him.',
          plain: 'Ender leads Dragon Army. The adults push him harder than anyone before.',
        },
        {
          heading: 'What to watch for',
          text: 'Notice who is making decisions, who knows what, and what each choice costs Ender. Ask yourself whether the adults are protecting him or using him.',
          plain: 'Watch who makes choices and who knows secrets. Are the adults helping Ender or using him?',
        },
        {
          heading: 'Your role',
          text: 'You will act as a commander, an investigator and a code-breaker. In every room you will be asked to back up your thinking with evidence from the chapters.',
          plain: 'You will lead, investigate and solve puzzles. Always back up your ideas with the book.',
        },
      ],
      vocab: ['v-launchy', 'v-toon', 'v-gate', 'v-motivation', 'v-inference', 'v-interp'],
    },
    {
      id: 's-dilemma',
      type: 'dilemma',
      title: 'The Dawn Battle',
      skill: 'Make a decision as a character might, and justify it with what you learned from the novel.',
      outcomes: out('1.2', '2.2'),
      instructions:
        'This is a simulation inspired by Chapter 11. Explore the command centre, make a decision as Dragon Army’s commander, and justify it. The outcomes you see are hypothetical. Afterwards you will compare your choice with what happens in the novel.',
      plainInstructions: 'This is a pretend situation based on Chapter 11. Look around, make a choice, and explain why. Then compare with the book.',
      scenario:
        'It is 0600. A battle order has appeared on your desk with no warning: your second battle in two days. Your soldiers are exhausted. Intelligence says you may be facing conditions no army has faced before. Bean, one of your youngest toon leaders, has an untested idea. You have twenty minutes to decide how Dragon Army goes in.',
      plainScenario:
        'It is early morning. You must fight another battle, with no warning. Your soldiers are very tired. The battle may be unfair. Bean has a new idea that has never been tried. You have twenty minutes to decide.',
      hotspots: [
        { id: 'h-orders', icon: 'orders', label: 'Battle order',
          text: 'The order arrived minutes ago. No reason is given for the schedule change. No other army has been given a battle this soon after the last one.',
          plain: 'The order came with no warning and no reason. No other army has to fight this often.' },
        { id: 'h-squad', icon: 'squad', label: 'Squad status',
          text: 'Most of Dragon Army slept badly. Several soldiers are frustrated that they never get time to practise. They are loyal, but they are close to their limit.',
          plain: 'Your soldiers are tired and upset. They are loyal, but almost out of energy.' },
        { id: 'h-intel', icon: 'intel', label: 'Bean’s proposal',
          text: 'Bean’s small squad has been practising a new tactic with gear nobody else uses. It could surprise the enemy, or it could fall apart in a real battle.',
          plain: 'Bean’s team practised a new trick. It could surprise the enemy, or it could fail.' },
        { id: 'h-log', icon: 'log', label: 'Commander’s log',
          text: 'Your last entry: “They are changing the rules. Why?” You have won every battle so far, but you feel more alone after each one.',
          plain: 'Your last note: “They keep changing the rules. Why?” You keep winning, but you feel more alone.' },
      ],
      choices: [
        {
          id: 'c-proven', label: 'Use your proven formations. No surprises.',
          plain: 'Use the plan that always worked.',
          values: ['caution', 'responsibility'],
          consequence:
            'SIMULATION: Your soldiers know exactly what to do, and they hold together even though they are tired. But the enemy has studied your old battles. The fight is slow and costly. You win narrowly, and Bean asks quietly why you no longer trust new ideas.',
          plainConsequence: 'SIMULATION: Your army knows the plan. But the enemy expected it. You barely win. Bean wonders why you did not trust his idea.',
          followUp: {
            prompt: 'After the battle, Bean is frustrated. What do you do?',
            choices: [
              { id: 'f1', label: 'Explain your reasoning to Bean.', consequence: 'SIMULATION: Bean is still frustrated, but he understands. Your army trusts that you think things through.' },
              { id: 'f2', label: 'Tell him a commander does not explain himself.', consequence: 'SIMULATION: Bean stops offering ideas. You have kept control, but lost a source of creativity.' },
            ],
          },
        },
        {
          id: 'c-bean', label: 'Trust Bean’s untested tactic.',
          plain: 'Try Bean’s new idea.',
          values: ['trust', 'adaptability'],
          consequence:
            'SIMULATION: The enemy has no answer for something they have never seen. The battle turns fast. But one of Bean’s soldiers is frozen early, and the rest of the army realizes how close it came. They are energized and nervous at the same time.',
          plainConsequence: 'SIMULATION: The surprise works and you win fast. But it almost failed. Your army is excited and nervous.',
          followUp: {
            prompt: 'Your other toon leaders feel overlooked. What do you do?',
            choices: [
              { id: 'f3', label: 'Give every toon a chance to propose ideas.', consequence: 'SIMULATION: Your army becomes more creative, but planning takes longer.' },
              { id: 'f4', label: 'Keep Bean’s squad special.', consequence: 'SIMULATION: Bean’s squad grows sharper, but some soldiers resent him, just as others resented you.' },
            ],
          },
        },
        {
          id: 'c-protest', label: 'Go to the teachers and challenge the schedule first.',
          plain: 'Complain to the teachers before fighting.',
          values: ['fairness', 'honesty'],
          consequence:
            'SIMULATION: The teachers listen politely and change nothing. You have lost ten minutes of planning. Your soldiers notice you stood up for them, but the battle is harder because you are rushed.',
          plainConsequence: 'SIMULATION: The teachers listen but change nothing. You lose planning time. Your soldiers see you stood up for them.',
          followUp: {
            prompt: 'You have ten minutes left. What do you do?',
            choices: [
              { id: 'f5', label: 'Improvise a plan with your toon leaders.', consequence: 'SIMULATION: Sharing the planning keeps the army together under pressure.' },
              { id: 'f6', label: 'Make every decision alone, fast.', consequence: 'SIMULATION: You move quickly, but you carry the full weight of the battle by yourself.' },
            ],
          },
        },
        {
          id: 'c-push', label: 'Push everyone harder. Winning is all that matters.',
          plain: 'Push your soldiers harder. Only winning matters.',
          values: ['winning', 'control'],
          consequence:
            'SIMULATION: Dragon Army wins decisively. Afterwards, nobody celebrates. Two soldiers ask to transfer, and you realize you sounded exactly like the adults you resent.',
          plainConsequence: 'SIMULATION: You win big. But nobody is happy. Two soldiers want to leave. You sound like the adults you dislike.',
          followUp: {
            prompt: 'How do you respond to the transfer requests?',
            choices: [
              { id: 'f7', label: 'Talk to them and admit you went too far.', consequence: 'SIMULATION: One stays. You learn that winning and leading are not the same thing.' },
              { id: 'f8', label: 'Let them go. The army must be tough.', consequence: 'SIMULATION: Dragon Army becomes harder, and lonelier, like its commander.' },
            ],
          },
        },
      ],
      canonNote:
        'In the novel, Ender does not get to choose whether conditions are fair: the adults keep changing them on purpose. He keeps winning by adapting and by trusting talented soldiers like Bean, but the pressure leaves him exhausted and increasingly alone. Think about whether your choice protected your army, your goals or yourself, and how that compares with Ender.',
      canonVerification: 'needs-check',
      evidenceIds: ['ec-rules', 'ec-exhausted', 'ec-bean', 'ec-int-adapt', 'ec-int-isolate'],
      valueOptions: ['loyalty', 'trust', 'fairness', 'responsibility', 'winning', 'control', 'adaptability', 'caution', 'compassion', 'honesty'],
    },
    {
      id: 's-board',
      type: 'evidence-board',
      title: 'The Graff File',
      skill: 'Investigate a character’s motivation. Sort facts from interpretations and build a case with evidence.',
      outcomes: out('2.2', '3.3'),
      instructions:
        'Colonel Graff controls almost everything about Ender’s life. Is he protecting Ender, or using him? Sort each evidence card as a fact (something that happens) or an interpretation (a reading of what it means). Pin cards to the theory they support or challenge, connect related cards, rule out theories the evidence does not support, and file your case report. More than one theory can be defended.',
      plainInstructions:
        'Is Graff helping Ender or using him? Sort each card: fact or interpretation. Pin cards to a theory. Rule out weak theories. Write your case report. More than one answer can work.',
      caseTitle: 'THE GRAFF FILE',
      caseQuestion: 'Is Colonel Graff protecting Ender, or using him?',
      theories: [
        { id: 'th-tool', label: 'Graff sees Ender only as a weapon. Ender’s wellbeing does not matter to him.',
          plain: 'Graff only cares about using Ender as a weapon.',
          defensible: true,
          challenge: 'This theory is strong on Graff’s actions. Which card suggests Graff may feel something about what he is doing? How does your case answer it?' },
        { id: 'th-cost', label: 'Graff cares about Ender but believes saving humanity justifies hurting him.',
          plain: 'Graff cares about Ender, but thinks saving everyone is worth hurting him.',
          defensible: true,
          challenge: 'This theory asks you to prove two things: that Graff cares, and that he hurts Ender anyway. Have you pinned evidence for both halves?' },
        { id: 'th-orders', label: 'Graff is only following orders. He has no choice.',
          plain: 'Graff is only following orders.',
          defensible: false,
          challenge: 'Look at who designs the schedule, the shuttle speech and the visit to Valentine. Does the evidence show Graff following plans, or making them?' },
        { id: 'th-protect', label: 'Graff is protecting Ender by making him strong enough to survive.',
          plain: 'Graff is protecting Ender by making him strong.',
          defensible: true,
          challenge: 'If Graff is protecting Ender, how do you explain the adults not stepping in when Ender is in danger? Your case needs to answer that card.' },
      ],
      cards: [
        { evidenceId: 'ec-rules', supports: ['th-tool', 'th-cost'], challenges: ['th-orders', 'th-protect'] },
        { evidenceId: 'ec-openings', supports: ['th-cost', 'th-tool'], challenges: ['th-orders'] },
        { evidenceId: 'ec-no-rescue', supports: ['th-tool', 'th-cost'], challenges: ['th-protect'] },
        { evidenceId: 'ec-valentine', supports: ['th-tool', 'th-cost'], challenges: ['th-orders'] },
        { evidenceId: 'ec-lake-talk', supports: ['th-cost', 'th-protect'], challenges: ['th-tool'] },
        { evidenceId: 'ec-honest', supports: ['th-cost', 'th-protect'], challenges: ['th-tool'] },
        { evidenceId: 'ec-shuttle', supports: ['th-tool', 'th-cost'], challenges: ['th-protect', 'th-orders'] },
        { evidenceId: 'ec-int-weight', supports: ['th-cost'], challenges: ['th-tool'] },
        { evidenceId: 'ec-int-isolate', supports: ['th-protect', 'th-cost', 'th-tool'], challenges: [] },
      ],
    },
    {
      id: 's-vault',
      type: 'reasoning-lock',
      title: 'The Signal Vault',
      skill: 'Reconstruct events, analyse an author’s choices, and build a theme statement.',
      outcomes: out('2.3', '2.2'),
      instructions:
        'Three locks stand between you and the vault. Each lock asks you to think about the chapters, not to remember trivia. Hints are always available and never count against you.',
      plainInstructions: 'Open three locks by thinking about the chapters. Use hints any time. Hints never count against you.',
      vaultName: 'SIGNAL VAULT',
      locks: [
        {
          kind: 'sequence',
          id: 'l-sequence',
          title: 'Lock 1 · Timeline Reconstruction',
          prompt: 'The signal is scrambled. Put these moments from Chapters 11–13 in the order they happen.',
          eventIds: ['ev-schedule', 'ev-two-armies', 'ev-cornered', 'ev-sent-away', 'ev-lake', 'ev-valentine', 'ev-returns'],
          hints: [
            'Start with what happens to Dragon Army in battle, then what happens outside the battleroom.',
            'Ender has to leave Battle School before he can be on Earth.',
            'Valentine’s visit happens because Ender refuses to go on.',
          ],
        },
        {
          kind: 'craft',
          id: 'l-craft',
          title: 'Lock 2 · The Author’s Choice',
          prompt:
            'Many chapters open with a private conversation between adults, often without saying who is speaking, before the story returns to Ender. What does this choice let the author do? Select every strong answer.',
          options: [
            { id: 'o1', strong: true, text: 'It lets readers see the adults planning and testing Ender, so we know about manipulation he cannot see.',
              why: 'Strong. This is dramatic irony: readers know more than Ender, which makes his experiences feel more troubling.' },
            { id: 'o2', strong: true, text: 'It shows how the adults justify their choices, so readers can judge whether those reasons are good enough.',
              why: 'Strong. Hearing the adults’ reasons lets readers evaluate them rather than just accept what happens.' },
            { id: 'o3', strong: false, text: 'It proves that the adults are villains.',
              why: 'Too absolute. The conversations show doubt and argument too. They complicate the adults rather than prove one thing.' },
            { id: 'o4', strong: false, text: 'It is mainly there to tell readers the setting.',
              why: 'Not quite. The openings reveal plans and motives more than place or time.' },
          ],
          explainPrompt: 'In one or two sentences: how does knowing what the adults are planning change the way you read a chapter?',
          hints: [
            'Ask: who knows more right now, Ender or me?',
            'An effect is what a choice does to the reader. Look for options about the reader’s understanding.',
          ],
        },
        {
          kind: 'theme',
          id: 'l-theme',
          title: 'Lock 3 · Theme Signal',
          topic: 'Leadership',
          prompt: '“Leadership” is a topic, not a theme. Choose the statement that best expresses what Chapters 11–13 suggest about leadership.',
          options: [
            { id: 't1', strong: false, flaw: 'too-general', text: 'Leadership is important.',
              why: 'Too general. It is true of almost any story and does not say anything about this one.' },
            { id: 't2', strong: false, flaw: 'summary', text: 'Ender leads Dragon Army and wins a lot of battles.',
              why: 'This is plot summary. It tells what happens, not what the novel suggests about life or people.' },
            { id: 't3', strong: true, text: 'Effective leaders adapt under pressure, but that pressure can cut them off from the people they lead.',
              why: 'Strong. It makes a claim about leadership in general and can be supported with Ender’s experience.' },
            { id: 't4', strong: false, flaw: 'absolute', text: 'Leaders must always do whatever it takes to win.',
              why: 'Too absolute, and the chapters complicate it: winning costs Ender a great deal.' },
          ],
          explainPrompt: 'Which detail from Chapters 11–13 best supports the statement you chose?',
          hints: [
            'A theme statement is a full sentence about people or life, not just about one character.',
            'Watch for words like “always” and “never”. Novels usually complicate them.',
          ],
        },
      ],
    },
    {
      id: 's-connections',
      type: 'connections',
      title: 'Shifting Alliances',
      skill: 'Map how relationships change, and justify each connection with evidence.',
      outcomes: out('2.2', '3.3'),
      instructions:
        'Build the network around Ender as it stands at the end of Chapter 13. Draw connections between characters, choose what kind of connection each is, and explain it with evidence. Then compare it with how the same relationships looked earlier in the book.',
      plainInstructions: 'Connect the characters. Choose the kind of connection. Explain each one with the book. Then compare with earlier chapters.',
      characterIds: ['ender', 'graff', 'valentine', 'bean', 'bonzo', 'peter', 'petra', 'alai'],
      fromChapter: 4,
      toChapter: 13,
    },
    {
      id: 's-log',
      type: 'reflection',
      title: 'Commander’s Log',
      skill: 'Develop a thematic interpretation and reflect on how your thinking changed.',
      outcomes: out('1.2', '4.1'),
      instructions:
        'Look back over your mission. Climb the theme ladder: start from a topic and build it into a statement that you could defend in an essay. Then reflect on how your thinking changed.',
      plainInstructions: 'Look back at your mission. Turn a topic into a theme sentence you can defend. Then say how your thinking changed.',
      themeId: 'leadership',
      prompts: [
        'Which piece of evidence changed or sharpened your thinking most during this mission?',
        'How did your decision in the Dawn Battle compare with what Ender does in the novel?',
      ],
    },
  ],
};
