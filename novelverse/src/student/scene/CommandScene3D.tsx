import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { Hotspot } from '../../data/types';

// A stylized Battle School command deck. Four consoles hold the intel the
// student needs for the decision; the central hologram is the battleroom.
// The scene is purposeful: every interactive object is a source of evidence,
// and every one is mirrored by an accessible HTML button outside the canvas.

interface Props {
  hotspots: Hotspot[];
  active: string | null;
  seen: string[];
  onSelect: (id: string) => void;
  reduced: boolean;
  accent: string;
}

export default function CommandScene3D(props: Props) {
  return (
    <Canvas
      className="scene-canvas"
      camera={{ position: [0, 4.2, 9], fov: 45 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'low-power' }}
      aria-hidden="true"
    >
      <color attach="background" args={['#03060d']} />
      <fog attach="fog" args={['#03060d', 9, 22]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 6, 0]} intensity={30} color={props.accent} distance={18} />
      <pointLight position={[6, 3, 6]} intensity={12} color="#ffb547" distance={14} />
      <Deck accent={props.accent} />
      <Hologram accent={props.accent} reduced={props.reduced} />
      {props.hotspots.map((h, i) => (
        <Console key={h.id} index={i} count={props.hotspots.length} hotspot={h}
          active={props.active === h.id} seen={props.seen.includes(h.id)} onSelect={props.onSelect} accent={props.accent} reduced={props.reduced} />
      ))}
      <CameraRig active={props.active} hotspots={props.hotspots} reduced={props.reduced} />
      <Dust reduced={props.reduced} />
    </Canvas>
  );
}

const consolePos = (i: number, count: number) => {
  const a = (i / count) * Math.PI * 2 + Math.PI / 4;
  return new THREE.Vector3(Math.sin(a) * 4.2, 0, Math.cos(a) * 4.2);
};

function Deck({ accent }: { accent: string }) {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01}>
        <circleGeometry args={[7, 64]} />
        <meshStandardMaterial color="#071022" metalness={0.6} roughness={0.5} />
      </mesh>
      {[1.6, 3, 5.4, 6.9].map((r) => (
        <mesh key={r} rotation-x={-Math.PI / 2}>
          <ringGeometry args={[r, r + 0.03, 96]} />
          <meshBasicMaterial color={accent} transparent opacity={0.35} />
        </mesh>
      ))}
      <gridHelper args={[14, 28, '#123a5c', '#0b2238']} position-y={0.005} />
    </group>
  );
}

function Hologram({ accent, reduced }: { accent: string; reduced: boolean }) {
  const g = useRef<THREE.Group>(null);
  const soldiers = useMemo(
    () => Array.from({ length: 22 }, (_, i) => ({
      p: new THREE.Vector3((Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6),
      team: i % 2,
    })),
    [],
  );
  useFrame((_, dt) => {
    if (!g.current || reduced) return;
    g.current.rotation.y += dt * 0.25;
    g.current.rotation.x = Math.sin(performance.now() / 4000) * 0.15;
  });
  return (
    <group position={[0, 2, 0]}>
      <group ref={g}>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(2, 2, 2)]} />
          <lineBasicMaterial color={accent} transparent opacity={0.9} />
        </lineSegments>
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshBasicMaterial color={accent} transparent opacity={0.05} side={THREE.DoubleSide} />
        </mesh>
        {soldiers.map((s, i) => (
          <mesh key={i} position={s.p}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color={s.team ? '#ffb547' : accent} />
          </mesh>
        ))}
        {/* the gates on opposite walls */}
        <mesh position={[0, 0, 1.01]}><planeGeometry args={[0.5, 0.5]} /><meshBasicMaterial color="#ffb547" transparent opacity={0.5} side={THREE.DoubleSide} /></mesh>
        <mesh position={[0, 0, -1.01]}><planeGeometry args={[0.5, 0.5]} /><meshBasicMaterial color={accent} transparent opacity={0.5} side={THREE.DoubleSide} /></mesh>
      </group>
      <mesh position-y={-1.9} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[1.1, 48]} />
        <meshBasicMaterial color={accent} transparent opacity={0.18} />
      </mesh>
      <mesh position-y={-0.95}>
        <cylinderGeometry args={[0.02, 1.1, 1.9, 48, 1, true]} />
        <meshBasicMaterial color={accent} transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Console({ index, count, hotspot, active, seen, onSelect, accent, reduced }: {
  index: number; count: number; hotspot: Hotspot; active: boolean; seen: boolean; onSelect: (id: string) => void; accent: string; reduced: boolean;
}) {
  const pos = useMemo(() => consolePos(index, count), [index, count]);
  const [hover, setHover] = useState(false);
  const screen = useRef<THREE.Mesh>(null);
  const beacon = useRef<THREE.Mesh>(null);
  const color = active ? '#ffe066' : seen ? '#6dffc0' : accent;
  useFrame(() => {
    const t = performance.now() / 1000;
    if (beacon.current) {
      beacon.current.position.y = 2.15 + (reduced ? 0 : Math.sin(t * 2 + index) * 0.08);
      beacon.current.rotation.y = reduced ? 0 : t;
    }
    if (screen.current) {
      const m = screen.current.material as THREE.MeshBasicMaterial;
      m.opacity = (hover || active ? 0.95 : 0.6) + (reduced ? 0 : Math.sin(t * 3 + index) * 0.05);
    }
  });
  const facing = Math.atan2(-pos.x, -pos.z);
  return (
    <group position={pos} rotation-y={facing}
      onClick={(e) => { e.stopPropagation(); onSelect(hotspot.id); }}
      onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHover(false); document.body.style.cursor = ''; }}>
      <mesh position-y={0.5}>
        <boxGeometry args={[1.2, 1, 0.6]} />
        <meshStandardMaterial color="#0e1a33" metalness={0.7} roughness={0.35} emissive={color} emissiveIntensity={hover || active ? 0.25 : 0.06} />
      </mesh>
      <mesh ref={screen} position={[0, 1.35, 0.05]} rotation-x={-0.35}>
        <planeGeometry args={[1.1, 0.7]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={beacon} position-y={2.15}>
        <octahedronGeometry args={[0.16]} />
        <meshBasicMaterial color={color} wireframe />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.01}>
        <ringGeometry args={[0.8, 0.86, 48]} />
        <meshBasicMaterial color={color} transparent opacity={hover || active ? 0.9 : 0.35} />
      </mesh>
    </group>
  );
}

function CameraRig({ active, hotspots, reduced }: { active: string | null; hotspots: Hotspot[]; reduced: boolean }) {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(0, 1.4, 0));
  useFrame((_, dt) => {
    const idx = hotspots.findIndex((h) => h.id === active);
    const t = performance.now() / 1000;
    let target: THREE.Vector3;
    let focus: THREE.Vector3;
    if (idx >= 0) {
      const p = consolePos(idx, hotspots.length);
      target = p.clone().normalize().multiplyScalar(-1).multiplyScalar(2.5).add(new THREE.Vector3(0, 3.2, 0));
      focus = p.clone().add(new THREE.Vector3(0, 1.2, 0));
    } else {
      const a = reduced ? 0.6 : t * 0.07;
      target = new THREE.Vector3(Math.sin(a) * 9, 4.2, Math.cos(a) * 9);
      focus = new THREE.Vector3(0, 1.4, 0);
    }
    const k = reduced ? 1 : 1 - Math.exp(-dt * 2.2);
    camera.position.lerp(target, k);
    look.current.lerp(focus, k);
    camera.lookAt(look.current);
  });
  return null;
}

function Dust({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(400 * 3);
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] = (Math.random() - 0.5) * 18;
      arr[i + 1] = Math.random() * 7;
      arr[i + 2] = (Math.random() - 0.5) * 18;
    }
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  useFrame((_, dt) => {
    if (ref.current && !reduced) ref.current.rotation.y += dt * 0.01;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.035} color="#9fd8ff" transparent opacity={0.55} />
    </points>
  );
}
