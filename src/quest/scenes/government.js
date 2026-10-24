// World 4: Inside Canadian Government (G9-LO6). An illustrative civic campus:
// Parliament's Centre Block, the House of Commons and Senate chambers, the
// Crown's throne, a seven-station law path, a map of Canada, a street of
// government services, a riding office and a community square.

import { canadaMap, lakeAndHills } from './common.js';

export const SERVICES = [
  { id: 'defence', name: 'Armed Forces base', symbol: '🪖', level: 'federal', responsibility: 'Defence', color: '#7d8a6a' },
  { id: 'bank', name: 'Bank of Canada', symbol: '💵', level: 'federal', responsibility: 'Banking and currency', color: '#c9c1ad' },
  { id: 'trade', name: 'Trade office', symbol: '🚢', level: 'federal', responsibility: 'Trade and commerce', color: '#9fb4c7' },
  { id: 'courts', name: 'Criminal court', symbol: '⚖️', level: 'federal', responsibility: 'Criminal law', color: '#b8a98f' },
  { id: 'citizenship', name: 'Citizenship office', symbol: '🛂', level: 'federal', responsibility: 'Citizenship', color: '#d1b7a1' },
  { id: 'school', name: 'High school', symbol: '🏫', level: 'provincial', responsibility: 'Education', color: '#e0c39a' },
  { id: 'hospital', name: 'Hospital', symbol: '🏥', level: 'provincial', responsibility: 'Healthcare', color: '#e8e4dc' },
  { id: 'town', name: 'Town office', symbol: '🏘️', level: 'provincial', responsibility: 'Municipalities', color: '#cbb59a' },
  { id: 'oil', name: 'Oil and gas site', symbol: '🛢️', level: 'provincial', responsibility: 'Natural resources', color: '#5b5f63' },
];

export const LAW_STATIONS = [
  { id: 'law-1', name: 'Bill drafting', symbol: '📝', place: 'House of Commons', text: 'A bill is a written plan for a new law. It is drafted first.' },
  { id: 'law-2', name: 'First reading', symbol: '📖', place: 'House of Commons', text: 'First reading: the bill is introduced in the House of Commons.' },
  { id: 'law-3', name: 'Second reading', symbol: '🗣️', place: 'House of Commons', text: 'Second reading: MPs debate the main idea of the bill.' },
  { id: 'law-4', name: 'Committee stage', symbol: '🔍', place: 'House of Commons', text: 'Committee stage: a small group of MPs reviews the bill in detail.' },
  { id: 'law-5', name: 'Third reading', symbol: '🗳️', place: 'House of Commons', text: 'Third reading: MPs give final approval to the bill.' },
  { id: 'law-6', name: 'Senate approval', symbol: '🏛️', place: 'Senate', text: 'The Senate reviews the bill and must approve it.' },
  { id: 'law-7', name: 'Royal assent', symbol: '✍️', place: 'The Crown', text: 'The Governor General, representing the Crown, gives Royal Assent. Now it is a law.' },
];

export const GOVERNMENT_SCENE = {
  id: 'government',
  sky: '#cbe0ef',
  build({ THREE, kit: k, add, register, world }) {
    add(k.ground(400, '#88b873'));
    add(k.box(80, 0.06, 14, '#d9d1bf', [0, 0, -4]));
    add(k.box(10, 0.06, 40, '#d9d1bf', [0, 0, 14]));
    add(k.box(66, 0.06, 6, '#d9d1bf', [0, 0, 26]));
    add(lakeAndHills(k, THREE));

    // Parliament Centre Block
    const parl = k.interactive(k.parliament(), { ringRadius: 9, hit: [34, 24, 12] });
    parl.position.set(0, 0, -36);
    add(parl);
    register('parliament', parl, { label: 'Parliament (Centre Block)', icon: '🏛️', height: 27 });
    add(k.at(k.flag('canada', { height: 9 }), -6, 0, -26));

    // Chambers
    const commons = k.interactive(k.chamber({ color: '#2f7a58', floor: '#3b5a48', title: 'House of Commons', symbol: '🗳️' }), { ringRadius: 7.5, hit: [12, 4, 14] });
    commons.position.set(-15, 0, -16);
    add(commons);
    register('commons', commons, { label: 'House of Commons', icon: '🟩', height: 5 });
    add(k.at(k.throne('#2f7a58'), -15, 0.2, -21.4));

    const senate = k.interactive(k.chamber({ color: '#a12639', floor: '#5a2a30', title: 'Senate', symbol: '🏛️' }), { ringRadius: 7.5, hit: [12, 4, 10] });
    senate.position.set(15, 0, -16);
    add(senate);
    register('senate', senate, { label: 'Senate', icon: '🟥', height: 5 });

    const throne = k.interactive(k.throne('#a12639'), { ringRadius: 2, hit: [3, 3.6, 3] });
    throne.position.set(15, 0.2, -21.2);
    add(throne);
    register('throne', throne, { label: 'The Crown (Governor General)', icon: '👑', height: 4.4 });

    // Law path
    const stationObjs = LAW_STATIONS.map((st, i) => {
      const ped = k.interactive(k.pedestal(st.symbol, st.name), { ringRadius: 1.3, hit: [2.4, 3.4, 2.4] });
      ped.position.set(-9 + i * 3, 0, -6);
      add(ped);
      register(st.id, ped, { label: `${i + 1}. ${st.name}`, height: 3.6 });
      const light = k.mesh(new THREE.SphereGeometry(0.28, 10, 8), k.mat('#3a3a3a', { emissive: '#000000' }), [0, 1.62, 0]);
      ped.add(light);
      return { ped, light };
    });
    const scroll = k.group(k.cyl(0.18, 0.18, 1.1, '#fff4d6', [0, 0, 0], 10));
    scroll.rotation.z = Math.PI / 2;
    scroll.position.set(-12, 1.8, -6);
    scroll.visible = false;
    add(scroll);

    // Map of Canada
    add(k.cyl(10, 10.5, 0.8, '#b7ab92', [0, 0, 8], 24));
    const map = canadaMap(k, { scale: 0.58, register });
    map.position.set(0, 0.8, 8);
    add(map);

    // Services street
    const flags = {};
    SERVICES.forEach((sv, i) => {
      const x = -24 + i * 6;
      const model = sv.id === 'oil'
        ? k.group(k.box(4, 0.3, 3, '#4a4a4a'), k.box(0.4, 2.6, 0.4, '#6b6b6b', [-1, 0, 0]), k.at(k.box(3.4, 0.35, 0.35, '#c9a227', [0, 0, 0]), 0, 2.6, 0), k.cyl(0.6, 0.6, 1.6, '#3a3d40', [1.2, 0, 0.6], 10))
        : k.building({ w: 4.6, d: 4, h: sv.id === 'hospital' || sv.id === 'bank' ? 5 : 3.6, color: sv.color, roof: '#6b4a3a', gable: sv.id !== 'hospital' && sv.id !== 'bank' && sv.id !== 'courts' });
      const signM = k.sign(sv.name, { width: 4.4, height: 0.9, symbol: sv.symbol, bg: '#fffaf0', fg: '#1a1410' });
      signM.position.set(0, sv.id === 'oil' ? 3.4 : 2.6, 2.06);
      const b = k.interactive(k.group(model, signM), { ringRadius: 3, hit: [5, 6, 5] });
      b.position.set(x, 0, 26);
      add(b);
      register(`svc:${sv.id}`, b, { label: sv.name, icon: sv.symbol, height: 6.5 });
      const f = k.flag('canada', { height: 3 });
      const fa = k.flag('alberta', { height: 3 });
      for (const fl of [f, fa]) {
        fl.visible = false;
        fl.position.set(x + 2.6, 0, 29);
        add(fl);
      }
      flags[sv.id] = { federal: f, provincial: fa };
    });

    // Riding office
    const office = k.interactive(k.group(k.building({ w: 7, d: 5, h: 3.6, color: '#c7b08a', roof: '#4f3a26' }), k.at(k.sign('Riding Office', { width: 4.6, height: 0.9, symbol: '🗺️' }), 0, 4.1, 2.6)), { ringRadius: 4, hit: [7, 6, 5] });
    office.position.set(-31, 0, 14);
    office.rotation.y = Math.PI / 2;
    add(office);
    register('riding-office', office, { label: 'Riding office', icon: '🗺️', height: 6.4 });
    const ballot = k.interactive(k.group(k.box(1, 0.9, 1, '#1f5ea8', [0, 0.8, 0]), k.box(1.4, 0.8, 1.2, '#6b4a2c'), k.box(0.5, 0.05, 0.08, '#111111', [0, 1.7, 0])), { ringRadius: 1.2, hit: [2, 2.4, 2] });
    ballot.position.set(-26, 0, 16);
    add(ballot);
    register('ballot-box', ballot, { label: 'Ballot box', icon: '🗳️', height: 2.6 });
    for (let i = 0; i < 4; i++) add(k.at(k.person(['#8a5cc2', '#d98c2b', '#2f5d8a', '#a12639'][i]), -26 + (i - 1.5) * 1.2, 0, 19.5));

    // Community square
    const hall = k.interactive(k.group(k.building({ w: 8, d: 5, h: 4.5, color: '#d7c7a6', roof: '#5b3a24' }), k.at(k.sign('Town Hall', { width: 4, height: 0.9, symbol: '🏘️' }), 0, 4.9, 2.6)), { ringRadius: 4.4, hit: [8, 7, 5] });
    hall.position.set(30, 0, 4);
    hall.rotation.y = -Math.PI / 2;
    add(hall);
    register('town-hall', hall, { label: 'Town hall', icon: '🏘️', height: 7.6 });
    const board = k.interactive(k.group(k.box(0.2, 2.6, 0.2, '#5b3a24', [-1.6, 0, 0]), k.box(0.2, 2.6, 0.2, '#5b3a24', [1.6, 0, 0]), k.at(k.sign(['Town notices', 'New oil and gas project'], { width: 3.4, height: 1.8, bg: '#c9a06b', fg: '#2b1b10' }), 0, 2, 0.12)), { ringRadius: 2, hit: [3.6, 3.4, 1.5] });
    board.position.set(24, 0, 10);
    board.rotation.y = -Math.PI / 3;
    add(board);
    register('notice-board', board, { label: 'Notice board', icon: '📌', height: 3.4 });
    const projects = k.interactive(k.group(
      k.box(7, 0.4, 3, '#b7ab92'),
      k.at(k.building({ w: 1.4, d: 1.2, h: 1, color: '#e0c39a', roof: '#7a3b2e', windows: false }), -2.6, 0.4, 0),
      k.at(k.building({ w: 1.4, d: 1.2, h: 1, color: '#f2f2f2', roof: '#a12639', gable: false, windows: false }), -0.9, 0.4, 0),
      k.at(k.building({ w: 1.4, d: 1.4, h: 0.8, color: '#9fb4c7', roof: '#5f6f7f', gable: false, windows: false }), 0.9, 0.4, 0),
      k.at(k.tree(0.45), 2.6, 0.4, 0),
      k.at(k.sign('One project for our community', { width: 6, height: 0.8 }), 0, 2.4, -1)), { ringRadius: 3.6, hit: [7, 3, 3] });
    projects.position.set(26, 0, 15);
    projects.rotation.y = -Math.PI / 2.5;
    add(projects);
    register('project-board', projects, { label: 'Community projects', icon: '🏗️', height: 3.2 });

    // Justice quarter: Supreme Court, the court ladder, the Charter and the Citizenship Act.
    const court = k.interactive(k.group(
      k.box(12, 6, 7, '#d8d2c4'),
      ...[-4.5, -2.25, 0, 2.25, 4.5].map((x) => k.cyl(0.35, 0.4, 5.2, '#efe9dc', [x, 0.4, 3.9], 10)),
      k.box(13, 0.4, 8.6, '#c9c1ad'),
      k.box(12.4, 1.2, 8, '#5f9e86', [0, 6, 0]),
      k.at(k.sign('Supreme Court of Canada', { width: 7, height: 1, symbol: '⚖️' }), 0, 6.6, 4.05)), { ringRadius: 7, hit: [13, 8, 9] });
    court.position.set(-36, 0, -18);
    add(court);
    register('court-supreme', court, { label: 'Supreme Court of Canada', icon: '⚖️', height: 8.6 });
    [['court-lower', 'Lower court', '1', 1.2, -42], ['court-appeal', 'Appeal court', '2', 2, -36.5]].forEach(([id, name, n, hgt, x]) => {
      const step = k.interactive(k.group(k.box(3.4, hgt, 3.4, '#b7ab92'), k.at(k.sign(name, { width: 3, height: 0.8, symbol: n === '1' ? '1️⃣' : '2️⃣' }), 0, hgt + 0.9, 1.6)), { ringRadius: 2.2, hit: [3.6, hgt + 2, 3.6] });
      step.position.set(x, 0, -8);
      add(step);
      register(id, step, { label: name, icon: n === '1' ? '1️⃣' : '2️⃣', height: hgt + 2.2 });
    });
    const charter = k.interactive(k.group(k.cyl(0.9, 1.1, 1.6, '#8c8577'), k.at(k.sign(['Canadian Charter of', 'Rights and Freedoms (1982)'], { width: 3.6, height: 2, symbol: '📜', bg: '#fff8e6', fg: '#1a1410', border: '#c9a227' }), 0, 2.8, 0)), { ringRadius: 2, hit: [3.8, 4.4, 2] });
    charter.position.set(-30.5, 0, -6);
    add(charter);
    register('charter', charter, { label: 'Charter of Rights and Freedoms', icon: '📜', height: 4.6 });
    const act = k.interactive(k.group(k.box(2.4, 1.2, 0.6, '#8c8577'), k.at(k.sign(['Canadian', 'Citizenship Act (1947)'], { width: 2.8, height: 1.4, symbol: '🛂', bg: '#fff8e6', fg: '#1a1410', border: '#c9a227' }), 0, 2.1, 0)), { ringRadius: 1.8, hit: [3, 3.4, 1.6] });
    act.position.set(-26.5, 0, -6);
    add(act);
    register('citizenship-act', act, { label: 'Canadian Citizenship Act (1947)', icon: '🛂', height: 3.4 });
    const cabinet = k.interactive(k.group(k.building({ w: 8, d: 6, h: 5, color: '#cfc4ab', roof: '#5f9e86', gable: false }), k.at(k.sign('Cabinet office', { width: 4.4, height: 0.9, symbol: '🗂️' }), 0, 4.2, 3.06)), { ringRadius: 4.6, hit: [8, 7, 6] });
    cabinet.position.set(33, 0, -16);
    add(cabinet);
    register('cabinet', cabinet, { label: 'Cabinet office', icon: '🗂️', height: 7 });

    // Scenery
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2;
      add(k.at(k.tree(1 + ((i * 7) % 5) / 10), Math.cos(a) * 52, 0, Math.sin(a) * 46 + 2));
    }
    for (const [x, z] of [[-6, 2], [6, 2], [-6, 18], [6, 18], [-20, -4], [20, -4]]) add(k.at(k.lamp(), x, 0, z));

    const guide = k.interactive(k.person('#1b6a4e'), { ringRadius: 1, hit: [1.4, 2.2, 1.4] });
    guide.position.set(3.5, 0, 16);
    add(guide);
    register('guide', guide, { label: 'Your guide', icon: '🧭', height: 2.5 });

    // Scene actions used by missions (3D responses to the student's choices).
    const rise = (obj) => {
      obj.visible = true;
      obj.position.y = -3;
      world.animate((dt) => {
        obj.position.y = Math.min(0, obj.position.y + dt * 4);
        return obj.position.y < 0;
      });
    };
    const actions = {
      raiseFlag(serviceId, level) {
        const f = flags[serviceId]?.[level];
        if (f && !f.visible) rise(f);
      },
      resetFlags() {
        for (const v of Object.values(flags)) v.federal.visible = v.provincial.visible = false;
        world.dirty = true;
      },
      lightStation(i) {
        const st = stationObjs[i];
        st.light.material = k.mat('#f2c94c', { emissive: '#f2c94c', emissiveIntensity: 1 });
        scroll.visible = true;
        const to = st.ped.position.x;
        world.animate((dt) => {
          scroll.position.x += Math.sign(to - scroll.position.x) * Math.min(Math.abs(to - scroll.position.x), dt * 8);
          return Math.abs(to - scroll.position.x) > 0.01;
        });
      },
      resetStations() {
        stationObjs.forEach((st) => (st.light.material = k.mat('#3a3a3a', { emissive: '#000000' })));
        scroll.visible = false;
        scroll.position.x = -12;
        world.dirty = true;
      },
    };

    const locations = {
      overview: { position: [0, 42, 52], target: [0, 0, -2] },
      'parliament-front': { position: [0, 9, -12], target: [0, 9, -36] },
      commons: { position: [-15, 7, -3], target: [-15, 0.5, -17] },
      senate: { position: [15, 7, -3], target: [15, 0.5, -18] },
      lawpath: { position: [0, 8, 7], target: [0, 1, -6] },
      chambers: { position: [0, 17, 12], target: [0, 0.5, -16] },
      map: { position: [0, 14, 22], target: [0, 0, 7] },
      services: { position: [0, 19, 64], target: [0, 1, 25] },
      riding: { position: [-15, 6, 26], target: [-28, 2, 15] },
      community: { position: [14, 7, 18], target: [27, 2, 8] },
      justice: { position: [-26, 9, 8], target: [-35, 2, -12] },
      cabinet: { position: [24, 7, 0], target: [33, 2, -15] },
    };
    return { locations, actions, bounds: { minX: -48, maxX: 46, minZ: -30, maxZ: 66 } };
  },
};
