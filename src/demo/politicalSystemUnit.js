// Demonstration unit: Canada’s Political System (five sample lessons).
//
// Linked to the official Grade 9 outcome G9-LO6 of the Draft Social Studies
// (7–9) Curriculum, June 2026 (bundled as version `ab-ss79-draft-2026-06`):
//   “Students analyze how power is distributed and exercised in Canada’s
//    government, including how laws are made and how rights are protected.”
// Statement ids (e.g. G9-LO6-K5) refer to that version; the official wording
// is shown from the curriculum file, never copied here. The lessons show a
// review warning until the teacher verifies G9-LO6 against the source.
//
// The instructional text is an accessible presentation of those statements.

export const DEMO_VERSION_ID = 'ab-ss79-draft-2026-06';
export const DEMO_VERSION_LABEL = 'Draft Social Studies (7–9), June 2026 – Grade 9';
export const DEMO_OUTCOME_ID = 'G9-LO6';

const L = (n) => `demo-ps-${n}`;
const s = (n, k) => `${L(n)}-s${k}`;
const c = (n, k) => `${L(n)}-c${k}`;
const K = (n) => `G9-LO6-K${n}`;
const U = (n) => `G9-LO6-U${n}`;
const S = (n) => `G9-LO6-S${n}`;

function lesson(n, data) {
  const criteria = data.criteria.map((cr, i) => ({ id: `${L(n)}-cr${i + 1}`, goalIds: [], kind: 'adapted-outcome', ...cr }));
  const steps = data.steps.map((st) => ({ statementIds: [], ...st }));
  const statementIds = [...new Set([...data.essentialConcepts.flatMap((x) => x.statementIds), ...steps.flatMap((x) => x.statementIds), ...criteria.flatMap((x) => x.statementIds)])];
  return {
    id: L(n),
    unit: 'political-system',
    order: n,
    curriculumVersionId: DEMO_VERSION_ID,
    curriculumVersionLabel: DEMO_VERSION_LABEL,
    curriculumLinks: { outcomeIds: [DEMO_OUTCOME_ID], statementIds },
    individualGoals: [],
    origin: 'demo',
    draft: false,
    createdAt: '2026-10-24T00:00:00.000Z',
    updatedAt: '2026-10-24T00:00:00.000Z',
    ...data,
    steps,
    criteria,
  };
}

const FED_PROV = [
  { id: 'federal', label: 'Federal – all of Canada', symbol: '🍁' },
  { id: 'provincial', label: 'Provincial – Alberta', symbol: '🏔️' },
];

const CLASS_OUTCOME = 'Classmates are working on the Grade 9 outcome about how power is distributed and exercised in Canada’s government, including how laws are made and how rights are protected (G9-LO6).';

export const DEMO_LESSONS = [
  lesson(1, {
    title: 'Who makes decisions in Canada?',
    alignmentHint: 'House of Commons riding Member of Parliament Senate Crown responsible government accountable',
    classExpectations: `${CLASS_OUTCOME} The class is examining responsible government, Parliament and representation through ridings.`,
    classConnection: 'Same question as the class (“Who makes decisions in Canada?”), using our own riding, pictures and a class vote.',
    essentialConcepts: [
      { id: c(1, 1), text: 'Canada is divided into ridings. The people in each riding elect one Member of Parliament (MP). MPs sit in the House of Commons and make new laws by debating and voting.', plainText: 'We live in a riding. We vote for one MP. MPs make laws.', statementIds: [K(5), K(6)] },
      { id: c(1, 2), text: 'Canada’s Parliament has three parts – the Crown (represented by the Governor General), the Senate (appointed members) and the House of Commons (elected MPs) – and all three must approve laws.', plainText: 'Parliament has 3 parts: the Crown 👑, the Senate 🏛️ and the House of Commons 🗳️.', statementIds: [K(3), K(4), K(7)] },
      { id: c(1, 3), text: 'Responsible government: the government must keep the support of the elected House of Commons. If it loses that support, it must resign or call an election. This keeps the government accountable to the people’s representatives.', plainText: 'The government must listen to the MPs. If MPs say no, there can be a new election.', statementIds: [K(1), K(2)] },
    ],
    steps: [
      {
        id: s(1, 1), kind: 'connect', title: 'What my class is learning',
        text: 'Our class is learning how power is shared in Canada’s government. Today we find out who makes decisions.',
        plainText: 'Today: Who makes decisions in Canada?',
        keywords: [{ word: 'government', symbol: '🏛️', meaning: 'The people who make decisions and laws for a place' }, { word: 'vote', symbol: '🗳️', meaning: 'Choosing by marking your choice' }, { word: 'riding', symbol: '🗺️', meaning: 'An area that elects one MP' }],
        visual: { type: 'keyword-cards', alt: 'Cards: government, vote, riding' }, conceptIds: [c(1, 1)], statementIds: [U(1)],
      },
      {
        id: s(1, 2), kind: 'teach', title: 'Our riding chooses an MP',
        text: 'Canada is divided into areas called ridings. The people in each riding vote to elect one Member of Parliament (MP). The MP goes to the House of Commons in Ottawa to speak for the people in their riding and to make laws.',
        plainText: 'We live in a riding. We vote. One person wins. That person is our MP.',
        chunks: ['We live in a riding. 🗺️', 'People in the riding vote. 🗳️', 'The winner is our MP. 🧑‍💼', 'Our MP helps make laws. 📜'],
        visual: { type: 'vote', alt: 'People in a riding vote, an MP is elected, and the MP makes decisions in the House of Commons' }, conceptIds: [c(1, 1)],
      },
      {
        id: s(1, 3), kind: 'teach', title: 'Parliament has three parts',
        text: 'Canada’s Parliament has three parts. The House of Commons has the MPs we elect. The Senate has senators who are appointed (chosen, not elected) and who review laws. The Crown is represented by the Governor General, who gives Royal Assent (final approval) to laws. All three parts must approve a law.',
        plainText: 'Three parts: House of Commons 🗳️, Senate 🏛️, Crown 👑. All three must say yes to a law.',
        keywords: [{ word: 'House of Commons', symbol: '🗳️', meaning: 'Elected MPs' }, { word: 'Senate', symbol: '🏛️', meaning: 'Appointed senators who review laws' }, { word: 'Crown', symbol: '👑', meaning: 'The Governor General gives Royal Assent' }],
        visual: { type: 'keyword-cards', alt: 'Three cards: House of Commons, Senate, Crown' }, conceptIds: [c(1, 2)],
      },
      {
        id: s(1, 4), kind: 'teach', title: 'The government must listen',
        text: 'Canada has responsible government. The government must keep the support of the elected MPs in the House of Commons. If it loses their support, it must resign or call an election. This means the government is accountable – it has to answer to the people’s representatives.',
        plainText: 'The government needs the MPs to agree. If they do not, there can be a new election.',
        chunks: ['The government makes a plan.', 'MPs vote on it.', 'If most MPs say no 👎, the government must quit or call an election.'],
        visual: { type: 'two-sides', alt: 'Left: MPs agree and the government continues. Right: MPs disagree and there is a new election.', left: ['👍', 'MPs agree → the government keeps going'], right: ['👎', 'MPs say no → resign or new election'] },
        conceptIds: [c(1, 3)],
      },
      {
        id: s(1, 5), kind: 'practice', title: 'Elected or appointed?', text: 'Some people are elected (we vote). Some are appointed (chosen). Sort them.', repeat: 2,
        interaction: {
          type: 'sort', prompt: 'Is this person elected or appointed?',
          categories: [{ id: 'elected', label: 'Elected – people vote', symbol: '🗳️' }, { id: 'appointed', label: 'Appointed – chosen', symbol: '✋' }],
          items: [
            { id: 'mp', label: 'Member of Parliament (MP)', symbol: '🧑‍💼', categoryId: 'elected' },
            { id: 'senator', label: 'Senator', symbol: '🏛️', categoryId: 'appointed' },
            { id: 'gg', label: 'Governor General', symbol: '👑', categoryId: 'appointed' },
          ],
        },
        conceptIds: [c(1, 1), c(1, 2)],
      },
      {
        id: s(1, 6), kind: 'practice', title: 'How do we choose our MP?', text: 'Choose the best answer.',
        interaction: {
          type: 'choice', prompt: 'How do people in a riding choose their MP?',
          options: [
            { id: 'a', label: 'They vote', symbol: '🗳️', correct: true },
            { id: 'b', label: 'They pick a name from a hat', symbol: '🎩' },
            { id: 'c', label: 'They have a running race', symbol: '🏃' },
            { id: 'd', label: 'The Senate picks', symbol: '🏛️' },
          ],
          feedback: { correct: 'Yes! People in the riding vote for their MP.', incorrect: 'Try again. Look at the ballot box 🗳️.' },
        },
        conceptIds: [c(1, 1)],
      },
      {
        id: s(1, 7), kind: 'practice', title: 'What happens next?', text: 'Think about responsible government.',
        interaction: {
          type: 'choice', prompt: 'Most MPs vote against the government. What must the government do?',
          options: [
            { id: 'a', label: 'Resign or call an election', symbol: '🗳️', correct: true },
            { id: 'b', label: 'Nothing – keep going', symbol: '🤷' },
            { id: 'c', label: 'Close the House of Commons', symbol: '🚪' },
          ],
          feedback: { correct: 'Yes! The government must have the support of the MPs. That keeps it accountable.', incorrect: 'Look at the 👎 picture again.' },
        },
        conceptIds: [c(1, 3)], statementIds: [S(2)],
      },
      {
        id: s(1, 8), kind: 'apply', title: 'Vote for our class MP', text: 'Our class is a riding. Choose the person you would vote for to speak for our class.',
        interaction: {
          type: 'decision', prompt: 'Who would you vote for?',
          options: [
            { id: 'listen', label: 'Sam: “I will listen to everyone.”', symbol: '👂' },
            { id: 'park', label: 'Ava: “I will ask for a new playground.”', symbol: '🛝' },
            { id: 'lunch', label: 'Lee: “I will ask for longer lunch.”', symbol: '🥪' },
          ],
          reasonPrompt: 'Why would they speak well for our riding?',
          reasons: [
            { id: 'fair', label: 'They are fair', symbol: '⚖️' },
            { id: 'everyone', label: 'They help everyone', symbol: '🧑‍🤝‍🧑' },
            { id: 'want', label: 'They want what I want', symbol: '💬' },
          ],
          discussion: 'Hold a class vote. Talk about it: an MP speaks for everyone in the riding, including people who did not vote for them.',
        },
        conceptIds: [c(1, 1)], statementIds: [S(3)],
      },
      {
        id: s(1, 9), kind: 'check', title: 'Show what you know', text: 'Show how our riding chooses an MP, and name the three parts of Parliament.',
        interaction: { type: 'respond', prompt: 'Who makes decisions in Canada? Show me.' }, conceptIds: [c(1, 1), c(1, 2), c(1, 3)],
      },
    ],
    demonstrationModes: ['tap', 'sort', 'speak', 'aac', 'draw', 'yesno'],
    criteria: [
      { text: 'Shows that people in a riding vote to elect an MP, who makes laws in the House of Commons.', statementIds: [K(5), K(6), S(3)] },
      { text: 'Identifies the three parts of Parliament (Crown, Senate, House of Commons), including which members are elected and which are appointed, with the support level recorded.', statementIds: [K(3), K(4), K(7)] },
      { text: 'Shows that the government must keep the support of elected MPs or face an election (responsible government).', statementIds: [K(1), K(2), S(2)] },
    ],
  }),

  lesson(2, {
    title: 'What do federal and provincial governments do?',
    alignmentHint: 'federal system power divided federal provincial responsibilities defence banking currency trade criminal law citizenship education healthcare natural resources municipalities',
    classExpectations: `${CLASS_OUTCOME} The class is examining how power is divided between the federal and provincial governments.`,
    classConnection: 'Same concept as the class (the federal system and division of powers), shown with services the student uses every day.',
    essentialConcepts: [
      { id: c(2, 1), text: 'Canada is a federal system: power is divided between the federal government and the provincial governments.', plainText: 'Canada’s government and Alberta’s government have different jobs.', statementIds: [K(11)] },
      { id: c(2, 2), text: 'The federal government is responsible for defence, banking and currency, trade and commerce, criminal law and citizenship.', plainText: 'Canada’s government 🍁: army, money, trade, criminal law, citizenship.', statementIds: [K(12)] },
      { id: c(2, 3), text: 'Provincial governments are responsible for education, healthcare, property and civil rights, municipalities and natural resources.', plainText: 'Alberta’s government 🏔️: schools, health care, towns and cities, natural resources like oil and gas.', statementIds: [K(13), K(14)] },
    ],
    steps: [
      {
        id: s(2, 1), kind: 'connect', title: 'What my class is learning',
        text: 'Our class is learning how power is divided between Canada’s government and Alberta’s government.', plainText: 'Today: Which government does which job?',
        keywords: [{ word: 'federal', symbol: '🍁', meaning: 'The government for all of Canada' }, { word: 'provincial', symbol: '🏔️', meaning: 'The government for Alberta' }, { word: 'responsibility', symbol: '🧰', meaning: 'A job you must do' }],
        visual: { type: 'keyword-cards', alt: 'Cards: federal, provincial, responsibility' }, conceptIds: [c(2, 1)], statementIds: [U(1)],
      },
      {
        id: s(2, 2), kind: 'teach', title: 'Different jobs',
        text: 'Think of a school. The principal, the teacher and the custodian all have different jobs. Governments are like that too. Canada is a federal system: some jobs belong to the federal government and some belong to the provincial government.',
        plainText: 'At school, people have different jobs. Governments have different jobs too.',
        chunks: ['The principal has a job.', 'The teacher has a job.', 'Canada’s government and Alberta’s government have different jobs too.'],
        keywords: [{ word: 'principal', symbol: '🧑‍💼', meaning: 'Runs the school' }, { word: 'teacher', symbol: '🧑‍🏫', meaning: 'Teaches the class' }, { word: 'custodian', symbol: '🧹', meaning: 'Takes care of the building' }],
        visual: { type: 'keyword-cards', alt: 'School jobs compared to government jobs' }, conceptIds: [c(2, 1)],
      },
      {
        id: s(2, 3), kind: 'teach', title: 'Who does what?',
        text: 'Federal government: defence (the Canadian Armed Forces), banking and currency (money), trade and commerce, criminal law, and citizenship. Provincial government: education (schools), healthcare, property and civil rights, municipalities (towns and cities), and natural resources such as oil and gas.',
        plainText: 'Canada 🍁: army, money, trade, criminal law, citizenship. Alberta 🏔️: schools, health care, towns, oil and gas.',
        visual: {
          type: 'jurisdiction', alt: 'Two columns showing federal and provincial responsibilities with pictures',
          columns: [
            { level: 'federal', items: [['🪖', 'Defence'], ['💵', 'Banking and money'], ['🚢', 'Trade'], ['⚖️', 'Criminal law'], ['🛂', 'Citizenship']] },
            { level: 'provincial', items: [['🏫', 'Education'], ['🏥', 'Healthcare'], ['🏠', 'Property and civil rights'], ['🏘️', 'Municipalities'], ['🛢️', 'Natural resources']] },
          ],
        },
        conceptIds: [c(2, 2), c(2, 3)],
      },
      {
        id: s(2, 4), kind: 'practice', title: 'Sort the jobs', text: 'Put each job with the government that does it.', repeat: 2,
        interaction: {
          type: 'sort', prompt: 'Which government does this job?', categories: FED_PROV,
          items: [
            { id: 'money', label: 'Money', symbol: '💵', categoryId: 'federal' },
            { id: 'defence', label: 'Army / defence', symbol: '🪖', categoryId: 'federal' },
            { id: 'citizen', label: 'Citizenship', symbol: '🛂', categoryId: 'federal' },
            { id: 'schools', label: 'Schools', symbol: '🏫', categoryId: 'provincial' },
            { id: 'health', label: 'Hospitals and health care', symbol: '🏥', categoryId: 'provincial' },
            { id: 'oil', label: 'Oil and gas', symbol: '🛢️', categoryId: 'provincial' },
          ],
        },
        conceptIds: [c(2, 2), c(2, 3)], statementIds: [S(1)],
      },
      {
        id: s(2, 5), kind: 'practice', title: 'Quick check', text: 'Choose the best answer.',
        interaction: {
          type: 'choice', prompt: 'Which government is responsible for schools in Alberta?',
          options: [
            { id: 'p', label: 'Provincial (Alberta)', symbol: '🏔️', correct: true },
            { id: 'f', label: 'Federal (Canada)', symbol: '🍁' },
          ],
          feedback: { correct: 'Yes! Education is a provincial responsibility.', incorrect: 'Look at the chart again. Find the school 🏫.' },
        },
        conceptIds: [c(2, 3)],
      },
      {
        id: s(2, 6), kind: 'apply', title: 'Who should I ask?', text: 'Towns and cities are a provincial responsibility – the province creates them and gives them jobs like fixing local roads. There is a big pothole on your street. Who should you tell?',
        interaction: {
          type: 'choice', prompt: 'A pothole on my street. Who fixes it?',
          options: [
            { id: 'm', label: 'Our town or city', symbol: '🏘️', correct: true },
            { id: 'f', label: 'The Canadian Armed Forces', symbol: '🪖' },
            { id: 'h', label: 'The hospital', symbol: '🏥' },
          ],
          feedback: { correct: 'Yes! Our town or city fixes local roads.', incorrect: 'Think about who looks after our street 🏘️.' },
        },
        conceptIds: [c(2, 3)], statementIds: [S(1)],
      },
      {
        id: s(2, 7), kind: 'check', title: 'Show what you know', text: 'Show one job for Canada’s government and one job for Alberta’s government.',
        interaction: { type: 'respond', prompt: 'One job for Canada 🍁. One job for Alberta 🏔️.' }, conceptIds: [c(2, 1), c(2, 2), c(2, 3)],
      },
    ],
    demonstrationModes: ['sort', 'tap', 'speak', 'aac', 'draw', 'photo'],
    criteria: [
      { text: 'Sorts familiar responsibilities into federal and provincial, with the support level recorded.', statementIds: [K(12), K(13), S(1)] },
      { text: 'Identifies at least one federal and one provincial responsibility.', statementIds: [K(11), K(12), K(13)] },
      { text: 'Chooses the right level of government to contact about a local problem.', statementIds: [K(13), S(1)] },
    ],
  }),

  lesson(3, {
    title: 'How does an idea become a law?',
    alignmentHint: 'formal legislative process bill drafting first reading second reading committee stage third reading Senate royal assent',
    classExpectations: `${CLASS_OUTCOME} The class is examining the formal legislative process.`,
    classConnection: 'Same process as the class (how a bill becomes law), taught as a picture sequence and acted out with a class vote.',
    essentialConcepts: [
      { id: c(3, 1), text: 'A law is a rule that everyone must follow. A law starts as a written bill (bill drafting).', plainText: 'A law is a rule for everyone. It starts as a bill.', statementIds: [K(8)] },
      { id: c(3, 2), text: 'In the House of Commons, a bill has a first reading (introduction), a second reading (debate), a committee stage (detailed review) and a third reading (final approval). Then the Senate must approve it.', plainText: 'MPs read the bill, talk about it, check it and vote. Then the Senate votes.', statementIds: [K(8), K(5), K(7)] },
      { id: c(3, 3), text: 'The bill becomes law when it receives Royal Assent from the Crown, represented by the Governor General.', plainText: 'The last step is Royal Assent ✍️. Then it is a law.', statementIds: [K(8), K(4)] },
      { id: c(3, 4), text: 'Because many people and institutions debate, review and approve a bill, no single person can make a law alone.', plainText: 'Many people check a bill. One person cannot make a law alone.', statementIds: [K(9)] },
    ],
    steps: [
      {
        id: s(3, 1), kind: 'connect', title: 'What my class is learning',
        text: 'Our class is learning how laws are made in Canada.', plainText: 'Today: How is a law made?',
        keywords: [{ word: 'law', symbol: '📜', meaning: 'A rule everyone must follow' }, { word: 'bill', symbol: '📝', meaning: 'An idea for a new law, written down' }, { word: 'vote', symbol: '🗳️', meaning: 'Choosing yes or no' }],
        visual: { type: 'keyword-cards', alt: 'Cards: law, bill, vote' }, conceptIds: [c(3, 1)], statementIds: [U(1)],
      },
      {
        id: s(3, 2), kind: 'teach', title: 'What is a law?',
        text: 'Schools have rules, like “walk in the hallway.” Canada has rules too. These rules are called laws. Everyone must follow laws. For example, drivers must stop at a red light. A new law starts as a written idea called a bill.',
        plainText: 'School has rules. Canada has rules too. They are called laws. A new law starts as a bill.',
        chunks: ['A rule tells us what to do.', 'A law is a rule for everyone.', 'Example: stop at a red light 🚦.', 'A new law starts as a bill 📝.'],
        keywords: [{ word: 'school rule', symbol: '🏫', meaning: 'Walk in the hallway' }, { word: 'law', symbol: '🚦', meaning: 'Stop at a red light' }, { word: 'bill', symbol: '📝', meaning: 'An idea for a new law' }],
        visual: { type: 'keyword-cards', alt: 'A school rule card next to a law card and a bill card' }, conceptIds: [c(3, 1)],
      },
      {
        id: s(3, 3), kind: 'teach', title: 'The steps',
        text: '1. Bill drafting: the bill is written. 2. First reading: the bill is introduced. 3. Second reading: MPs debate it. 4. Committee stage: a small group reviews it in detail. 5. Third reading: final vote. 6. The Senate approves it. 7. Royal Assent from the Crown. Now it is a law!',
        plainText: 'Write the bill 📝 → Read and talk 🗣️ → Check it 🔍 → Vote 🗳️ → Senate 🏛️ → Royal Assent ✍️ → Law 📜',
        visual: {
          type: 'steps', alt: 'Arrow sequence: bill drafting, first reading, second reading, committee stage, third reading, Senate approval, Royal Assent, law',
          items: [['📝', 'Bill drafting'], ['📖', 'First reading'], ['🗣️', 'Second reading (debate)'], ['🔍', 'Committee stage'], ['🗳️', 'Third reading (vote)'], ['🏛️', 'Senate approval'], ['✍️', 'Royal Assent'], ['📜', 'Law']],
          simpleItems: [['📝', 'Write the bill'], ['🗣️', 'Read and talk'], ['🔍', 'Check it'], ['🗳️', 'Vote'], ['🏛️', 'Senate'], ['✍️', 'Royal Assent'], ['📜', 'Law']],
        },
        conceptIds: [c(3, 2), c(3, 3)],
      },
      {
        id: s(3, 4), kind: 'practice', title: 'Put the steps in order', text: 'Tap the steps in the right order.', repeat: 2,
        interaction: {
          type: 'sequence', prompt: 'What comes first? Then what?',
          items: [{ id: 'draft', label: 'Write the bill', symbol: '📝' }, { id: 'readings', label: 'Readings and debate', symbol: '🗣️' }, { id: 'committee', label: 'Committee checks it', symbol: '🔍' }, { id: 'senate', label: 'Senate approves', symbol: '🏛️' }, { id: 'assent', label: 'Royal Assent', symbol: '✍️' }],
        },
        conceptIds: [c(3, 2), c(3, 3)],
      },
      {
        id: s(3, 5), kind: 'practice', title: 'Yes or no?', text: 'Think about the steps.',
        interaction: { type: 'yesno', prompt: 'Can one person make a new law all alone?', answer: false, feedback: { correct: 'Right! Many people debate, check and approve a bill.', incorrect: 'Look at the steps. MPs, the Senate and the Crown all take part.' } },
        conceptIds: [c(3, 4)], statementIds: [S(8)],
      },
      {
        id: s(3, 6), kind: 'apply', title: 'Make a bill for our school', text: 'Choose an idea for a new school rule. Then the class debates and votes on it, like MPs do.',
        interaction: {
          type: 'decision', prompt: 'Which idea should become our bill?',
          options: [
            { id: 'recycle', label: 'Recycling bins in every classroom', symbol: '♻️' },
            { id: 'quiet', label: 'A quiet room at lunch', symbol: '🤫' },
            { id: 'music', label: 'Music in the hallway in the morning', symbol: '🎵' },
          ],
          reasonPrompt: 'Why is it a good idea?',
          reasons: [{ id: 'help', label: 'It helps people', symbol: '🤝' }, { id: 'safe', label: 'It keeps us safe', symbol: '🦺' }, { id: 'earth', label: 'It helps the Earth', symbol: '🌎' }, { id: 'happy', label: 'It makes people happy', symbol: '😊' }],
          discussion: 'Act it out: read the bill to the class (first reading), debate it (second reading), have a small group check it (committee), vote (third reading), then a “senator” and the “Governor General” approve it.',
        },
        conceptIds: [c(3, 2), c(3, 3), c(3, 4)], statementIds: [S(8)],
      },
      {
        id: s(3, 7), kind: 'check', title: 'Show what you know', text: 'Show the steps from a bill to a law.',
        interaction: { type: 'respond', prompt: 'Show how a bill becomes a law.' }, conceptIds: [c(3, 1), c(3, 2), c(3, 3)],
      },
    ],
    demonstrationModes: ['sort', 'tap', 'demonstrate', 'speak', 'aac', 'draw', 'yesno'],
    criteria: [
      { text: 'Explains or shows that a law is a rule everyone must follow and that it starts as a bill.', statementIds: [K(8)] },
      { text: 'Sequences the main steps from bill to law (bill, readings and debate, committee, Senate, Royal Assent), with the support level recorded.', statementIds: [K(8), K(4), K(7)] },
      { text: 'Takes part in a simulated legislative process and shows that many people must approve a law.', statementIds: [K(5), K(9), S(8)] },
    ],
  }),

  lesson(4, {
    title: 'How do government decisions affect our communities?',
    alignmentHint: 'natural resources Alberta oil and gas royalties conflicts federal provincial environment rights responsibilities participating in democracy',
    classExpectations: `${CLASS_OUTCOME} The class is investigating how control over natural resources shapes provincial decision making, and how power affects communities.`,
    classConnection: 'Same inquiry as the class, grounded in real places and Alberta’s natural resources.',
    essentialConcepts: [
      { id: c(4, 1), text: 'Decisions made by the federal and provincial governments change things in our community, such as schools, hospitals, jobs and land.', plainText: 'Government decisions change our town.', statementIds: [U(1), S(1)] },
      { id: c(4, 2), text: 'Alberta’s government has authority over natural resources like oil and gas. Alberta’s economy relies heavily on oil and gas, and resource revenues (royalties) help shape decisions about growth and development.', plainText: 'Alberta decides about oil and gas 🛢️. Oil and gas give jobs and money.', statementIds: [K(14), K(15), S(7)] },
      { id: c(4, 3), text: 'A decision can help some people and make things harder for others. Federal and provincial governments sometimes disagree, for example about the environment.', plainText: 'A decision can help some people. It can be hard for others.', statementIds: [K(16)] },
      { id: c(4, 4), text: 'Citizens have rights, like voting, and responsibilities, like participating in democracy and respecting the rights of others.', plainText: 'I can vote and share my ideas. I respect other people’s ideas.', statementIds: [K(23)] },
    ],
    steps: [
      {
        id: s(4, 1), kind: 'connect', title: 'What my class is learning',
        text: 'Our class is learning how government decisions change our community.', plainText: 'Today: How do decisions change our town?',
        keywords: [{ word: 'community', symbol: '🏘️', meaning: 'The place where we live and the people in it' }, { word: 'decision', symbol: '🤔', meaning: 'A choice' }, { word: 'natural resources', symbol: '🛢️', meaning: 'Things from nature we use, like oil, gas, trees and water' }],
        visual: { type: 'keyword-cards', alt: 'Cards: community, decision, natural resources' }, conceptIds: [c(4, 1)],
      },
      {
        id: s(4, 2), kind: 'teach', title: 'Decisions all around us',
        text: 'Look around our community. Alberta’s government decides about our schools and hospitals. Canada’s government decides about money and the army. These decisions change our community.',
        plainText: 'The school 🏫 and hospital 🏥: Alberta decides. Money 💵: Canada decides.',
        visual: {
          type: 'community', alt: 'Community places labelled with the government that is responsible for them',
          items: [['🏫', 'School', 'provincial'], ['🏥', 'Hospital', 'provincial'], ['🛢️', 'Oil and gas', 'provincial'], ['🏦', 'Bank and money', 'federal'], ['🛂', 'Citizenship office', 'federal']],
        },
        conceptIds: [c(4, 1)],
      },
      {
        id: s(4, 3), kind: 'teach', title: 'Alberta’s oil and gas',
        text: 'Oil and gas are natural resources. In Canada, provinces have authority over their natural resources. Alberta’s economy relies heavily on oil and gas. They give people jobs, and the money Alberta collects (royalties) helps pay for things like schools and hospitals.',
        plainText: 'Alberta has oil and gas 🛢️. Alberta decides about them. They give jobs 👷 and money 💵 for schools and hospitals.',
        chunks: ['Oil and gas come from the ground. 🛢️', 'Alberta’s government decides about them.', 'They give people jobs. 👷', 'The money helps pay for schools and hospitals. 🏫🏥'],
        keywords: [{ word: 'oil and gas', symbol: '🛢️', meaning: 'Natural resources from the ground' }, { word: 'jobs', symbol: '👷', meaning: 'Work people are paid for' }, { word: 'royalties', symbol: '💵', meaning: 'Money Alberta collects from resources' }],
        visual: { type: 'keyword-cards', alt: 'Cards: oil and gas, jobs, royalties' }, conceptIds: [c(4, 2)],
      },
      {
        id: s(4, 4), kind: 'teach', title: 'Good for some, hard for others',
        text: 'Alberta approves a new oil and gas project near a town. Some people get jobs, and there is more money for schools and hospitals. But some people worry about noise, the land and the animals. Canada’s government and Alberta’s government might disagree about protecting the environment. One decision can help some people and make things harder for others.',
        plainText: 'New oil project 🛢️: more jobs 😊. Worry about land and animals 😟.',
        chunks: ['Alberta says yes to a new oil project.', 'People get jobs. 😊', 'Some people worry about the land and animals. 😟'],
        visual: { type: 'two-sides', alt: 'Left: jobs and money for services. Right: worries about land and animals.', left: ['😊', 'Helps: jobs and money for schools'], right: ['😟', 'Harder: noise, land and animals'] },
        conceptIds: [c(4, 3)],
      },
      {
        id: s(4, 5), kind: 'practice', title: 'Helps or harder?', text: 'Alberta approves a new oil and gas project near a town. Sort each card.', repeat: 2,
        interaction: {
          type: 'sort', prompt: 'Does this help, or make it harder?',
          categories: [{ id: 'help', label: 'Helps', symbol: '😊' }, { id: 'hard', label: 'Makes it harder', symbol: '😟' }],
          items: [
            { id: 'jobs', label: 'People get jobs', symbol: '👷', categoryId: 'help' },
            { id: 'money', label: 'More money for schools', symbol: '🏫', categoryId: 'help' },
            { id: 'noise', label: 'Noise for neighbours', symbol: '🔊', categoryId: 'hard' },
            { id: 'animals', label: 'Animals lose some land', symbol: '🦌', categoryId: 'hard' },
          ],
        },
        conceptIds: [c(4, 2), c(4, 3)], statementIds: [S(7)],
      },
      {
        id: s(4, 6), kind: 'practice', title: 'Speak up', text: 'Choose the best answer.',
        interaction: {
          type: 'choice', prompt: 'You do not agree with a decision. What can you do?',
          options: [
            { id: 'write', label: 'Write or talk to my MLA or MP', symbol: '✉️', correct: true },
            { id: 'secret', label: 'Keep it a secret', symbol: '🤐' },
            { id: 'break', label: 'Break the law', symbol: '🚫' },
          ],
          feedback: { correct: 'Yes! Citizens take part in democracy by sharing their views with their representatives.', incorrect: 'Try again. How can you tell the government what you think?' },
        },
        conceptIds: [c(4, 4)],
      },
      {
        id: s(4, 7), kind: 'apply', title: 'Find it in my community', text: 'Find one thing in our community that a government decided about: a school, a hospital, a road or an oil and gas site. Take a photo, draw it or tell your teacher.',
        interaction: { type: 'respond', prompt: 'What did a government decide in my community? Who does it help?' },
        conceptIds: [c(4, 1), c(4, 3)], statementIds: [S(1)],
      },
      {
        id: s(4, 8), kind: 'check', title: 'Show what you know', text: 'Tell or show one way a government decision changes our community.',
        interaction: { type: 'respond', prompt: 'One decision. Who does it help? Who does it make things harder for?' }, conceptIds: [c(4, 1), c(4, 2), c(4, 3), c(4, 4)],
      },
    ],
    demonstrationModes: ['photo', 'draw', 'speak', 'aac', 'sort', 'tap'],
    criteria: [
      { text: 'Identifies a place or service in their community that results from a government decision, and which government is responsible.', statementIds: [U(1), S(1)] },
      { text: 'Sorts effects of a natural-resource decision into “helps” and “makes it harder”, recognizing that people are affected differently.', statementIds: [K(15), K(16), S(7)] },
      { text: 'Identifies one way a citizen can take part in democracy.', statementIds: [K(23)] },
    ],
  }),

  lesson(5, {
    title: 'Apply your learning: Make a decision for your community',
    alignmentHint: 'formulate a judgement how fairly power is distributed governments citizens decision making provincial responsibilities natural resources',
    classExpectations: `${CLASS_OUTCOME} The class is forming judgements about how fairly power is distributed among governments and citizens.`,
    classConnection: 'Culminating task parallel to the class: the student makes, explains and judges the fairness of a real community decision.',
    essentialConcepts: [
      { id: c(5, 1), text: 'Governments cannot do everything at once, so they must choose between options.', plainText: 'The government can only pick one thing.', statementIds: [U(1), S(1)] },
      { id: c(5, 2), text: 'Alberta’s government makes decisions about education, healthcare, municipalities and natural resources, and resource revenues help pay for them.', plainText: 'Alberta decides about schools, health care, towns and nature.', statementIds: [K(13), K(15)] },
      { id: c(5, 3), text: 'Good decisions think about who is affected, give reasons and are fair.', plainText: 'Think about who it helps. Say why. Is it fair?', statementIds: [S(7), S(9)] },
      { id: c(5, 4), text: 'Citizens share power by voting and taking part in democracy.', plainText: 'Citizens get a say. We vote and share our ideas.', statementIds: [K(23), S(9)] },
    ],
    steps: [
      {
        id: s(5, 1), kind: 'connect', title: 'The problem',
        text: 'Alberta has money from oil and gas for ONE new project in our community. You will be the decision-maker. You will choose a project and explain why.',
        plainText: 'Alberta has money for ONE thing in our town. You choose!',
        keywords: [{ word: 'project', symbol: '🏗️', meaning: 'Something new the government builds or does' }, { word: 'choose', symbol: '👉', meaning: 'Pick one' }, { word: 'fair', symbol: '⚖️', meaning: 'Good for everyone, treating people equally' }],
        visual: { type: 'keyword-cards', alt: 'Cards: project, choose, fair' }, conceptIds: [c(5, 1)],
      },
      {
        id: s(5, 2), kind: 'teach', title: 'How to make a decision',
        text: 'Good decision-makers follow steps: 1. Who decides? 2. What are the choices? 3. Who is affected? 4. Choose. 5. Explain why – and check that it is fair.',
        plainText: '1 Who decides? 2 Choices. 3 Who does it help? 4 Choose. 5 Say why. Is it fair?',
        visual: { type: 'steps', alt: 'Five decision-making steps', items: [['🏛️', 'Who decides?'], ['📋', 'Choices'], ['👥', 'Who is affected?'], ['👉', 'Choose'], ['⚖️', 'Why? Is it fair?']] },
        conceptIds: [c(5, 3)],
      },
      {
        id: s(5, 3), kind: 'practice', title: 'Step 1: Who decides?', text: 'Remember which government does which job.',
        interaction: {
          type: 'choice', prompt: 'A new school or health clinic in Alberta. Which government decides?',
          options: [
            { id: 'p', label: 'Alberta’s government (provincial)', symbol: '🏔️', correct: true },
            { id: 'f', label: 'Canada’s government (federal)', symbol: '🍁' },
          ],
          feedback: { correct: 'Yes! Education and healthcare are provincial responsibilities.', incorrect: 'Think: schools 🏫 and health care 🏥 – which column were they in?' },
        },
        conceptIds: [c(5, 2)],
      },
      {
        id: s(5, 4), kind: 'teach', title: 'Steps 2 and 3: The choices and who they help',
        text: 'Choice A: a new school – helps children and families. Choice B: a health clinic – helps people who are sick and older people. Choice C: money for our town to build an arena – helps people who play sports and meet friends. Choice D: protect land and animals – helps nature and people who enjoy the outdoors.',
        plainText: 'A 🏫 helps kids. B 🏥 helps sick people. C 🏒 helps sports. D 🌲 helps nature.',
        visual: { type: 'options', alt: 'Four option cards: new school, health clinic, town arena, protect land and animals', items: [['🏫', 'New school', 'Children and families'], ['🏥', 'Health clinic', 'Sick and older people'], ['🏒', 'Town arena', 'Sports and friends'], ['🌲', 'Protect land and animals', 'Nature and the outdoors']] },
        conceptIds: [c(5, 1), c(5, 3)],
      },
      {
        id: s(5, 5), kind: 'apply', title: 'Steps 4 and 5: Choose and explain', text: 'Pick the project you think is best for our community. Then choose your reasons.',
        interaction: {
          type: 'decision', prompt: 'Which project should Alberta choose for our community?',
          options: [
            { id: 'school', label: 'New school', symbol: '🏫' },
            { id: 'clinic', label: 'Health clinic', symbol: '🏥' },
            { id: 'arena', label: 'Town arena', symbol: '🏒' },
            { id: 'land', label: 'Protect land and animals', symbol: '🌲' },
          ],
          reasonPrompt: 'Why is it the best choice?',
          reasons: [
            { id: 'many', label: 'It helps many people', symbol: '👥' },
            { id: 'need', label: 'It helps people who need it most', symbol: '🫶' },
            { id: 'fair', label: 'It is fair to everyone', symbol: '⚖️' },
            { id: 'earth', label: 'It is good for the environment', symbol: '🌎' },
            { id: 'together', label: 'It brings people together', symbol: '🎉' },
          ],
          minReasons: 1,
          discussion: 'Ask: Who might not like this choice? Is it fair to them? What would you tell them?',
        },
        conceptIds: [c(5, 1), c(5, 3)], statementIds: [S(9)],
      },
      {
        id: s(5, 6), kind: 'practice', title: 'Who should get a say?', text: 'Think about fairness.',
        interaction: {
          type: 'choice', prompt: 'Who should get a say in this decision?',
          options: [
            { id: 'both', label: 'Citizens and the government', symbol: '🧑‍🤝‍🧑', correct: true },
            { id: 'gov', label: 'Only the government', symbol: '🏛️' },
            { id: 'none', label: 'Nobody', symbol: '🚫' },
          ],
          feedback: { correct: 'Yes! Citizens share power by voting and sharing their ideas.', incorrect: 'Think: how do citizens take part in democracy?' },
        },
        conceptIds: [c(5, 4)],
      },
      {
        id: s(5, 7), kind: 'check', title: 'Share your decision', text: 'Tell your MLA about your decision. You can say it, make a poster, use your device or write it.',
        interaction: { type: 'respond', prompt: 'My choice is ___ because ___. It is fair because ___.' },
        conceptIds: [c(5, 3), c(5, 4)],
      },
    ],
    demonstrationModes: ['tap', 'speak', 'aac', 'draw', 'type', 'demonstrate', 'photo'],
    criteria: [
      { text: 'Identifies the provincial government as the decision-maker for schools, healthcare and natural resources.', statementIds: [K(13), S(1)] },
      { text: 'Makes a choice between options and identifies who the choice helps.', statementIds: [U(1), S(7)] },
      { text: 'Gives at least one reason, makes a simple judgement about fairness, and communicates the decision using a chosen method.', statementIds: [S(9), K(23)] },
    ],
  }),
];

export const DEMO_UNIT = {
  id: 'political-system',
  title: 'Canada’s Political System – demonstration unit',
  lessonIds: DEMO_LESSONS.map((l) => l.id),
};
