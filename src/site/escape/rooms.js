// "Escape from Parliament": five rooms, one per lesson of the Canada's
// Political System unit. Every lock is a G9-LO6 idea; statement ids are cited
// on each puzzle so answers become evidence for the teacher.

import { s, emoji, label, door, frame, shelf, desk, chest, poster, choiceWidget, placeWidget, orderWidget, decideWidget } from './engine.js';

const K = (n) => `G9-LO6-K${n}`;
const U = (n) => `G9-LO6-U${n}`;
const S = (n) => `G9-LO6-S${n}`;

// Hotspots: x, y, w, h in the 1000 x 600 scene.
const spot = (x, y, w, h, lbl, use, visible) => ({ x, y, w, h, label: lbl, use, visible });

export const ITEMS = {
  'tok-commons': { name: 'House of Commons token', symbol: '🗳️', target: 'commons' },
  'tok-senate': { name: 'Senate token', symbol: '🏛️', target: 'senate' },
  'tok-crown': { name: 'Crown token', symbol: '👑', target: 'crown' },
  helmet: { name: 'Helmet (defence)', symbol: '🪖', target: 'federal' },
  money: { name: 'Money (banking and currency)', symbol: '💵', target: 'federal' },
  passport: { name: 'Passport (citizenship)', symbol: '🛂', target: 'federal' },
  school: { name: 'School bell (education)', symbol: '🔔', target: 'provincial' },
  clinic: { name: 'First-aid kit (healthcare)', symbol: '🩺', target: 'provincial' },
  oil: { name: 'Oil barrel (natural resources)', symbol: '🛢️', target: 'provincial' },
  // Bill pieces – full official sequence
  'b-draft': { name: 'Bill drafting', symbol: '📝' },
  'b-r1': { name: 'First reading', symbol: '📖' },
  'b-r2': { name: 'Second reading (debate)', symbol: '🗣️' },
  'b-committee': { name: 'Committee stage', symbol: '🔍' },
  'b-r3': { name: 'Third reading', symbol: '🗳️' },
  'b-senate': { name: 'Senate approval', symbol: '🏛️' },
  'b-assent': { name: 'Royal assent', symbol: '✍️' },
  // Bill pieces – short sequence
  's-write': { name: 'Write the bill', symbol: '📝' },
  's-read': { name: 'Readings and debate', symbol: '🗣️' },
  's-check': { name: 'Committee checks it', symbol: '🔍' },
  's-senate': { name: 'Senate approves', symbol: '🏛️' },
  's-assent': { name: 'Royal assent', symbol: '✍️' },
  'c-jobs': { name: 'People get jobs', symbol: '👷', target: 'help' },
  'c-schools': { name: 'More money for schools', symbol: '🏫', target: 'help' },
  'c-noise': { name: 'Noise for neighbours', symbol: '🔊', target: 'hard' },
  'c-animals': { name: 'Animals lose some land', symbol: '🦌', target: 'hard' },
  'key-scale': { name: 'Balance key', symbol: '🗝️' },
  letter: { name: 'Letter to your MLA', symbol: '✉️' },
  stamp: { name: 'Alberta stamp', symbol: '🏔️' },
  decision: { name: 'Your community decision', symbol: '📜' },
};

const FULL_BILL = ['b-draft', 'b-r1', 'b-r2', 'b-committee', 'b-r3', 'b-senate', 'b-assent'];
const SHORT_BILL = ['s-write', 's-read', 's-check', 's-senate', 's-assent'];
// Where each bill piece is hidden (scrambled across the chamber).
const BILL_SPOTS = {
  full: { E: [['b-r2', 270, 330], ['b-assent', 500, 300], ['b-draft', 720, 335]], S: [['b-committee', 330, 250], ['b-senate', 640, 250]], W: [['b-r1', 290, 320], ['b-r3', 680, 320]] },
  short: { E: [['s-check', 270, 330], ['s-write', 720, 335]], S: [['s-assent', 480, 250]], W: [['s-read', 290, 320], ['s-senate', 680, 320]] },
};
const billMode = (api) => api.state.flags.billMode || (api.plain ? 'short' : 'full');

function pickUp(id, line) {
  return (api) => {
    api.setFlag(`got:${id}`);
    api.give(id, `${api.T(line)} It goes in your backpack.`);
  };
}

const notGot = (id) => (api) => !api.flag(`got:${id}`);

// ---------------------------------------------------------------------------

const ridingOffice = {
  id: 'riding',
  lessonId: 'demo-ps-1',
  name: { t: 'The Riding Office', p: 'Room 1: The Riding Office' },
  intro: { t: 'You are in an MP’s riding office. The door to Parliament is locked. It has a lock with three empty sockets.', p: 'The door is locked. Find 3 tokens to open it.' },
  theme: { ceiling: '#2a1f17', side: '#5e4a36', wall: '#7a6148', panel: '#4d3a28', trim: '#c9a227', floor: '#3b2a1f', floorLine: '#2b1e15' },
  hints: [
    { t: 'Turn around and look at all four walls. Tap things that glow.', p: 'Look at all 4 walls. Tap things that glow.' },
    { t: 'You need three tokens: one in the ballot box, one from the portrait and one from the bookshelf. Then tap the door.', p: 'Find tokens in the ballot box, the picture and the bookshelf.' },
    { t: 'Put 🗳️ on “Elected MPs make laws”, 🏛️ on “Reviews laws” and 👑 on “Gives Royal Assent”.', p: '🗳️ → make laws. 🏛️ → review laws. 👑 → Royal Assent.' },
  ],
  walls: {
    N: {
      look: { t: 'The door to Parliament, a lock with three sockets, and a map of your riding.', p: 'A locked door and a map.' },
      draw: (api) => {
        const solved = api.flag('solved:riding');
        const filled = ['tok-commons', 'tok-senate', 'tok-crown'].map((id) => api.flag(`placed:${id}`));
        return [
          poster(195, 140, 180, 140, 'Your riding', '🗺️'),
          door(430, { open: solved, color: '#6b3f22', sign: 'PARLIAMENT' }),
          s('rect', { x: 618, y: 230, width: 90, height: 130, rx: 8, fill: '#2a2018', stroke: '#c9a227', 'stroke-width': 3 }),
          filled.map((f, i) => s('circle', { cx: 663, cy: 260 + i * 38, r: 13, fill: f ? '#f2c94c' : '#120c08', stroke: '#c9a227', 'stroke-width': 2 })),
        ];
      },
      hotspots: [
        spot(187, 132, 196, 156, { t: 'Map of your riding', p: 'Map' }, (api) => api.inspect({ title: 'Map of your riding', symbol: '🗺️', text: { t: 'This map shows your riding. A riding is an area of Canada. The people in each riding elect one Member of Parliament (MP).', p: 'This is your riding. People here vote for one MP.' } })),
        spot(420, 160, 300, 312, { t: 'Door to Parliament and its lock', p: 'Door' }, (api) => {
          if (api.flag('solved:riding')) return api.nextRoom();
          api.inspect({
            title: 'The door lock',
            symbol: '🔒',
            text: { t: 'Parliament has three parts, and all three must approve a law. Put each token in the right socket.', p: 'Put each token in the right place.' },
            body: placeWidget(api, {
              step: { id: 'parliament-lock', title: 'Three parts of Parliament', statementIds: [K(3), K(4), K(5), K(7)] },
              prompt: 'Tap a token, then tap its socket.',
              items: ITEMS,
              itemIds: ['tok-commons', 'tok-senate', 'tok-crown'],
              targets: [
                { id: 'commons', symbol: '🟢', label: { t: 'Elected MPs make laws', p: 'MPs make laws' } },
                { id: 'senate', symbol: '🔴', label: { t: 'Reviews laws', p: 'Checks laws' } },
                { id: 'crown', symbol: '🟡', label: { t: 'Gives Royal Assent', p: 'Gives Royal Assent' } },
              ],
              wrongHint: (it) => `Think about what the ${it.name.replace(' token', '')} does. Try another socket.`,
              onDone: () => api.solve('Click! The lock opens. Tap the door to go into Parliament.'),
            }),
          });
        }),
      ],
    },
    E: {
      look: { t: 'A desk with a ballot box and a computer.', p: 'A desk with a ballot box.' },
      draw: (api) => [desk(300, 400), api.flag('got:tok-commons') ? emoji(420, 315, 70, '🗳️', { opacity: 0.5 }) : emoji(420, 315, 70, '🗳️'), emoji(590, 312, 64, '🖥️'), emoji(700, 330, 40, '☕')],
      hotspots: [
        spot(370, 262, 104, 100, { t: 'Ballot box', p: 'Ballot box' }, (api) => {
          if (api.flag('got:tok-commons')) return api.say('The ballot box is empty now.');
          api.inspect({
            title: 'Ballot box',
            symbol: '🗳️',
            text: { t: 'A ballot box from the last election. A note on it asks a question.', p: 'A ballot box. Answer the question.' },
            body: choiceWidget(api, {
              step: { id: 'one-mp', title: 'One MP per riding', statementIds: [K(5), K(6), S(3)] },
              prompt: 'How many Members of Parliament does one riding elect?',
              options: [{ label: 'One', symbol: '1️⃣', correct: true }, { label: 'Ten', symbol: '🔟' }, { label: 'None', symbol: '0️⃣' }],
              feedback: { correct: 'Yes! Each riding elects one MP.', incorrect: 'Look at the map of your riding for a clue.' },
              onCorrect: () => { api.close(); pickUp('tok-commons', 'The box opens. Inside is the House of Commons token 🗳️.')(api); },
            }),
          });
        }, null),
        spot(540, 262, 104, 96, { t: 'Computer', p: 'Computer' }, (api) => api.inspect({ title: 'An email on the computer', symbol: '🖥️', text: { t: '“Reminder: MPs in the House of Commons make new laws by debating and voting.”', p: '“MPs make laws. They talk and vote.”' } })),
      ],
    },
    S: {
      look: { t: 'A tall bookshelf and an old clock.', p: 'A bookshelf and a clock.' },
      draw: (api) => [shelf(270, 110, 400, 262), api.flag('got:tok-senate') ? null : s('rect', { x: 430, y: 175, width: 22, height: 52, fill: '#a12639', stroke: '#f2c94c', 'stroke-width': 3 }), emoji(770, 210, 80, '🕰️')],
      hotspots: [
        spot(262, 102, 416, 278, { t: 'Bookshelf (a red book sticks out)', p: 'Bookshelf' }, (api) => {
          if (api.flag('got:tok-senate')) return api.say('Just books now.');
          api.inspect({
            title: 'A red book about the Senate',
            symbol: '📕',
            text: { t: 'The red book is about the Senate. The last page has a question.', p: 'A book about the Senate. Answer the question.' },
            body: choiceWidget(api, {
              step: { id: 'senate', title: 'Senators are appointed', statementIds: [K(7)] },
              prompt: 'Senators are not elected. They are…',
              options: [{ label: 'Appointed (chosen)', symbol: '✋', correct: true }, { label: 'Elected by a riding', symbol: '🗳️' }],
              feedback: { correct: 'Yes! Senators are appointed. They review laws passed by the House of Commons.', incorrect: 'The question says they are NOT elected.' },
              onCorrect: () => { api.close(); pickUp('tok-senate', 'A Senate token 🏛️ falls out of the book.')(api); },
            }),
          });
        }),
        spot(726, 160, 90, 104, { t: 'Clock', p: 'Clock' }, (api) => api.say('Tick, tock. It is just a clock. There is no timer in this game!')),
      ],
    },
    W: {
      look: { t: 'A portrait of the Governor General.', p: 'A picture of the Governor General.' },
      draw: () => [frame(400, 120, 200, 220, [emoji(500, 165, 44, '👑'), emoji(500, 255, 110, '🧑‍⚖️')]), s('rect', { x: 420, y: 352, width: 160, height: 26, rx: 4, fill: '#c9a227' }), label(500, 371, 'Governor General', { size: 14, fill: '#2a1f17' })],
      hotspots: [
        spot(390, 110, 220, 272, { t: 'Portrait of the Governor General', p: 'Picture' }, (api) => {
          if (api.flag('got:tok-crown')) return api.say('The Governor General represents the Monarch.');
          api.inspect({
            title: 'Portrait of the Governor General',
            symbol: '👑',
            text: { t: 'The Governor General represents the Crown. A plaque under the picture asks a question.', p: 'The Governor General. Answer the question.' },
            body: choiceWidget(api, {
              step: { id: 'assent', title: 'Royal Assent', statementIds: [K(4)] },
              prompt: 'What does the Crown give to new laws?',
              options: [{ label: 'Royal Assent', symbol: '✍️', correct: true }, { label: 'A riding', symbol: '🗺️' }, { label: 'A ballot', symbol: '🗳️' }],
              feedback: { correct: 'Yes! The Governor General gives Royal Assent to laws.', incorrect: 'It is the final “yes” a law needs.' },
              onCorrect: () => { api.close(); pickUp('tok-crown', 'The frame swings open. Behind it is the Crown token 👑.')(api); },
            }),
          });
        }),
      ],
    },
  },
};

// ---------------------------------------------------------------------------

function vaultLock(api) {
  if (api.flag('solved:vault')) return api.nextRoom();
  api.inspect({
    title: 'The two chests',
    symbol: '🔐',
    text: { t: 'The vault opens when every object is in the right chest. One chest is for Canada’s government, one is for Alberta’s government.', p: 'Put each thing in the right chest.' },
    body: placeWidget(api, {
      step: { id: 'jurisdiction', title: 'Federal or provincial', statementIds: [K(11), K(12), K(13), S(1)] },
      prompt: 'Tap an object, then tap the chest it belongs in.',
      items: ITEMS,
      itemIds: ['helmet', 'money', 'passport', 'school', 'clinic', 'oil'],
      targets: [
        { id: 'federal', symbol: '🍁', label: { t: 'Federal: all of Canada', p: 'Canada' } },
        { id: 'provincial', symbol: '🏔️', label: { t: 'Provincial: Alberta', p: 'Alberta' } },
      ],
      wrongHint: (it, t) => `Is “${it.name}” a job for ${t.id === 'federal' ? 'all of Canada' : 'Alberta'}? Try the other chest.`,
      onDone: () => api.solve('The wheel spins and the vault door swings open! Tap the vault to go through.'),
    }),
  });
}

const vault = {
  id: 'vault',
  lessonId: 'demo-ps-2',
  name: { t: 'The Jurisdiction Vault', p: 'Room 2: The Vault' },
  intro: { t: 'A stone vault with two chests: a red one for Canada and a blue one for Alberta. Six objects are hidden around the room.', p: 'Find 6 things. Put them in the right chest.' },
  theme: { ceiling: '#1d2530', side: '#3a4654', wall: '#4d5b6b', panel: '#36414e', trim: '#8fa3b8', floor: '#2a323c', floorLine: '#20272f' },
  hints: [
    { t: 'Look at every wall. There are two objects on each of the other three walls.', p: 'Look at all the walls. Find 6 things.' },
    { t: 'Canada’s government: defence, money, citizenship. Alberta’s government: education, healthcare, natural resources.', p: 'Canada 🍁: helmet, money, passport. Alberta 🏔️: school bell, first-aid kit, oil.' },
    { t: 'Red chest 🍁: 🪖 💵 🛂. Blue chest 🏔️: 🔔 🩺 🛢️.', p: 'Red: 🪖 💵 🛂. Blue: 🔔 🩺 🛢️.' },
  ],
  walls: {
    N: {
      look: { t: 'The round vault door, with a red chest and a blue chest in front of it.', p: 'The vault and two chests.' },
      draw: (api) => {
        const open = api.flag('solved:vault');
        const count = (t) => ['helmet', 'money', 'passport', 'school', 'clinic', 'oil'].filter((id) => ITEMS[id].target === t && api.flag(`placed:${id}`)).length;
        return [
          s('circle', { cx: 500, cy: 235, r: 135, fill: '#2b333d' }),
          open ? s('circle', { cx: 500, cy: 235, r: 120, fill: '#f7e7b0' }) : [s('circle', { cx: 500, cy: 235, r: 120, fill: '#8a96a3' }), s('circle', { cx: 500, cy: 235, r: 40, fill: 'none', stroke: '#3a4654', 'stroke-width': 10 }), [0, 60, 120].map((a) => s('rect', { x: 440, y: 230, width: 120, height: 10, fill: '#3a4654', transform: `rotate(${a} 500 235)` }))],
          chest(200, { color: '#a12639', sym: '🍁', name: 'CANADA', count: `${count('federal')} / 3` }),
          chest(650, { color: '#1f5ea8', sym: '🏔️', name: 'ALBERTA', count: `${count('provincial')} / 3` }),
        ];
      },
      hotspots: [
        spot(190, 330, 170, 145, { t: 'Red chest for Canada', p: 'Red chest' }, vaultLock),
        spot(640, 330, 170, 145, { t: 'Blue chest for Alberta', p: 'Blue chest' }, vaultLock),
        spot(380, 100, 240, 260, { t: 'Vault door', p: 'Vault door' }, vaultLock),
      ],
    },
    E: {
      look: { t: 'A shelf with army gear and a bank bag.', p: 'A shelf.' },
      draw: (api) => [s('rect', { x: 250, y: 290, width: 500, height: 16, fill: '#6b5a44' }), s('rect', { x: 260, y: 306, width: 14, height: 80, fill: '#6b5a44' }), s('rect', { x: 726, y: 306, width: 14, height: 80, fill: '#6b5a44' }), poster(420, 120, 160, 120, 'Canada', '🍁', { bg: '#e9d6d9' }), api.flag('got:helmet') ? null : emoji(330, 255, 70, '🪖'), api.flag('got:money') ? null : emoji(660, 255, 70, '💵')],
      hotspots: [
        spot(285, 210, 95, 90, 'Helmet', pickUp('helmet', { t: 'A soldier’s helmet. Defence keeps all of Canada safe.', p: 'A helmet. Defence.' }), notGot('helmet')),
        spot(612, 210, 95, 90, 'Money', pickUp('money', { t: 'A bag of Canadian money. Banking and currency are the same across Canada.', p: 'Money. Banking.' }), notGot('money')),
      ],
    },
    S: {
      look: { t: 'A desk and a barrel in the corner.', p: 'A desk and a barrel.' },
      draw: (api) => [desk(250, 300), api.flag('got:passport') ? null : emoji(400, 325, 56, '🛂'), api.flag('got:oil') ? null : emoji(690, 390, 110, '🛢️'), poster(600, 130, 150, 110, 'Alberta', '🏔️', { bg: '#d6e2f2' })],
      hotspots: [
        spot(360, 285, 82, 80, 'Passport', pickUp('passport', { t: 'A passport. It shows Canadian citizenship.', p: 'A passport. Citizenship.' }), notGot('passport')),
        spot(630, 325, 120, 130, 'Oil barrel', pickUp('oil', { t: 'An oil barrel. Oil and gas are natural resources.', p: 'Oil. Natural resources.' }), notGot('oil')),
      ],
    },
    W: {
      look: { t: 'A table with a school bell and a first-aid kit.', p: 'A table.' },
      draw: (api) => [desk(300, 400, { color: '#5a4a3a' }), api.flag('got:school') ? null : emoji(400, 315, 62, '🔔'), api.flag('got:clinic') ? null : emoji(600, 315, 62, '🩺'), poster(430, 120, 140, 110, 'Schools & health', '🏫', { bg: '#d6e2f2' })],
      hotspots: [
        spot(360, 275, 82, 80, 'School bell', pickUp('school', { t: 'A school bell. Education means schools.', p: 'A school bell. Schools.' }), notGot('school')),
        spot(560, 275, 82, 80, 'First-aid kit', pickUp('clinic', { t: 'A doctor’s kit. Healthcare means hospitals and doctors.', p: 'A doctor’s kit. Healthcare.' }), notGot('clinic')),
      ],
    },
  },
};

// ---------------------------------------------------------------------------

function billMachine(api) {
  if (api.flag('solved:chamber')) return api.say('The Bill Machine has stamped ROYAL ASSENT. The door is open!');
  const mode = billMode(api);
  api.inspect({
    title: 'The Bill Machine',
    symbol: '⚙️',
    wide: true,
    text: { t: 'The machine turns a bill into a law, but only if the steps go in the right order. Find the scroll pieces in the chamber.', p: 'Put the steps in order.' },
    body: orderWidget(api, {
      step: { id: 'bill-order', title: mode === 'full' ? 'Seven steps from bill to law' : 'Five steps from bill to law', statementIds: [K(8), K(9)] },
      prompt: mode === 'full' ? 'Tap the scroll pieces in order, from first to last.' : 'Tap the steps in order: first, next, last.',
      order: mode === 'full' ? FULL_BILL : SHORT_BILL,
      items: ITEMS,
      onDone: () => api.solve('STAMP! ✍️ ROYAL ASSENT. The bill is now a law, and the chamber door unlocks.'),
    }),
  });
}

function billSpots(wall) {
  return (api) => BILL_SPOTS[billMode(api)][wall].filter(([id]) => !api.flag(`got:${id}`)).map(([, x, y]) => emoji(x, y, 46, '📜'));
}

function billHotspots(wall) {
  const make = (mode) =>
    BILL_SPOTS[mode][wall].map(([id, x, y]) =>
      spot(x - 40, y - 40, 80, 80, { t: 'A rolled-up scroll', p: 'Scroll' }, (api) => {
        api.setFlag('billMode', mode);
        pickUp(id, `A scroll piece: “${ITEMS[id].name}” ${ITEMS[id].symbol}.`)(api);
      }, (api) => billMode(api) === mode && !api.flag(`got:${id}`)));
  return [...make('full'), ...make('short')];
}

const chamber = {
  id: 'chamber',
  lessonId: 'demo-ps-3',
  name: { t: 'The House of Commons Chamber', p: 'Room 3: The Chamber' },
  intro: { t: 'The green chamber where MPs debate. A Bill Machine stands by the Speaker’s chair. Scroll pieces are scattered on the benches.', p: 'Find the scrolls. Put the steps in order.' },
  theme: { ceiling: '#2b2216', side: '#4a3a26', wall: '#5c4630', panel: '#3f2f1f', trim: '#c9a227', floor: '#1f5a42', floorLine: '#184835' },
  hints: [
    { t: 'Collect every scroll 📜 from the benches and the gallery. Then tap the Bill Machine.', p: 'Find all the scrolls 📜. Then tap the machine.' },
    { t: 'A law starts as a written bill. MPs read and debate it, a committee checks it, the Senate approves it and the Crown gives Royal Assent last.', p: 'Write → read and talk → check → Senate → Royal Assent.' },
    { t: 'Order: Bill drafting, First reading, Second reading, Committee stage, Third reading, Senate approval, Royal assent.', p: 'Order: Write the bill, Readings, Committee, Senate, Royal assent.' },
  ],
  walls: {
    N: {
      look: { t: 'The Speaker’s chair, the Bill Machine and a door.', p: 'The Speaker’s chair, a machine and a door.' },
      draw: (api) => {
        const done = api.flag('solved:chamber');
        return [
          s('rect', { x: 190, y: 150, width: 200, height: 210, rx: 10, fill: '#3b4a42', stroke: '#c9a227', 'stroke-width': 4 }),
          label(290, 180, 'BILL MACHINE', { size: 16 }),
          [0, 1, 2, 3].map((i) => s('rect', { x: 215, y: 200 + i * 34, width: 150, height: 24, rx: 4, fill: done ? '#f2c94c' : '#1d2620' })),
          done ? label(290, 345, 'ROYAL ASSENT ✍️', { size: 15, fill: '#f2c94c' }) : null,
          s('rect', { x: 445, y: 120, width: 110, height: 250, rx: 8, fill: '#3d2a18' }),
          s('rect', { x: 430, y: 104, width: 140, height: 30, rx: 6, fill: '#5a3d22' }),
          s('rect', { x: 460, y: 250, width: 80, height: 70, fill: '#1f5a42' }),
          label(500, 395, 'SPEAKER', { size: 14 }),
          door(640, { open: done, color: '#3d2a18', sign: 'NEXT ROOM' }),
        ];
      },
      hotspots: [
        spot(182, 142, 216, 226, { t: 'The Bill Machine', p: 'Machine' }, billMachine),
        spot(430, 100, 140, 280, { t: 'The Speaker’s chair', p: 'Chair' }, (api) => api.inspect({ title: 'The Speaker’s chair', symbol: '🪑', text: { t: 'The Speaker keeps order while MPs debate bills. A law needs many people to agree: MPs, the Senate and the Crown.', p: 'MPs talk about bills here.' } })),
        spot(630, 160, 170, 312, { t: 'Door', p: 'Door' }, (api) => (api.flag('solved:chamber') ? api.nextRoom() : api.say('Locked. A sign says: “Only a law can open this door.”'))),
      ],
    },
    E: {
      look: { t: 'Green benches where MPs sit.', p: 'Green benches.' },
      draw: (api) => [[0, 1, 2].map((r) => s('rect', { x: 200 + r * 20, y: 300 + r * 40, width: 600 - r * 40, height: 30, rx: 8, fill: '#2f7a58' })), billSpots('E')(api)],
      hotspots: billHotspots('E'),
    },
    S: {
      look: { t: 'The public gallery, where visitors watch.', p: 'The gallery.' },
      draw: (api) => [s('rect', { x: 180, y: 200, width: 640, height: 20, fill: '#5a3d22' }), [0, 1, 2, 3, 4, 5, 6].map((i) => s('rect', { x: 200 + i * 88, y: 220, width: 10, height: 60, fill: '#5a3d22' })), s('rect', { x: 180, y: 280, width: 640, height: 14, fill: '#5a3d22' }), billSpots('S')(api)],
      hotspots: billHotspots('S'),
    },
    W: {
      look: { t: 'More green benches, and a mace on a table.', p: 'Benches and a table.' },
      draw: (api) => [[0, 1].map((r) => s('rect', { x: 200 + r * 20, y: 340 + r * 40, width: 600 - r * 40, height: 30, rx: 8, fill: '#2f7a58' })), s('rect', { x: 430, y: 250, width: 140, height: 60, fill: '#5a3d22' }), s('rect', { x: 445, y: 238, width: 110, height: 10, rx: 5, fill: '#c9a227' }), billSpots('W')(api)],
      hotspots: billHotspots('W'),
    },
  },
};

// ---------------------------------------------------------------------------

const albertaRoom = {
  id: 'alberta',
  lessonId: 'demo-ps-4',
  name: { t: 'The Alberta Room', p: 'Room 4: The Alberta Room' },
  intro: { t: 'A room with a big window over an Alberta town. The door needs two things: a Balance key and a letter to your MLA.', p: 'You need a key 🗝️ and a letter ✉️ to open the door.' },
  theme: { ceiling: '#2d2a24', side: '#6d6252', wall: '#8a7d68', panel: '#5b5040', trim: '#d9c9a0', floor: '#4a3f33', floorLine: '#3b3228' },
  hints: [
    { t: 'Take the cards from the notice board. Then use the scale under the window.', p: 'Get the cards from the board. Then tap the scale.' },
    { t: 'Jobs and money for schools help people. Noise and animals losing land make things harder.', p: 'Jobs 👷 and schools 🏫 help. Noise 🔊 and animals 🦌 are harder.' },
    { t: 'The telephone desk gives the letter: write to your MLA. Then tap the door with both the key and the letter.', p: 'Answer at the telephone. Then tap the door.' },
  ],
  walls: {
    N: {
      look: { t: 'A big window over an Alberta town, and a balance scale on a table.', p: 'A window and a scale.' },
      draw: (api) => [
        s('defs', {}, s('linearGradient', { id: 'esc-sky', x1: 0, y1: 0, x2: 0, y2: 1 }, s('stop', { offset: '0%', 'stop-color': '#f6c27a' }), s('stop', { offset: '100%', 'stop-color': '#9fc6e8' }))),
        frame(240, 110, 520, 200, [s('rect', { x: 240, y: 110, width: 520, height: 200, fill: 'url(#esc-sky)' }), s('rect', { x: 240, y: 240, width: 520, height: 70, fill: '#c8b25a' }), emoji(330, 238, 46, '🏘️'), emoji(480, 228, 54, '🏗️'), emoji(600, 262, 36, '🦌'), emoji(700, 236, 46, '🌲')], { color: '#d9c9a0' }),
        desk(380, 240, { color: '#5b4a36' }),
        emoji(500, 318, 74, '⚖️'),
        api.flag('solved:scale') ? emoji(560, 340, 30, '🗝️', { opacity: 0.5 }) : null,
      ],
      hotspots: [
        spot(232, 102, 536, 216, { t: 'Window over the town', p: 'Window' }, (api) => api.inspect({ title: 'View from the window', symbol: '🪟', text: { t: 'Alberta’s government has approved a new oil and gas project near the town. Alberta has authority over its natural resources. Some people are happy, and some are worried.', p: 'Alberta said yes to a new oil project. Some people are happy. Some are worried.' } })),
        spot(445, 268, 110, 100, { t: 'Balance scale', p: 'Scale' }, (api) => {
          if (api.flag('solved:scale')) return api.say('The scale is balanced. You already have the Balance key.');
          api.inspect({
            title: 'The balance scale',
            symbol: '⚖️',
            text: { t: 'One side is “Helps”, the other is “Makes it harder”. Sort the cards about the oil and gas project to balance the scale.', p: 'Sort the cards. Helps or harder?' },
            body: placeWidget(api, {
              step: { id: 'helps-harder', title: 'Helps or makes it harder', statementIds: [K(15), K(16), S(7)] },
              prompt: 'Tap a card, then tap a side of the scale.',
              items: ITEMS,
              itemIds: ['c-jobs', 'c-schools', 'c-noise', 'c-animals'],
              targets: [{ id: 'help', symbol: '😊', label: 'Helps' }, { id: 'hard', symbol: '😟', label: 'Makes it harder' }],
              wrongHint: (it) => `Would “${it.name}” make people happy or worried?`,
              onDone: () => {
                api.setFlag('solved:scale');
                api.close();
                api.give('key-scale', 'The scale balances and a drawer pops open. You found the Balance key 🗝️! One decision can help some people and make things harder for others.');
              },
            }),
          });
        }),
      ],
    },
    E: {
      look: { t: 'A notice board with cards pinned to it.', p: 'A notice board.' },
      draw: (api) => [s('rect', { x: 280, y: 120, width: 440, height: 220, rx: 6, fill: '#b08657' }), s('rect', { x: 292, y: 132, width: 416, height: 196, fill: '#c9a06b' }), label(500, 160, 'TOWN NOTICES', { size: 18, fill: '#3b2a1f' }), api.flag('got:cards') ? null : ['👷', '🏫', '🔊', '🦌'].map((e, i) => [s('rect', { x: 310 + i * 100, y: 185, width: 80, height: 100, fill: '#fffaf0' }), emoji(350 + i * 100, 235, 44, e)])],
      hotspots: [
        spot(272, 112, 456, 236, { t: 'Notice board', p: 'Notice board' }, (api) => {
          if (api.flag('got:cards')) return api.say('The board is empty now.');
          api.setFlag('got:cards');
          for (const id of ['c-jobs', 'c-schools', 'c-noise', 'c-animals']) api.give(id);
          api.say('You take 4 cards about the oil and gas project: 👷 jobs, 🏫 money for schools, 🔊 noise and 🦌 animals.');
        }),
      ],
    },
    S: {
      look: { t: 'The door, and a poster about citizens.', p: 'The door and a poster.' },
      draw: (api) => [door(430, { open: api.flag('solved:alberta'), color: '#4f3a26', sign: 'ROTUNDA' }), poster(215, 150, 170, 170, 'Citizens', '🤝'), emoji(640, 300, 34, '🗝️', { opacity: 0.7 }), emoji(640, 345, 34, '✉️', { opacity: 0.7 })],
      hotspots: [
        spot(207, 142, 186, 186, { t: 'Poster about citizens', p: 'Poster' }, (api) => api.inspect({ title: 'Poster: Citizens', symbol: '🤝', text: { t: 'Canadian citizens have rights, like voting and freedoms, and responsibilities, like obeying laws, participating in democracy and respecting the rights of others.', p: 'Citizens can vote. Citizens obey laws and respect others.' } })),
        spot(420, 160, 250, 312, { t: 'Door to the Rotunda', p: 'Door' }, (api) => {
          if (api.flag('solved:alberta')) return api.nextRoom();
          const need = [!api.has('key-scale') && 'the Balance key 🗝️', !api.has('letter') && 'a letter to your MLA ✉️'].filter(Boolean);
          if (need.length) return api.say(`The door has two locks. You still need ${need.join(' and ')}.`);
          api.take('key-scale');
          api.take('letter');
          api.solve('You turn the key and post the letter through the slot. The door opens! Tap it to go through.');
        }),
      ],
    },
    W: {
      look: { t: 'A desk with a telephone and some writing paper.', p: 'A desk with a phone.' },
      draw: (api) => [desk(320, 360), emoji(420, 318, 62, '☎️'), api.flag('got:letter') ? null : emoji(580, 325, 54, '📄')],
      hotspots: [
        spot(360, 260, 300, 110, { t: 'Telephone and paper', p: 'Phone and paper' }, (api) => {
          if (api.flag('got:letter')) return api.say('You already wrote your letter.');
          api.inspect({
            title: 'A ringing telephone',
            symbol: '☎️',
            text: { t: 'A caller says: “Some people do not agree with the oil project. What can a citizen do?”', p: 'Someone does not agree with the decision. What can they do?' },
            body: choiceWidget(api, {
              step: { id: 'participate', title: 'Taking part in democracy', statementIds: [K(23)] },
              prompt: 'What can a citizen do if they do not agree with a decision?',
              options: [{ label: 'Write or talk to their MLA or MP', symbol: '✉️', correct: true }, { label: 'Keep it a secret', symbol: '🤐' }, { label: 'Break the law', symbol: '🚫' }],
              feedback: { correct: 'Yes! Citizens take part in democracy by sharing their views with their representatives.', incorrect: 'Look at the poster about citizens on the back wall.' },
              onCorrect: () => { api.close(); api.setFlag('got:letter'); api.give('letter', 'You write a letter to your MLA ✉️ and put it in your backpack.'); },
            }),
          });
        }),
      ],
    },
  },
};

// ---------------------------------------------------------------------------

const PROJECTS = [
  { label: 'New school', symbol: '🏫', detail: 'Helps children and families' },
  { label: 'Health clinic', symbol: '🏥', detail: 'Helps sick and older people' },
  { label: 'Town arena', symbol: '🏒', detail: 'Helps sports and friends' },
  { label: 'Protect land and animals', symbol: '🌲', detail: 'Helps nature' },
];
const REASONS = [
  { label: 'It helps many people', symbol: '👥' },
  { label: 'It helps people who need it most', symbol: '🫶' },
  { label: 'It is fair to everyone', symbol: '⚖️' },
  { label: 'It is good for the environment', symbol: '🌎' },
];

const rotunda = {
  id: 'rotunda',
  lessonId: 'demo-ps-5',
  name: { t: 'The Rotunda', p: 'Room 5: The Rotunda' },
  intro: { t: 'The great round hall. The way out is through the big doors. To open them, you must make a decision for your community.', p: 'Make a decision for your town. Then open the big doors.' },
  theme: { ceiling: '#2a2620', side: '#8c8577', wall: '#b3ab9b', panel: '#8a8271', trim: '#c9a227', floor: '#6e675b', floorLine: '#5d564b' },
  hints: [
    { t: 'Start at the clerk’s desk to get the Alberta stamp. Then go to the project board.', p: 'Go to the desk first. Then the board.' },
    { t: 'Education and healthcare are Alberta’s responsibilities. Choose any project on the board and give a reason. Every project can be a good choice.', p: 'Alberta decides about schools and health. Any project is OK. Say why.' },
    { t: 'At the big doors: citizens and the government both get a say in a democracy.', p: 'Citizens and the government both get a say.' },
  ],
  walls: {
    N: {
      look: { t: 'The great doors out of Parliament.', p: 'The big doors out.' },
      draw: () => [s('rect', { x: 352, y: 120, width: 296, height: 350, rx: 140, fill: '#4a3624' }), s('rect', { x: 365, y: 140, width: 132, height: 330, fill: '#6b4a2c' }), s('rect', { x: 503, y: 140, width: 132, height: 330, fill: '#6b4a2c' }), s('rect', { x: 400, y: 84, width: 200, height: 30, rx: 4, fill: '#1b6a4e' }), label(500, 105, 'EXIT', { size: 18 }), emoji(250, 220, 70, '🇨🇦'), emoji(750, 220, 70, '🇨🇦')],
      hotspots: [
        spot(352, 110, 296, 362, { t: 'The great doors', p: 'Big doors' }, (api) => {
          if (!api.has('decision')) return api.say('The doors are locked. A sign says: “Show your community decision to leave.”');
          api.inspect({
            title: 'The great doors',
            symbol: '🚪',
            text: { t: 'You hold up your decision. A voice asks one last question.', p: 'One last question.' },
            body: choiceWidget(api, {
              step: { id: 'who-has-say', title: 'Sharing power', statementIds: [K(23), S(9)] },
              prompt: 'In a democracy, who should get a say in decisions like this?',
              options: [{ label: 'Citizens and the government', symbol: '🧑‍🤝‍🧑', correct: true }, { label: 'Only the government', symbol: '🏛️' }, { label: 'Nobody', symbol: '🚫' }],
              feedback: { correct: 'Yes! Citizens share power by voting and sharing their ideas.', incorrect: 'Think about the letter you wrote to your MLA.' },
              onCorrect: () => { api.take('decision'); api.solve('The great doors swing open. Sunlight! You did it!'); setTimeout(() => api.nextRoom(), 1400); },
            }),
          });
        }),
      ],
    },
    E: {
      look: { t: 'The clerk’s desk, with a stamp.', p: 'A desk with a stamp.' },
      draw: (api) => [desk(320, 360, { color: '#5b4a36' }), api.flag('got:stamp') ? null : emoji(500, 320, 60, '🏔️'), emoji(400, 320, 46, '📚'), label(500, 260, 'CLERK', { size: 16, fill: '#2a2620' })],
      hotspots: [
        spot(440, 270, 120, 100, { t: 'Stamp on the clerk’s desk', p: 'Stamp' }, (api) => {
          if (api.flag('got:stamp')) return api.say('The desk is empty.');
          api.inspect({
            title: 'The clerk’s desk',
            symbol: '🏔️',
            text: { t: 'A note: “Projects for schools and health in Alberta need the right government’s stamp.”', p: 'Which government decides?' },
            body: choiceWidget(api, {
              step: { id: 'who-decides', title: 'Who decides', statementIds: [K(13), S(1)] },
              prompt: 'A new school or health clinic in Alberta. Which government decides?',
              options: [{ label: 'Alberta’s government', symbol: '🏔️', correct: true }, { label: 'Canada’s government', symbol: '🍁' }],
              feedback: { correct: 'Yes! Education and healthcare are provincial responsibilities.', incorrect: 'Remember the blue chest in the vault.' },
              onCorrect: () => { api.close(); api.setFlag('got:stamp'); api.give('stamp', 'You take the Alberta stamp 🏔️.'); },
            }),
          });
        }),
      ],
    },
    S: {
      look: { t: 'A statue and a display case.', p: 'A statue and a case.' },
      draw: () => [s('rect', { x: 290, y: 330, width: 120, height: 140, fill: '#8a8271' }), emoji(350, 260, 110, '🗽'), s('rect', { x: 560, y: 250, width: 180, height: 120, fill: '#cfe6f2', opacity: 0.6, stroke: '#c9a227', 'stroke-width': 4 }), emoji(650, 310, 56, '📜'), s('rect', { x: 560, y: 370, width: 180, height: 100, fill: '#8a8271' })],
      hotspots: [
        spot(550, 240, 200, 140, { t: 'Display case', p: 'Display case' }, (api) => api.inspect({ title: 'A display case', symbol: '📜', text: { t: 'Inside is a copy of the Canadian Charter of Rights and Freedoms. It protects rights like freedom of expression and equality.', p: 'The Charter. It protects our rights.' } })),
        spot(290, 190, 120, 280, { t: 'Statue', p: 'Statue' }, (api) => api.say('A stone statue. It looks like it wants you to finish the game!')),
      ],
    },
    W: {
      look: { t: 'A board of community projects.', p: 'A board of projects.' },
      draw: (api) => [s('rect', { x: 250, y: 120, width: 500, height: 240, rx: 6, fill: '#1b6a4e' }), label(500, 155, 'ONE PROJECT FOR OUR COMMUNITY', { size: 17 }), PROJECTS.map((p, i) => [s('rect', { x: 275 + i * 118, y: 175, width: 100, height: 150, rx: 6, fill: '#f6f1e3' }), emoji(325 + i * 118, 235, 48, p.symbol)]), api.flag('got:decision') ? label(500, 345, '✔ Decision made', { size: 16, fill: '#f2c94c' }) : null],
      hotspots: [
        spot(242, 112, 516, 256, { t: 'Project board', p: 'Project board' }, (api) => {
          if (api.flag('got:decision')) return api.say('You already made your decision. Take it to the big doors.');
          if (!api.has('stamp')) return api.say('The board says: “Get the Alberta stamp from the clerk’s desk first.”');
          api.inspect({
            title: 'Choose one project',
            symbol: '🏗️',
            wide: true,
            text: { t: 'Alberta has money from oil and gas for ONE project in your community. You decide. There is no wrong choice, but you must give a reason.', p: 'Pick one project. Say why.' },
            body: decideWidget(api, {
              step: { id: 'community-decision', title: 'Community decision', statementIds: [U(1), S(7), S(9)] },
              prompt: 'Which project should Alberta choose?',
              options: PROJECTS,
              reasonPrompt: 'Why is it the best choice?',
              reasons: REASONS,
              onDone: (sentence) => { api.close(); api.take('stamp'); api.setFlag('got:decision'); api.give('decision', `You stamp your decision: “${sentence}” Take it to the big doors.`); },
            }),
          });
        }),
      ],
    },
  },
};

export const ESCAPE_GAME = {
  id: 'act-escape',
  title: 'Escape from Parliament',
  intro: {
    t: 'You are on a class trip to Parliament. You stopped to look at a painting, and your group left without you! The doors are locked. Solve the puzzles in five rooms to find your way out.',
    p: 'You are at Parliament. The doors are locked! Solve puzzles in 5 rooms to get out.',
  },
  outro: {
    title: { t: 'You escaped from Parliament!', p: 'You got out!' },
    learned: [
      { t: 'Each riding elects one MP. Parliament has three parts: the House of Commons, the Senate and the Crown.', p: 'We vote for one MP. Parliament has 3 parts.' },
      { t: 'Canada’s government handles defence, money and citizenship. Alberta’s handles education, healthcare and natural resources.', p: 'Canada and Alberta have different jobs.' },
      { t: 'A bill goes through readings, committee and the Senate, then gets Royal Assent to become a law.', p: 'A bill takes many steps to become a law.' },
      { t: 'A decision can help some people and make things harder for others. Citizens can share their views with their MLA or MP.', p: 'Decisions help some people. Citizens can speak up.' },
      { t: 'Good decisions give reasons and are fair, and citizens and governments share power.', p: 'Give reasons. Be fair. Citizens get a say.' },
    ],
  },
  items: ITEMS,
  rooms: [ridingOffice, vault, chamber, albertaRoom, rotunda],
  // Every statement a puzzle in the game cites (shown on the teachers page).
  curriculumLinks: {
    outcomeIds: ['G9-LO6'],
    statementIds: [K(3), K(4), K(5), K(6), K(7), K(8), K(9), K(11), K(12), K(13), K(15), K(16), K(23), U(1), S(1), S(3), S(7), S(9)],
  },
};
