// Missions for World 4: Inside Canadian Government (G9-LO6).
//
// Missions are data. Each has six phases (Discover, Learn, Try, Decide, Show
// What You Know, Reflect) made of beats:
//   goto      – move the camera to a location; the guide explains
//   explore   – tap objects (in 3D or in the list) to open narrated exhibits
//   select    – choose the right object in the scene
//   map       – choose a province or territory on the 3D map
//   sort3d    – decide federal or provincial; the building raises a flag
//   sequence3d – light the law-path stations in the right order
//   step      – play a step from the linked lesson (teacher edits apply)
//   reflect   – review the essential concepts and self-assess
// Every scored beat cites the G9-LO6 statements it addresses.

import { SERVICES, LAW_STATIONS } from '../scenes/government.js';

const K = (n) => `G9-LO6-K${n}`;
const U = (n) => `G9-LO6-U${n}`;
const S = (n) => `G9-LO6-S${n}`;
const step = (lesson, n, extra = {}) => ({ type: 'step', lessonId: `demo-ps-${lesson}`, stepId: `demo-ps-${lesson}-s${n}`, ...extra });

/** Narrated exhibit text for every interactive object in the government world. */
export const EXHIBITS = {
  parliament: { title: 'Parliament’s Centre Block', symbol: '🏛️', t: 'Canada’s Parliament meets in Ottawa. Parliament has three parts: the Crown, the Senate and the House of Commons. All three must approve laws.', p: 'Parliament is in Ottawa. It has 3 parts. All 3 must say yes to a law.', statementIds: [K(3)] },
  'riding-office': { title: 'A riding office', symbol: '🗺️', t: 'Canada is divided into ridings. A riding is a geographic area that elects one Member of Parliament (MP) to represent it in the House of Commons.', p: 'We live in a riding. Our riding elects one MP.', statementIds: [K(6)] },
  'ballot-box': { title: 'Ballot box', symbol: '🗳️', t: 'In an election, people in the riding vote. The person with the most votes becomes the riding’s MP and speaks for everyone who lives there.', p: 'People vote. The winner is our MP.', statementIds: [K(5), S(3)] },
  commons: { title: 'House of Commons', symbol: '🟩', t: 'The House of Commons is made up of elected Members of Parliament. MPs make new laws by debating and voting. The government must keep the support of the House of Commons, or it must resign or call an election.', p: 'MPs sit here. We elect them. They talk and vote to make laws.', statementIds: [K(5), K(1), K(3)] },
  senate: { title: 'Senate', symbol: '🟥', t: 'The Senate is made up of appointed members, called senators. They are not elected. The Senate reviews laws passed by the House of Commons.', p: 'Senators are chosen, not elected. They check laws.', statementIds: [K(7)] },
  throne: { title: 'The Crown', symbol: '👑', t: 'The Crown is represented by the Governor General, who represents the Monarch and gives Royal Assent to laws. Royal Assent is the final step before a bill becomes law.', p: 'The Governor General gives Royal Assent. That is the last “yes” for a law.', statementIds: [K(4)] },
  'town-hall': { title: 'Town hall', symbol: '🏘️', t: 'Towns and cities are municipalities. In Canada, municipalities are a provincial responsibility, so Alberta’s government creates the rules that towns follow.', p: 'Our town follows rules from Alberta’s government.', statementIds: [K(13)] },
  'notice-board': { title: 'Notice board', symbol: '📌', t: 'A notice says: “Alberta has approved a new oil and gas project near our town.” Alberta has authority over its natural resources. Some people are happy about the jobs; others are worried about the land and animals.', p: 'Alberta said yes to a new oil project. Some people are happy. Some are worried.', statementIds: [K(14), K(15)] },
  'project-board': { title: 'Community projects', symbol: '🏗️', t: 'Alberta has money from oil and gas royalties for one new project in this community: a school, a health clinic, an arena, or protecting land and animals. Someone has to decide.', p: 'There is money for ONE project. Someone must choose.', statementIds: [K(15)] },
  'court-supreme': { title: 'Supreme Court of Canada', symbol: '⚖️', t: 'The Supreme Court of Canada is the highest and final court in the country. It makes sure laws are interpreted the same way across Canada and that they follow the Constitution.', p: 'The Supreme Court is the top court. It has the final say.', statementIds: [K(20), K(17)] },
  'court-lower': { title: 'Lower court', symbol: '1️⃣', t: 'Lower courts establish the facts of a case and make the first decision.', p: 'A lower court hears the case first and decides.', statementIds: [K(18)] },
  'court-appeal': { title: 'Appeal court', symbol: '2️⃣', t: 'Appeal courts make sure laws are applied correctly and consistently. A case can go from a lower court to an appeal court.', p: 'An appeal court checks that the law was used the right way.', statementIds: [K(19)] },
  charter: { title: 'Charter of Rights and Freedoms', symbol: '📜', t: 'The Canadian Charter of Rights and Freedoms (1982) protects fundamental rights such as freedom of expression, equality and legal protections. Courts use it to check whether laws and government actions respect people’s rights.', p: 'The Charter protects our rights, like free speech and equality.', statementIds: [K(22), S(6)] },
  'citizenship-act': { title: 'Canadian Citizenship Act (1947)', symbol: '🛂', t: 'The Canadian Citizenship Act (1947) formally established Canadian citizenship and defined membership in the nation.', p: 'In 1947, this law made Canadian citizenship official.', statementIds: [K(21)] },
  cabinet: { title: 'Cabinet office', symbol: '🗂️', t: 'Governments do not only make decisions through new laws. They also use Orders in Council, regulations and directives, and ministerial orders or decisions.', p: 'Governments can also decide things with orders and rules, not only laws.', statementIds: [K(10), S(4)] },
  guide: { title: 'Your guide', symbol: '🧭', t: 'Hi, I’m Jordan. Tap the glowing places to explore. You can always use the buttons in the panel instead.', p: 'Tap glowing places. Or use the buttons.', statementIds: [] },
  ...Object.fromEntries(SERVICES.map((sv) => [`svc:${sv.id}`, { title: sv.name, symbol: sv.symbol, t: `${sv.name}: this is about ${sv.responsibility.toLowerCase()}.`, p: `${sv.name}. ${sv.responsibility}.`, statementIds: [sv.level === 'federal' ? K(12) : K(13)] }])),
  ...Object.fromEntries(LAW_STATIONS.map((st, i) => [st.id, { title: `${i + 1}. ${st.name}`, symbol: st.symbol, t: `${st.text} (${st.place})`, p: st.text, statementIds: [K(8)] }])),
};

export const LOCATION_INFO = {
  overview: 'An overview of the government campus.',
  'parliament-front': 'Parliament’s Centre Block, with the Peace Tower.',
  chambers: 'The House of Commons on the left, the Senate on the right, and the Crown’s throne.',
  commons: 'The House of Commons, where elected MPs sit.',
  senate: 'The Senate, where appointed senators sit.',
  lawpath: 'The law path: seven steps from a bill to a law.',
  map: 'A map of Canada’s provinces and territories. It is a simplified map, not to scale.',
  services: 'A street of government services.',
  riding: 'A riding office, where an MP meets the people they represent.',
  community: 'The community square, with the town hall.',
  justice: 'The justice quarter: the courts, the Charter and the Citizenship Act.',
  cabinet: 'The Cabinet office.',
};

const g = (t, p) => ({ t, p: p || t });

export const GOVERNMENT_MISSIONS = [
  {
    id: 'gov-decisions',
    worldId: 'government',
    lessonId: 'demo-ps-1',
    title: 'Who makes decisions in Canada?',
    icon: '🗳️',
    goal: g('Find out who makes decisions in Canada: elected MPs, appointed senators and the Crown.', 'Who makes decisions in Canada?'),
    phases: {
      discover: [
        { type: 'goto', location: 'riding', guide: g('Welcome! Every place in Canada is part of a riding. Let’s start at a riding office.', 'We start at a riding office.') },
        { type: 'explore', location: 'riding', ids: ['riding-office', 'ballot-box'], min: 2, guide: g('Tap the riding office and the ballot box to find out how people choose who represents them.', 'Tap the office and the ballot box.') },
      ],
      learn: [
        { type: 'explore', location: 'chambers', ids: ['commons', 'senate', 'throne'], min: 3, guide: g('Parliament has three parts. Tap each one to learn what it does.', 'Parliament has 3 parts. Tap each one.') },
      ],
      try: [
        { type: 'select', location: 'chambers', targets: ['commons', 'senate', 'throne'], correct: 'commons', prompt: g('Tap the place where elected MPs debate and vote on laws.', 'Where do MPs make laws?'), feedback: g('Yes! The House of Commons. We elect the MPs who sit here.'), statementIds: [K(5)] },
        { type: 'select', location: 'chambers', targets: ['commons', 'senate', 'throne'], correct: 'senate', prompt: g('Tap the place where appointed members review laws.', 'Where do senators check laws?'), feedback: g('Yes! The Senate. Senators are appointed, not elected.'), statementIds: [K(7)] },
        { type: 'select', location: 'chambers', targets: ['commons', 'senate', 'throne'], correct: 'throne', prompt: g('Tap the part of Parliament that gives Royal Assent to laws.', 'Who gives Royal Assent?'), feedback: g('Yes! The Crown, represented by the Governor General.'), statementIds: [K(4)] },
      ],
      decide: [step(1, 8, { guide: g('Now you decide. Our class is a riding. Who would you vote for?', 'Who would you vote for?') })],
      show: [step(1, 6), step(1, 7)],
      reflect: [{ type: 'reflect' }],
    },
  },
  {
    id: 'gov-jurisdiction',
    worldId: 'government',
    lessonId: 'demo-ps-2',
    title: 'Who is responsible?',
    icon: '🍁',
    goal: g('Canada is a federal system. Find out which jobs belong to Canada’s government and which belong to Alberta’s.', 'Which jobs does Canada do? Which jobs does Alberta do?'),
    phases: {
      discover: [
        { type: 'goto', location: 'map', guide: g('This map shows Canada’s provinces and territories. It is simplified and not to scale.', 'This is a map of Canada.') },
        { type: 'map', location: 'map', correct: 'AB', prompt: g('Find Alberta. Tap it on the map.', 'Tap Alberta.'), feedback: g('Yes! That is Alberta, our province. Alberta has its own provincial government.'), statementIds: [K(11)] },
        { type: 'map', location: 'map', correct: 'ON', prompt: g('Parliament meets in Ottawa, the capital of Canada. Ottawa is in which province? Look for the red marker.', 'Ottawa has a red marker. Which province is it in?'), feedback: g('Yes! Ottawa is in Ontario. Canada’s federal government meets there.'), statementIds: [K(11)] },
      ],
      learn: [
        step(2, 3, { guide: g('Here are the two lists from the curriculum. Look at them, then explore the street.', 'Look at the two lists.') }),
        { type: 'explore', location: 'services', ids: ['svc:school', 'svc:hospital', 'svc:bank', 'svc:defence'], min: 2, guide: g('Tap at least two buildings on the street to hear what they are for.', 'Tap two buildings.') },
      ],
      try: [
        { type: 'sort3d', location: 'services', items: SERVICES.map((sv) => sv.id), guide: g('For each building, decide: is it a federal or a provincial responsibility? A flag goes up when you are right.', 'Canada or Alberta? A flag goes up when you are right.'), statementIds: [K(12), K(13), S(1)] },
      ],
      decide: [step(2, 6)],
      show: [step(2, 5)],
      reflect: [{ type: 'reflect' }],
    },
  },
  {
    id: 'gov-lawmaking',
    worldId: 'government',
    lessonId: 'demo-ps-3',
    title: 'From bill to law',
    icon: '📜',
    goal: g('Your community wants a new law. Help move the bill through every step until it becomes law.', 'Help a bill become a law.'),
    phases: {
      discover: [
        { type: 'goto', location: 'lawpath', guide: g('This path shows the seven official steps a bill takes to become a law.', 'This path has 7 steps.') },
        step(3, 2),
      ],
      learn: [
        { type: 'explore', location: 'lawpath', ids: LAW_STATIONS.map((s) => s.id), min: 3, guide: g('Tap at least three stations to hear what happens at each step.', 'Tap 3 steps to learn about them.') },
      ],
      try: [
        { type: 'sequence3d', location: 'lawpath', guide: g('Move the bill along the path. Tap the step that comes next. The station lights up when you are right.', 'Tap the next step. It lights up.'), statementIds: [K(8), K(9)] },
      ],
      decide: [step(3, 6)],
      show: [step(3, 5), { type: 'select', location: 'chambers', targets: ['commons', 'senate', 'throne'], correct: 'senate', prompt: g('After the House of Commons passes a bill, where does it go next?', 'After the MPs say yes, where does the bill go?'), feedback: g('Yes! The Senate reviews it next. Then the Crown gives Royal Assent.'), statementIds: [K(7), K(8)] }],
      reflect: [{ type: 'reflect' }],
    },
  },
  {
    id: 'gov-community',
    worldId: 'government',
    lessonId: 'demo-ps-4',
    title: 'Decisions in our community',
    icon: '🏘️',
    goal: g('Government decisions change communities. Explore a natural resource decision and who it affects.', 'How does a decision change our town?'),
    phases: {
      discover: [
        { type: 'explore', location: 'community', ids: ['town-hall', 'notice-board'], min: 2, guide: g('Something is happening in this community. Tap the town hall and the notice board.', 'Tap the town hall and the board.') },
      ],
      learn: [
        { type: 'explore', location: 'services', ids: ['svc:oil'], min: 1, guide: g('Tap the oil and gas site.', 'Tap the oil site.') },
        step(4, 3),
      ],
      try: [step(4, 5)],
      decide: [step(4, 6)],
      show: [step(4, 8)],
      reflect: [{ type: 'reflect' }],
    },
  },
  {
    id: 'gov-decide',
    worldId: 'government',
    lessonId: 'demo-ps-5',
    title: 'Make a decision for your community',
    icon: '🏗️',
    goal: g('Use what you learned to make a fair decision for your community, and explain why.', 'Make a fair choice. Say why.'),
    phases: {
      discover: [
        { type: 'explore', location: 'community', ids: ['project-board'], min: 1, guide: g('Tap the project board to see the choices.', 'Tap the project board.') },
      ],
      learn: [step(5, 2), step(5, 4)],
      try: [step(5, 3)],
      decide: [step(5, 5)],
      show: [step(5, 6), step(5, 7)],
      reflect: [{ type: 'reflect' }],
    },
  },
];

GOVERNMENT_MISSIONS.push({
  id: 'gov-checks',
  worldId: 'government',
  lessonId: null,
  title: 'Who checks the government?',
  icon: '⚖️',
  goal: g('Find out how courts, the Charter and other government tools shape decisions in Canada.', 'Who checks that laws are fair?'),
  concepts: [
    g('Canada’s courts interpret and apply the law, and make sure laws follow the Constitution.', 'Courts check that laws follow the rules.'),
    g('A case starts in a lower court, can go to an appeal court, and the Supreme Court of Canada has the final say.', 'Lower court → appeal court → Supreme Court.'),
    g('The Charter of Rights and Freedoms protects rights such as freedom of expression and equality, and limits what governments can do.', 'The Charter protects our rights.'),
    g('The Canadian Citizenship Act (1947) established Canadian citizenship.', 'In 1947, Canadian citizenship became official.'),
    g('Governments also make decisions through Orders in Council, regulations and ministerial orders.', 'Governments can also decide with orders and rules.'),
  ],
  phases: {
    discover: [
      { type: 'goto', location: 'justice', guide: g('Parliament makes laws, but who checks them? Welcome to the justice quarter.', 'Who checks the laws? Let’s find out.') },
      { type: 'explore', location: 'justice', ids: ['court-supreme', 'charter', 'citizenship-act'], min: 3, guide: g('Tap the Supreme Court, the Charter and the Citizenship Act.', 'Tap all three.') },
    ],
    learn: [
      { type: 'explore', location: 'justice', ids: ['court-lower', 'court-appeal', 'court-supreme'], min: 3, guide: g('Courts work like a ladder. Tap each step, from the lowest to the highest.', 'Tap each court.') },
      { type: 'explore', location: 'cabinet', ids: ['cabinet'], min: 1, guide: g('Governments make some decisions without passing a new law. Tap the Cabinet office.', 'Tap the Cabinet office.') },
    ],
    try: [
      { type: 'select', location: 'justice', targets: ['court-lower', 'court-appeal', 'court-supreme'], correct: 'court-lower', prompt: g('Which court hears a case first and makes the first decision?', 'Which court is first?'), feedback: g('Yes! Lower courts establish the facts and make the first decision.'), statementIds: [K(18)] },
      { type: 'select', location: 'justice', targets: ['court-lower', 'court-appeal', 'court-supreme'], correct: 'court-supreme', prompt: g('Which court is the highest and final court in Canada?', 'Which court is the top court?'), feedback: g('Yes! The Supreme Court of Canada has the final say.'), statementIds: [K(20)] },
    ],
    decide: [
      { type: 'select', location: 'justice', targets: ['court-supreme', 'cabinet', 'citizenship-act'], correct: 'court-supreme', prompt: g('A new law might take away a right protected by the Charter. Who can decide whether the law follows the Constitution?', 'A law might be unfair. Who decides?'), feedback: g('Yes! The courts interpret laws and can place limits on government authority.'), statementIds: [K(17), S(5), S(6)] },
    ],
    show: [
      { type: 'select', location: 'justice', targets: ['charter', 'citizenship-act', 'cabinet'], correct: 'charter', prompt: g('Which document protects freedom of expression, equality and legal protections?', 'What protects our rights?'), feedback: g('Yes! The Charter of Rights and Freedoms (1982).'), statementIds: [K(22)] },
      { type: 'select', location: 'justice', targets: ['charter', 'citizenship-act', 'cabinet'], correct: 'citizenship-act', prompt: g('Which 1947 law established Canadian citizenship?', 'Which law made citizenship official?'), feedback: g('Yes! The Canadian Citizenship Act (1947).'), statementIds: [K(21)] },
      { type: 'select', location: 'cabinet', targets: ['cabinet', 'court-lower', 'charter'], correct: 'cabinet', prompt: g('Where are Orders in Council and regulations made, as decisions beyond Parliament’s laws?', 'Where are orders and rules made?'), feedback: g('Yes! Cabinet makes these decisions as part of government.'), statementIds: [K(10), S(4)] },
    ],
    reflect: [{ type: 'reflect' }],
  },
});

export const PHASES = [
  { id: 'discover', label: 'Discover', icon: '🧭' },
  { id: 'learn', label: 'Learn', icon: '💡' },
  { id: 'try', label: 'Try', icon: '🔁' },
  { id: 'decide', label: 'Decide', icon: '🤔' },
  { id: 'show', label: 'Show What You Know', icon: '⭐' },
  { id: 'reflect', label: 'Reflect', icon: '🪞' },
];

/** Every statement a mission addresses (beats, exhibits it opens, and linked lesson steps). */
export function missionStatementIds(mission, lessons = []) {
  const ids = new Set();
  const lesson = lessons.find((l) => l.id === mission.lessonId);
  for (const beats of Object.values(mission.phases)) {
    for (const b of beats) {
      (b.statementIds || []).forEach((x) => ids.add(x));
      if (b.type === 'explore') b.ids.forEach((id) => (EXHIBITS[id]?.statementIds || []).forEach((x) => ids.add(x)));
      if (b.type === 'step' && lesson) {
        const st = lesson.steps.find((s) => s.id === b.stepId);
        if (st) {
          (st.statementIds || []).forEach((x) => ids.add(x));
          for (const cid of st.conceptIds || []) (lesson.essentialConcepts.find((c) => c.id === cid)?.statementIds || []).forEach((x) => ids.add(x));
        }
      }
    }
  }
  return [...ids];
}
