// Shared scene pieces.

// Stylized tile map of Canada: rough relative positions, NOT to scale or shape.
export const PROVINCES = [
  { id: 'YT', name: 'Yukon', x: -10, z: -5.5, w: 3, d: 4, territory: true },
  { id: 'NT', name: 'Northwest Territories', x: -6, z: -5.5, w: 4.6, d: 4, territory: true },
  { id: 'NU', name: 'Nunavut', x: -0.5, z: -6, w: 6, d: 5, territory: true },
  { id: 'BC', name: 'British Columbia', x: -10.5, z: 0.5, w: 3.4, d: 5 },
  { id: 'AB', name: 'Alberta', x: -7, z: 0.5, w: 3.2, d: 4.6 },
  { id: 'SK', name: 'Saskatchewan', x: -3.7, z: 0.5, w: 3.2, d: 4.6 },
  { id: 'MB', name: 'Manitoba', x: -0.4, z: 0.3, w: 3.2, d: 5 },
  { id: 'ON', name: 'Ontario', x: 3.6, z: 1.6, w: 4.4, d: 5.2 },
  { id: 'QC', name: 'Quebec', x: 8.4, z: -0.6, w: 4.6, d: 6 },
  { id: 'NL', name: 'Newfoundland and Labrador', x: 12.6, z: -2.5, w: 2.8, d: 3.2 },
  { id: 'NB', name: 'New Brunswick', x: 9.8, z: 3.6, w: 1.6, d: 1.6 },
  { id: 'PE', name: 'Prince Edward Island', x: 11.4, z: 3.0, w: 1.0, d: 0.8 },
  { id: 'NS', name: 'Nova Scotia', x: 12.1, z: 4.3, w: 2.0, d: 1.2 },
];

const COLORS = ['#7fb38f', '#9cc48a', '#c8d38a', '#e0c77e', '#d9a46a', '#b9a3d1', '#8fb4d9'];

/** Build the tile map. If `register` is given, every tile becomes selectable. */
export function canadaMap(k, { scale = 1, register, prefix = 'prov:' } = {}) {
  const g = k.group();
  const base = k.box(30 * scale, 0.5, 15 * scale, '#2f5f7a', [0, 0, 0]);
  g.add(base);
  PROVINCES.forEach((p, i) => {
    const color = p.id === 'AB' ? '#e0b44a' : p.territory ? '#cfe3e8' : COLORS[i % COLORS.length];
    const tile = k.box(p.w * scale * 0.95, 0.6 + (p.territory ? 0 : 0.2), p.d * scale * 0.95, color, [p.x * scale, 0.5, p.z * scale]);
    if (register) {
      const it = k.interactive(tile, { ringRadius: Math.max(p.w, p.d) * scale * 0.6, hit: [p.w * scale, 1.6, p.d * scale] });
      it.position.set(p.x * scale, 0.5, p.z * scale);
      tile.position.set(0, 0, 0);
      g.add(it);
      register(`${prefix}${p.id}`, it, { label: p.name, height: 1.4 });
    } else g.add(tile);
  });
  // Ottawa marker (Parliament) in Ontario.
  const star = k.cone(0.35 * scale, 0.9 * scale, '#d52b1e', [6.4 * scale, 1.3, 2.4 * scale], 5);
  g.add(star);
  return g;
}

export function lakeAndHills(k, THREE) {
  const lake = new THREE.Mesh(new THREE.CircleGeometry(28, 24), k.mat('#5aa0c8', { roughness: 0.3 }));
  lake.rotation.x = -Math.PI / 2;
  lake.position.set(70, 0.02, -50);
  return k.group(lake, k.mountains(120, 20));
}
