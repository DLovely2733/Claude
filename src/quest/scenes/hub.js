// The hub: a plaza with a map of Canada at its centre and a gateway to each
// of the five curriculum worlds.

import { WORLDS, WORLD_STATUS } from '../worlds.js';
import { canadaMap, lakeAndHills } from './common.js';

export const HUB_SCENE = {
  id: 'hub',
  sky: '#cfe3f0',
  build({ THREE, kit: k, add, register }) {
    add(k.ground(400, '#8fbf7a'));
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(27, 40), k.mat('#d9d1bf'));
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = 0.03;
    add(plaza);
    add(lakeAndHills(k, THREE));

    const platform = k.cyl(11, 11.5, 0.8, '#b7ab92', [0, 0, 0], 24);
    add(platform);
    const map = canadaMap(k, { scale: 0.62 });
    map.position.set(0, 0.8, 0);
    add(map);
    const title = k.sign('CANADA QUEST', { width: 10, height: 1.4, bg: '#13201a', fg: '#f2c94c', border: '#c9a227' });
    title.position.set(0, 5.2, -6);
    add(title);
    add(k.at(k.flag('canada', { height: 7 }), -2.5, 0.8, -6.4));
    add(k.at(k.flag('alberta', { height: 6 }), 2.5, 0.8, -6.4));

    const locations = { overview: { position: [0, 24, 42], target: [0, 2, -4] } };
    const radius = 24;
    WORLDS.forEach((w, i) => {
      const a = Math.PI * (0.15 + (i / (WORLDS.length - 1)) * 0.7) + Math.PI; // arc behind the map
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius + 4;
      const open = w.status === 'playable';
      const gate = k.group(
        k.box(1.2, 7, 1.2, w.color, [-3, 0, 0]),
        k.box(1.2, 7, 1.2, w.color, [3, 0, 0]),
        k.box(8, 1.4, 1.6, w.color, [0, 7, 0]),
        k.at(k.sign(w.name, { width: 7.4, height: 1.2, symbol: w.icon, bg: '#fffaf0', fg: '#1a1410' }), 0, 7.7, 0.85),
        k.at(k.sign(WORLD_STATUS[w.status].label, { width: 3, height: 0.7, bg: open ? '#1b6a4e' : '#8a5a00' }), 0, 6.1, 0.9),
        open ? k.mesh(new THREE.PlaneGeometry(4.8, 6.4), k.mat('#bfe6d3', { emissive: '#7fd1a8', emissiveIntensity: 0.55, transparent: true, opacity: 0.7, side: THREE.DoubleSide }), [0, 3.2, 0]) : k.box(4.8, 0.3, 0.3, '#5b4630', [0, 3, 0])
      );
      const it = k.interactive(gate, { ringRadius: 4.6, hit: [8, 9, 3] });
      it.position.set(x, 0, z);
      it.lookAt(0, 0, 4);
      add(it);
      register(`portal:${w.id}`, it, { label: w.name, icon: w.icon, height: i % 2 ? 11.2 : 9.4 });
      const dir = new THREE.Vector3(-x, 0, 4 - z).normalize();
      locations[`portal:${w.id}`] = { position: [x + dir.x * 16, 6, z + dir.z * 16], target: [x, 3.5, z] };
    });

    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      add(k.at(k.tree(1 + ((i * 7) % 5) / 10), Math.cos(a) * 34, 0, Math.sin(a) * 34 + 4));
    }
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.2;
      add(k.at(k.lamp(), Math.cos(a) * 14, 0, Math.sin(a) * 14));
    }
    // Guide stands by the map.
    const guide = k.interactive(k.person('#1b6a4e'), { ringRadius: 1, hit: [1.4, 2.2, 1.4] });
    guide.position.set(7, 0.8, 7);
    add(guide);
    register('guide', guide, { label: 'Your guide', icon: '🧭', height: 2.5 });

    return { locations, bounds: { minX: -32, maxX: 32, minZ: -30, maxZ: 36 } };
  },
};
