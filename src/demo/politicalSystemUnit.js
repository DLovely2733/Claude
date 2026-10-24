// Demonstration unit: Canada’s Political System (five sample lessons).
//
// These lessons ship WITHOUT curriculum links. The official Grade 9 outcome,
// knowledge, understanding and skills statements must come from the uploaded
// June 2026 draft; the teacher links them in the lesson editor (the app
// suggests likely matches using `alignmentHint`). Until then every lesson shows
// a "No verified curriculum connection" warning.
//
// The instructional content below is general Canadian civics, written for
// accessible delivery; it is not presented as curriculum wording.

const L = (n) => `demo-ps-${n}`;
const s = (n, k) => `${L(n)}-s${k}`;
const c = (n, k) => `${L(n)}-c${k}`;

function lesson(n, data) {
  return {
    id: L(n),
    unit: 'political-system',
    order: n,
    curriculumVersionId: null,
    curriculumVersionLabel: null,
    curriculumLinks: { outcomeIds: [], statementIds: [] },
    individualGoals: [],
    origin: 'demo',
    draft: false,
    createdAt: '2026-10-23T00:00:00.000Z',
    updatedAt: '2026-10-23T00:00:00.000Z',
    ...data,
    criteria: data.criteria.map((cr, i) => ({ id: `${L(n)}-cr${i + 1}`, statementIds: [], goalIds: [], kind: 'adapted-outcome', ...cr })),
  };
}

const LEVEL_CATEGORIES = [
  { id: 'federal', label: 'Federal – all of Canada', symbol: '🍁' },
  { id: 'provincial', label: 'Provincial – Alberta', symbol: '🏔️' },
  { id: 'municipal', label: 'Municipal – our town or city', symbol: '🏘️' },
];

export const DEMO_LESSONS = [
  lesson(1, {
    title: 'Who makes decisions in Canada?',
    alignmentHint: 'government organization representative democracy elected representatives levels of government federal provincial municipal decision making citizens vote',
    classExpectations: 'Classmates are studying how Canada’s political system is organized and who holds decision-making power. Teacher: paste or confirm the matching official outcome after linking.',
    classConnection: 'Same question as the class (“Who makes decisions in Canada?”), using concrete examples, pictures and voting.',
    essentialConcepts: [
      { id: c(1, 1), text: 'In Canada, citizens vote to choose representatives who make decisions for everyone.', plainText: 'People vote. The people who win make decisions for us.', statementIds: [] },
      { id: c(1, 2), text: 'Canada has more than one level of government: federal (all of Canada), provincial (Alberta) and municipal (our town or city). First Nations and Métis Settlements also have their own governments.', plainText: 'There are different governments. One for Canada. One for Alberta. One for our town.', statementIds: [] },
      { id: c(1, 3), text: 'Each level has a leader: the Prime Minister (federal), the Premier (provincial) and the Mayor or Reeve (municipal).', plainText: 'Canada has a Prime Minister. Alberta has a Premier. Our town has a Mayor.', statementIds: [] },
    ],
    steps: [
      {
        id: s(1, 1), kind: 'connect', title: 'What my class is learning',
        text: 'Our class is learning how Canada makes decisions. Today we will find out who makes the decisions.',
        plainText: 'Today: Who makes decisions in Canada?',
        keywords: [{ word: 'government', symbol: '🏛️', meaning: 'The group that makes decisions and rules for a place.' }, { word: 'vote', symbol: '🗳️', meaning: 'Choosing by marking your choice.' }, { word: 'decision', symbol: '🤔', meaning: 'A choice.' }],
        visual: { type: 'keyword-cards', alt: 'Cards: government, vote, decision' }, conceptIds: [c(1, 1)], statementIds: [],
      },
      {
        id: s(1, 2), kind: 'teach', title: 'Choosing someone to decide',
        text: 'A country has millions of people. Everyone cannot decide everything together, so citizens vote to choose representatives. The representatives make decisions for everyone. This is called a representative democracy.',
        plainText: 'Too many people to all decide. So we vote. We pick a person. That person decides for us.',
        chunks: ['People vote.', 'The person with the most votes wins.', 'That person makes decisions for us.'],
        visual: { type: 'vote', alt: 'People put ballots in a box, and one person is chosen to represent them' }, conceptIds: [c(1, 1)], statementIds: [],
      },
      {
        id: s(1, 3), kind: 'teach', title: 'Different governments',
        text: 'Canada has different levels of government. The federal government makes decisions for all of Canada. The provincial government makes decisions for Alberta. The municipal government makes decisions for our town or city. First Nations and Métis Settlements also have their own governments.',
        plainText: 'Canada 🍁. Alberta 🏔️. Our town 🏘️. Each one has a government.',
        visual: { type: 'levels', alt: 'Three stacked boxes: federal for Canada, provincial for Alberta, municipal for our town' }, conceptIds: [c(1, 2)], statementIds: [],
      },
      {
        id: s(1, 4), kind: 'teach', title: 'Who leads?',
        text: 'Each government has a leader. The Prime Minister leads the federal government. The Premier leads Alberta’s government. A Mayor (or Reeve) leads a town or city council.',
        plainText: 'Prime Minister → Canada. Premier → Alberta. Mayor → our town.',
        keywords: [{ word: 'Prime Minister', symbol: '🍁', meaning: 'Leader of Canada’s government' }, { word: 'Premier', symbol: '🏔️', meaning: 'Leader of Alberta’s government' }, { word: 'Mayor', symbol: '🏘️', meaning: 'Leader of our town or city council' }],
        visual: { type: 'keyword-cards', alt: 'Cards: Prime Minister, Premier, Mayor' }, conceptIds: [c(1, 3)], statementIds: [],
      },
      {
        id: s(1, 5), kind: 'practice', title: 'Match the leader', text: 'Put each leader with their government.', repeat: 2,
        interaction: {
          type: 'sort', prompt: 'Which government does each leader lead?', categories: LEVEL_CATEGORIES,
          items: [
            { id: 'pm', label: 'Prime Minister', symbol: '👤', categoryId: 'federal' },
            { id: 'premier', label: 'Premier', symbol: '👤', categoryId: 'provincial' },
            { id: 'mayor', label: 'Mayor', symbol: '👤', categoryId: 'municipal' },
          ],
        },
        conceptIds: [c(1, 3)], statementIds: [],
      },
      {
        id: s(1, 6), kind: 'practice', title: 'How do we choose?', text: 'Choose the best answer.', repeat: 1,
        interaction: {
          type: 'choice', prompt: 'How do people in Canada choose who makes decisions?',
          options: [
            { id: 'a', label: 'They vote', symbol: '🗳️', correct: true },
            { id: 'b', label: 'They pick a name from a hat', symbol: '🎩' },
            { id: 'c', label: 'They have a running race', symbol: '🏃' },
            { id: 'd', label: 'Nobody decides', symbol: '🚫' },
          ],
          feedback: { correct: 'Yes! People vote to choose who makes decisions.', incorrect: 'Try again. Look at the ballot box picture.' },
        },
        conceptIds: [c(1, 1)], statementIds: [],
      },
      {
        id: s(1, 7), kind: 'apply', title: 'Your turn to decide', text: 'Our class needs to choose a game for Friday. How should we decide?',
        interaction: {
          type: 'decision', prompt: 'How should our class decide?',
          options: [
            { id: 'vote', label: 'Everyone votes', symbol: '🗳️', detail: 'Every person gets one vote.' },
            { id: 'one', label: 'One student picks', symbol: '☝️', detail: 'One person decides for everyone.' },
            { id: 'teacher', label: 'The teacher picks', symbol: '🧑‍🏫', detail: 'The adult decides.' },
          ],
          reasonPrompt: 'Why is that a good way?',
          reasons: [
            { id: 'fair', label: 'It is fair', symbol: '⚖️' },
            { id: 'everyone', label: 'Everyone has a say', symbol: '🧑‍🤝‍🧑' },
            { id: 'fast', label: 'It is fast', symbol: '⏱️' },
          ],
          discussion: 'Talk about it: Canada uses voting so everyone has a say.',
        },
        conceptIds: [c(1, 1)], statementIds: [],
      },
      {
        id: s(1, 8), kind: 'check', title: 'Show what you know', text: 'Show who makes decisions for Canada, for Alberta and for our town.',
        interaction: { type: 'respond', prompt: 'Who makes decisions? Show me.' }, conceptIds: [c(1, 1), c(1, 2), c(1, 3)], statementIds: [],
      },
    ],
    demonstrationModes: ['tap', 'sort', 'speak', 'aac', 'draw', 'yesno'],
    criteria: [
      { text: 'Identifies that citizens vote to choose the people who make decisions.' },
      { text: 'Names or selects the three levels of government (federal, provincial, municipal) with the support level recorded.' },
      { text: 'Matches each leader (Prime Minister, Premier, Mayor) to their level of government.' },
    ],
  }),

  lesson(2, {
    title: 'What do federal and provincial governments do?',
    alignmentHint: 'federal provincial powers jurisdiction division of powers responsibilities constitution government organization',
    classExpectations: 'Classmates are studying how powers are divided between the federal and provincial governments. Teacher: confirm the matching official outcome after linking.',
    classConnection: 'Same concept as the class (division of powers), shown with real services the student uses every day.',
    essentialConcepts: [
      { id: c(2, 1), text: 'Canada’s Constitution divides responsibilities between the federal and provincial governments.', plainText: 'Each government has its own jobs.', statementIds: [] },
      { id: c(2, 2), text: 'The federal government is responsible for things that affect the whole country, such as national defence, money, mail, passports and criminal law.', plainText: 'Canada’s government: army, money, mail, passports.', statementIds: [] },
      { id: c(2, 3), text: 'Provincial governments are responsible for things such as schools, hospitals and health care, and provincial highways. Municipalities (created by the province) look after local roads, parks, water and garbage.', plainText: 'Alberta’s government: schools and hospitals. Our town: parks, garbage and local roads.', statementIds: [] },
    ],
    steps: [
      {
        id: s(2, 1), kind: 'connect', title: 'What my class is learning',
        text: 'Our class is learning that each government has different jobs.', plainText: 'Today: Which government does which job?',
        keywords: [{ word: 'federal', symbol: '🍁', meaning: 'For all of Canada' }, { word: 'provincial', symbol: '🏔️', meaning: 'For Alberta' }, { word: 'responsibility', symbol: '🧰', meaning: 'A job you must do' }],
        visual: { type: 'keyword-cards', alt: 'Cards: federal, provincial, responsibility' }, conceptIds: [c(2, 1)], statementIds: [],
      },
      {
        id: s(2, 2), kind: 'teach', title: 'Different jobs',
        text: 'Think of a school. The principal, the teacher and the custodian all have different jobs. Governments are like that too. Canada’s Constitution says which government does which job.',
        plainText: 'At school, people have different jobs. Governments have different jobs too.',
        chunks: ['The principal has a job.', 'The teacher has a job.', 'Each government has a job too.'],
        visual: { type: 'keyword-cards', alt: 'School jobs compared to government jobs' },
        keywords: [{ word: 'principal', symbol: '🧑‍💼', meaning: 'Runs the school' }, { word: 'teacher', symbol: '🧑‍🏫', meaning: 'Teaches the class' }, { word: 'custodian', symbol: '🧹', meaning: 'Takes care of the building' }],
        conceptIds: [c(2, 1)], statementIds: [],
      },
      {
        id: s(2, 3), kind: 'teach', title: 'Who does what?',
        text: 'Federal: national defence (the Canadian Armed Forces), money, mail (Canada Post), passports and citizenship, criminal law. Provincial: schools, hospitals and health care, provincial highways, driver’s licences. Municipal: local roads, parks, water, garbage and recycling.',
        plainText: 'Canada 🍁: army, money, mail. Alberta 🏔️: schools, hospitals. Our town 🏘️: parks, garbage.',
        visual: {
          type: 'jurisdiction', alt: 'Three columns showing federal, provincial and municipal responsibilities with pictures',
          columns: [
            { level: 'federal', items: [['🪖', 'Army'], ['💵', 'Money'], ['✉️', 'Mail'], ['🛂', 'Passports']] },
            { level: 'provincial', items: [['🏫', 'Schools'], ['🏥', 'Hospitals'], ['🛣️', 'Highways'], ['🪪', 'Driver’s licences']] },
            { level: 'municipal', items: [['🌳', 'Parks'], ['🗑️', 'Garbage'], ['🚰', 'Water'], ['🚧', 'Local roads']] },
          ],
        },
        conceptIds: [c(2, 2), c(2, 3)], statementIds: [],
      },
      {
        id: s(2, 4), kind: 'practice', title: 'Sort the jobs', text: 'Put each job with the government that does it.', repeat: 2,
        interaction: {
          type: 'sort', prompt: 'Which government does this job?', categories: LEVEL_CATEGORIES,
          items: [
            { id: 'money', label: 'Money', symbol: '💵', categoryId: 'federal' },
            { id: 'mail', label: 'Mail', symbol: '✉️', categoryId: 'federal' },
            { id: 'schools', label: 'Schools', symbol: '🏫', categoryId: 'provincial' },
            { id: 'hospitals', label: 'Hospitals', symbol: '🏥', categoryId: 'provincial' },
            { id: 'parks', label: 'Parks', symbol: '🌳', categoryId: 'municipal' },
            { id: 'garbage', label: 'Garbage pickup', symbol: '🗑️', categoryId: 'municipal' },
          ],
        },
        conceptIds: [c(2, 2), c(2, 3)], statementIds: [],
      },
      {
        id: s(2, 5), kind: 'practice', title: 'Quick check', text: 'Choose the best answer.',
        interaction: {
          type: 'choice', prompt: 'Which government is responsible for schools in Alberta?',
          options: [
            { id: 'p', label: 'Provincial (Alberta)', symbol: '🏔️', correct: true },
            { id: 'f', label: 'Federal (Canada)', symbol: '🍁' },
            { id: 'm', label: 'Municipal (our town)', symbol: '🏘️' },
          ],
          feedback: { correct: 'Yes! Alberta’s government is responsible for schools.', incorrect: 'Look at the chart again. Find the school 🏫.' },
        },
        conceptIds: [c(2, 3)], statementIds: [],
      },
      {
        id: s(2, 6), kind: 'apply', title: 'Who should I ask?', text: 'There is a big pothole on your street. Who should you tell?',
        interaction: {
          type: 'choice', prompt: 'A pothole on my street. Who fixes it?',
          options: [
            { id: 'm', label: 'Our town or city', symbol: '🏘️', correct: true },
            { id: 'f', label: 'The Prime Minister', symbol: '🍁' },
            { id: 'p', label: 'The hospital', symbol: '🏥' },
          ],
          feedback: { correct: 'Yes! Local roads are a job for our town or city.', incorrect: 'Local roads 🚧 are in the “our town” column.' },
        },
        conceptIds: [c(2, 3)], statementIds: [],
      },
      {
        id: s(2, 7), kind: 'check', title: 'Show what you know', text: 'Show one job for Canada’s government and one job for Alberta’s government.',
        interaction: { type: 'respond', prompt: 'One job for Canada 🍁. One job for Alberta 🏔️.' }, conceptIds: [c(2, 2), c(2, 3)], statementIds: [],
      },
    ],
    demonstrationModes: ['sort', 'tap', 'speak', 'aac', 'draw', 'photo'],
    criteria: [
      { text: 'Sorts familiar services by the level of government responsible, with the support level recorded.' },
      { text: 'Identifies at least one federal and one provincial responsibility.' },
      { text: 'Chooses the right government to contact about a local problem.' },
    ],
  }),

  lesson(3, {
    title: 'How does an idea become a law?',
    alignmentHint: 'process of creating legislation bill law parliament legislature readings debate vote senate royal assent legislative process',
    classExpectations: 'Classmates are studying the legislative process. Teacher: confirm the matching official outcome after linking.',
    classConnection: 'Same process as the class (how a bill becomes law), taught as a short picture sequence and acted out as a class vote.',
    essentialConcepts: [
      { id: c(3, 1), text: 'A law is a rule that everyone in a place must follow. A proposed law is called a bill.', plainText: 'A law is a rule for everyone. A bill is an idea for a new law.', statementIds: [] },
      { id: c(3, 2), text: 'Elected members debate and vote on a bill several times (readings), and a committee studies it closely. At the federal level the Senate must also pass it.', plainText: 'People talk about the bill. Then they vote.', statementIds: [] },
      { id: c(3, 3), text: 'A bill becomes law after it receives Royal Assent (from the Governor General federally, or the Lieutenant Governor in Alberta).', plainText: 'The last step is signing. Then it is a law.', statementIds: [] },
    ],
    steps: [
      {
        id: s(3, 1), kind: 'connect', title: 'What my class is learning',
        text: 'Our class is learning how new laws are made.', plainText: 'Today: How is a law made?',
        keywords: [{ word: 'law', symbol: '📜', meaning: 'A rule everyone must follow' }, { word: 'bill', symbol: '📝', meaning: 'An idea for a new law' }, { word: 'vote', symbol: '🗳️', meaning: 'Choosing yes or no' }],
        visual: { type: 'keyword-cards', alt: 'Cards: law, bill, vote' }, conceptIds: [c(3, 1)], statementIds: [],
      },
      {
        id: s(3, 2), kind: 'teach', title: 'What is a law?',
        text: 'Schools have rules, like “walk in the hallway.” A country and a province have rules too. These rules are called laws. Everyone must follow laws. For example, drivers must stop at a red light.',
        plainText: 'School has rules. Canada has rules too. They are called laws.',
        chunks: ['A rule tells us what to do.', 'A law is a rule for everyone.', 'Example: stop at a red light 🚦.'],
        visual: { type: 'keyword-cards', alt: 'A school rule card next to a law card' },
        keywords: [{ word: 'school rule', symbol: '🏫', meaning: 'Walk in the hallway' }, { word: 'law', symbol: '🚦', meaning: 'Stop at a red light' }],
        conceptIds: [c(3, 1)], statementIds: [],
      },
      {
        id: s(3, 3), kind: 'teach', title: 'The steps',
        text: 'Step 1: Someone has an idea. Step 2: The idea is written as a bill. Step 3: Elected members talk about it and vote. Step 4: A committee looks at it closely. Step 5: For federal laws, the Senate votes too. Step 6: Royal Assent – it is signed. Step 7: It is a law!',
        plainText: 'Idea 💡 → Bill 📝 → Vote 🗳️ → Sign ✍️ → Law 📜',
        visual: {
          type: 'steps', alt: 'Arrow sequence from idea to bill to debate and vote to committee to Senate to Royal Assent to law',
          items: [['💡', 'Idea'], ['📝', 'Bill'], ['🗳️', 'Debate & vote'], ['🔍', 'Committee'], ['🏛️', 'Senate (federal)'], ['✍️', 'Royal Assent'], ['📜', 'Law']],
          simpleItems: [['💡', 'Idea'], ['📝', 'Bill'], ['🗳️', 'Vote'], ['✍️', 'Sign'], ['📜', 'Law']],
        },
        conceptIds: [c(3, 2), c(3, 3)], statementIds: [],
      },
      {
        id: s(3, 4), kind: 'practice', title: 'Put the steps in order', text: 'Tap the steps in the right order.', repeat: 2,
        interaction: {
          type: 'sequence', prompt: 'What comes first? Then what?',
          items: [{ id: 'idea', label: 'Idea', symbol: '💡' }, { id: 'bill', label: 'Bill', symbol: '📝' }, { id: 'vote', label: 'Vote', symbol: '🗳️' }, { id: 'sign', label: 'Royal Assent (sign)', symbol: '✍️' }, { id: 'law', label: 'Law', symbol: '📜' }],
        },
        conceptIds: [c(3, 2), c(3, 3)], statementIds: [],
      },
      {
        id: s(3, 5), kind: 'practice', title: 'Yes or no?', text: 'Think about the steps.',
        interaction: { type: 'yesno', prompt: 'Can a bill become a law without a vote?', answer: false, feedback: { correct: 'Right! Elected members must vote on a bill.', incorrect: 'Look at the steps. Voting 🗳️ is one of the steps.' } },
        conceptIds: [c(3, 2)], statementIds: [],
      },
      {
        id: s(3, 6), kind: 'apply', title: 'Make a bill for our school', text: 'Choose an idea for a new school rule. Then the class will vote on it, like elected members do.',
        interaction: {
          type: 'decision', prompt: 'Which idea should become our “bill”?',
          options: [
            { id: 'recycle', label: 'Recycling bins in every classroom', symbol: '♻️' },
            { id: 'quiet', label: 'A quiet room at lunch', symbol: '🤫' },
            { id: 'music', label: 'Music in the hallway in the morning', symbol: '🎵' },
          ],
          reasonPrompt: 'Why is it a good idea?',
          reasons: [{ id: 'help', label: 'It helps people', symbol: '🤝' }, { id: 'safe', label: 'It keeps us safe', symbol: '🦺' }, { id: 'earth', label: 'It helps the Earth', symbol: '🌎' }, { id: 'happy', label: 'It makes people happy', symbol: '😊' }],
          discussion: 'Class vote: hold a yes/no vote on the student’s bill. Then the teacher “signs” it (Royal Assent).',
        },
        conceptIds: [c(3, 2), c(3, 3)], statementIds: [],
      },
      {
        id: s(3, 7), kind: 'check', title: 'Show what you know', text: 'Show the steps from an idea to a law.',
        interaction: { type: 'respond', prompt: 'Show how an idea becomes a law.' }, conceptIds: [c(3, 1), c(3, 2), c(3, 3)], statementIds: [],
      },
    ],
    demonstrationModes: ['sort', 'tap', 'demonstrate', 'speak', 'aac', 'draw', 'yesno'],
    criteria: [
      { text: 'Explains or shows that a law is a rule everyone must follow.' },
      { text: 'Sequences the main steps from idea to law (idea, bill, vote, Royal Assent, law), with the support level recorded.' },
      { text: 'Takes part in a simulated vote on a proposed rule and gives a reason.' },
    ],
  }),

  lesson(4, {
    title: 'How do government decisions affect our communities?',
    alignmentHint: 'government decisions impact communities citizens participation perspectives affected consequences municipal council accountability needs of citizens',
    classExpectations: 'Classmates are examining how government decisions affect people and communities, and how citizens respond. Teacher: confirm the matching official outcome after linking.',
    classConnection: 'Same inquiry as the class, grounded in real places in the student’s own community.',
    essentialConcepts: [
      { id: c(4, 1), text: 'Government decisions change things in our community, such as roads, schools, parks, buses and hospitals.', plainText: 'Government decisions change our town.', statementIds: [] },
      { id: c(4, 2), text: 'A decision can help some people and make things harder for others.', plainText: 'A decision can help some people. It can be hard for others.', statementIds: [] },
      { id: c(4, 3), text: 'Citizens can share their views with government: by voting, contacting their representative, signing a petition, or speaking at a council meeting.', plainText: 'I can tell the government what I think.', statementIds: [] },
    ],
    steps: [
      {
        id: s(4, 1), kind: 'connect', title: 'What my class is learning',
        text: 'Our class is learning how government decisions change our community.', plainText: 'Today: How do decisions change our town?',
        keywords: [{ word: 'community', symbol: '🏘️', meaning: 'The place where we live and the people in it' }, { word: 'decision', symbol: '🤔', meaning: 'A choice' }, { word: 'affect', symbol: '↔️', meaning: 'To change something' }],
        visual: { type: 'keyword-cards', alt: 'Cards: community, decision, affect' }, conceptIds: [c(4, 1)], statementIds: [],
      },
      {
        id: s(4, 2), kind: 'teach', title: 'Decisions all around us',
        text: 'Look around our community. A government decided to build the school, the park, the road and the bus route. When a government makes a decision, our community changes.',
        plainText: 'The school 🏫, the park 🌳, the bus 🚌. A government decided to make them.',
        visual: {
          type: 'community', alt: 'A simple community picture with a school, park, road, bus stop and hospital, each labelled with the government that decides',
          items: [['🏫', 'School', 'provincial'], ['🌳', 'Park', 'municipal'], ['🚌', 'Bus stop', 'municipal'], ['🏥', 'Hospital', 'provincial'], ['✉️', 'Post office', 'federal']],
        },
        conceptIds: [c(4, 1)], statementIds: [],
      },
      {
        id: s(4, 3), kind: 'teach', title: 'Good for some, hard for others',
        text: 'The town decides to close a road to build a new park. Children get a place to play. But drivers must take a longer way. One decision can help some people and make things harder for others.',
        plainText: 'New park 🌳: kids are happy 😊. Drivers go a long way 🚗😟.',
        chunks: ['The town makes a new park.', 'Kids can play. 😊', 'Cars must go another way. 😟'],
        visual: { type: 'two-sides', alt: 'Left: happy children in a park. Right: a driver on a detour.', left: ['😊', 'Helps: kids can play'], right: ['😟', 'Harder: drivers go a longer way'] },
        conceptIds: [c(4, 2)], statementIds: [],
      },
      {
        id: s(4, 4), kind: 'practice', title: 'Helps or harder?', text: 'The town closes a road to build a park. Sort each card.', repeat: 2,
        interaction: {
          type: 'sort', prompt: 'Does this help, or make it harder?',
          categories: [{ id: 'help', label: 'Helps', symbol: '😊' }, { id: 'hard', label: 'Makes it harder', symbol: '😟' }],
          items: [
            { id: 'play', label: 'Kids get a place to play', symbol: '🛝', categoryId: 'help' },
            { id: 'detour', label: 'Drivers take a longer way', symbol: '🚗', categoryId: 'hard' },
            { id: 'picnic', label: 'Families have picnics', symbol: '🧺', categoryId: 'help' },
            { id: 'noise', label: 'Building noise for neighbours', symbol: '🔊', categoryId: 'hard' },
          ],
        },
        conceptIds: [c(4, 2)], statementIds: [],
      },
      {
        id: s(4, 5), kind: 'practice', title: 'Speak up', text: 'Choose the best answer.',
        interaction: {
          type: 'choice', prompt: 'You do not like a decision. What can you do?',
          options: [
            { id: 'write', label: 'Write or talk to my councillor', symbol: '✉️', correct: true },
            { id: 'secret', label: 'Keep it a secret', symbol: '🤐' },
            { id: 'break', label: 'Break the rule', symbol: '🚫' },
          ],
          feedback: { correct: 'Yes! Citizens can tell their representatives what they think.', incorrect: 'Try again. How can you tell the government what you think?' },
        },
        conceptIds: [c(4, 3)], statementIds: [],
      },
      {
        id: s(4, 6), kind: 'apply', title: 'Find it in my community', text: 'Find one place in our community that a government decided to build or change. Take a photo, draw it or tell your teacher.',
        interaction: { type: 'respond', prompt: 'What did a government decide in my community? Who does it help?' },
        conceptIds: [c(4, 1), c(4, 2)], statementIds: [],
      },
      {
        id: s(4, 7), kind: 'check', title: 'Show what you know', text: 'Tell or show one way a government decision changes our community.',
        interaction: { type: 'respond', prompt: 'One decision. Who does it help? Who does it make things harder for?' }, conceptIds: [c(4, 1), c(4, 2), c(4, 3)], statementIds: [],
      },
    ],
    demonstrationModes: ['photo', 'draw', 'speak', 'aac', 'sort', 'tap'],
    criteria: [
      { text: 'Identifies a place or service in their community that results from a government decision.' },
      { text: 'Sorts effects of a decision into “helps” and “makes it harder”, recognizing different people are affected differently.' },
      { text: 'Identifies one way a citizen can share their view with government.' },
    ],
  }),

  lesson(5, {
    title: 'Apply your learning: Make a decision for your community',
    alignmentHint: 'decision making apply evaluate options citizens needs government decisions community perspectives communicate decision civic participation',
    classExpectations: 'Classmates are applying their learning about Canada’s political system to a decision. Teacher: confirm the matching official outcome(s) after linking.',
    classConnection: 'Culminating task parallel to the class: the student makes, justifies and presents a real community decision.',
    essentialConcepts: [
      { id: c(5, 1), text: 'Governments must choose between options because they cannot do everything at once.', plainText: 'The town can only pick one thing.', statementIds: [] },
      { id: c(5, 2), text: 'Good decisions consider who is affected and give reasons.', plainText: 'Think about who it helps. Say why.', statementIds: [] },
      { id: c(5, 3), text: 'Decisions about local projects are made by the municipal government, and citizens can share their decision with council.', plainText: 'Our town council decides. I can tell them my idea.', statementIds: [] },
    ],
    steps: [
      {
        id: s(5, 1), kind: 'connect', title: 'The problem',
        text: 'Our community has money for ONE new project. You will be the decision-maker. You will choose a project and explain why.',
        plainText: 'The town has money for ONE thing. You choose!',
        keywords: [{ word: 'project', symbol: '🏗️', meaning: 'Something new the town builds or does' }, { word: 'choose', symbol: '👉', meaning: 'Pick one' }, { word: 'reason', symbol: '💬', meaning: 'Why you chose it' }],
        visual: { type: 'keyword-cards', alt: 'Cards: project, choose, reason' }, conceptIds: [c(5, 1)], statementIds: [],
      },
      {
        id: s(5, 2), kind: 'teach', title: 'How to make a decision',
        text: 'Good decision-makers follow steps: 1. Who decides? 2. What are the choices? 3. Who is affected? 4. Choose. 5. Explain why.',
        plainText: '1 Who decides? 2 Choices. 3 Who does it help? 4 Choose. 5 Say why.',
        visual: { type: 'steps', alt: 'Five decision-making steps', items: [['🏛️', 'Who decides?'], ['📋', 'Choices'], ['👥', 'Who is affected?'], ['👉', 'Choose'], ['💬', 'Why?']] },
        conceptIds: [c(5, 2)], statementIds: [],
      },
      {
        id: s(5, 3), kind: 'practice', title: 'Step 1: Who decides?', text: 'Remember the levels of government.',
        interaction: {
          type: 'choice', prompt: 'Who decides about a new park or bus route in our town?',
          options: [
            { id: 'm', label: 'Our town council (municipal)', symbol: '🏘️', correct: true },
            { id: 'f', label: 'Canada’s government (federal)', symbol: '🍁' },
            { id: 'p', label: 'Alberta’s government (provincial)', symbol: '🏔️' },
          ],
          feedback: { correct: 'Yes! Local projects are decided by the town council.', incorrect: 'Think: parks 🌳 and buses 🚌 in our town.' },
        },
        conceptIds: [c(5, 3)], statementIds: [],
      },
      {
        id: s(5, 4), kind: 'teach', title: 'Step 2 and 3: The choices and who they help',
        text: 'Choice A: a new playground or skatepark – helps children and teens. Choice B: fix the roads – helps drivers, buses and cyclists. Choice C: more buses – helps people without cars. Choice D: a new library program – helps people who want to learn and meet others.',
        plainText: 'A 🛹 helps kids. B 🚧 helps drivers. C 🚌 helps people with no car. D 📚 helps readers.',
        visual: { type: 'options', alt: 'Four option cards: playground, fix roads, more buses, library program', items: [['🛹', 'Playground or skatepark', 'Kids and teens'], ['🚧', 'Fix the roads', 'Drivers, buses, bikes'], ['🚌', 'More buses', 'People without cars'], ['📚', 'Library program', 'Readers and learners']] },
        conceptIds: [c(5, 1), c(5, 2)], statementIds: [],
      },
      {
        id: s(5, 5), kind: 'apply', title: 'Step 4 and 5: Choose and explain', text: 'Pick the project you think is best for our community. Then choose your reasons.',
        interaction: {
          type: 'decision', prompt: 'Which project should our community choose?',
          options: [
            { id: 'park', label: 'Playground or skatepark', symbol: '🛹' },
            { id: 'roads', label: 'Fix the roads', symbol: '🚧' },
            { id: 'bus', label: 'More buses', symbol: '🚌' },
            { id: 'library', label: 'Library program', symbol: '📚' },
          ],
          reasonPrompt: 'Why is it the best choice?',
          reasons: [
            { id: 'many', label: 'It helps many people', symbol: '👥' },
            { id: 'need', label: 'It helps people who need it most', symbol: '🫶' },
            { id: 'safe', label: 'It makes things safer', symbol: '🦺' },
            { id: 'earth', label: 'It is good for the environment', symbol: '🌎' },
            { id: 'fun', label: 'It brings people together', symbol: '🎉' },
          ],
          minReasons: 1,
          discussion: 'Ask: Who might not like this choice? What would you tell them?',
        },
        conceptIds: [c(5, 1), c(5, 2)], statementIds: [],
      },
      {
        id: s(5, 6), kind: 'check', title: 'Share your decision', text: 'Tell the town council about your decision. You can say it, make a poster, use your device or write it.',
        interaction: { type: 'respond', prompt: 'My choice is ___ because ___. Tell the council!' },
        conceptIds: [c(5, 2), c(5, 3)], statementIds: [],
      },
    ],
    demonstrationModes: ['tap', 'speak', 'aac', 'draw', 'type', 'demonstrate', 'photo'],
    criteria: [
      { text: 'Identifies the municipal government as the decision-maker for a local project.' },
      { text: 'Makes a choice between options and identifies who the choice helps.' },
      { text: 'Gives at least one reason for the decision and communicates it using a chosen method.' },
    ],
  }),
];

export const DEMO_UNIT = {
  id: 'political-system',
  title: 'Canada’s Political System – demonstration unit',
  lessonIds: DEMO_LESSONS.map((l) => l.id),
};
