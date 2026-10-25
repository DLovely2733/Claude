import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useVisible } from './useVisible';

// A short, looping replay of the simulated battle inside the zero-gravity
// battleroom. Purely illustrative of the student's own choice; it is always
// framed as a simulation, never as the novel's events.

import { soldierPath, type Replay } from './replayPaths';

export default function BattleReplay3D({ kind, reduced, accent }: { kind: Replay; reduced: boolean; accent: string }) {
  const [ref, visible] = useVisible<HTMLDivElement>();
  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0 }}>
      <Canvas camera={{ position: [3.4, 1.6, 3.2], fov: 45 }} dpr={[1, 1.5]} frameloop={reduced || !visible ? 'demand' : 'always'} gl={{ powerPreference: 'low-power' }} aria-hidden="true">
        <color attach="background" args={['#03060d']} />
        <ambientLight intensity={0.6} />
        <Room accent={accent} />
        <Soldiers kind={kind} reduced={reduced} accent={accent} />
        <LookAtCenter />
      </Canvas>
    </div>
  );
}

function LookAtCenter() {
  useFrame(({ camera }) => camera.lookAt(0, 0, 0));
  return null;
}

function Room({ accent }: { accent: string }) {
  return (
    <group>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(2.4, 2.4, 4)]} />
        <lineBasicMaterial color={accent} transparent opacity={0.6} />
      </lineSegments>
      <mesh position={[0, 0, -2]}><planeGeometry args={[0.7, 0.7]} /><meshBasicMaterial color="#ffb547" transparent opacity={0.6} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0, 2]}><planeGeometry args={[0.7, 0.7]} /><meshBasicMaterial color={accent} transparent opacity={0.4} side={THREE.DoubleSide} /></mesh>
    </group>
  );
}

function Soldiers({ kind, reduced, accent }: { kind: Replay; reduced: boolean; accent: string }) {
  const count = 18;
  const mine = useRef<THREE.InstancedMesh>(null);
  const theirs = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const start = useRef(performance.now());
  useFrame(({ invalidate }) => {
    // Six-second loop with a short hold at the end; reduced motion shows the final frame.
    const raw = ((performance.now() - start.current) / 6000) % 1.25;
    const t = reduced ? 1 : Math.min(raw, 1);
    for (const [mesh, team] of [[mine.current, 0], [theirs.current, 1]] as const) {
      if (!mesh) continue;
      for (let i = 0; i < count; i++) {
        const [x, y, z] = soldierPath(kind, team, i, t);
        dummy.position.set(x, y, z);
        // Frozen enemies dim in an overrun; frozen allies dim in a rushed fight.
        const frozen = (team === 1 && kind === 'overrun' && i % 3 === 0 && t > 0.6) || (team === 0 && kind === 'rushed' && i % 4 === 0 && t > 0.5);
        dummy.scale.setScalar(frozen ? 0.6 : 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
    if (reduced) invalidate();
  });
  return (
    <>
      <instancedMesh ref={mine} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshBasicMaterial color={accent} />
      </instancedMesh>
      <instancedMesh ref={theirs} args={[undefined, undefined, count]}>
        <sphereGeometry args={[0.07, 10, 10]} />
        <meshBasicMaterial color="#ffb547" />
      </instancedMesh>
    </>
  );
}
