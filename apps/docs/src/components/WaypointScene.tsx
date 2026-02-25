"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ─── Node definitions ────────────────────────────────────────────────────────

interface NodeDef {
  id: string;
  position: [number, number, number];
  color: string;
  radius: number;
  emissiveIntensity: number;
}

const NODE_DEFS: NodeDef[] = [
  { id: "root",  position: [0, 0, 0],       color: "#8b5cf6", radius: 0.22, emissiveIntensity: 1.5 },
  { id: "a1",    position: [-3, 2, -1],      color: "#00d4ff", radius: 0.14, emissiveIntensity: 0.8 },
  { id: "a2",    position: [-4.5, 3.5, -2],  color: "#00d4ff", radius: 0.14, emissiveIntensity: 0.8 },
  { id: "a3",    position: [-5.5, 5, -1],    color: "#22c55e", radius: 0.18, emissiveIntensity: 1.2 },
  { id: "b1",    position: [3, 2, -1],       color: "#00d4ff", radius: 0.14, emissiveIntensity: 0.8 },
  { id: "b2",    position: [4.5, 3.5, -2],   color: "#00d4ff", radius: 0.14, emissiveIntensity: 0.8 },
  { id: "b3",    position: [5.5, 5, -1],     color: "#22c55e", radius: 0.18, emissiveIntensity: 1.2 },
  { id: "c1",    position: [0, 3, 2],        color: "#00d4ff", radius: 0.14, emissiveIntensity: 0.8 },
  { id: "c2",    position: [1, 4.5, 3],      color: "#00d4ff", radius: 0.14, emissiveIntensity: 0.8 },
  { id: "c3",    position: [0, 6, 2],        color: "#22c55e", radius: 0.18, emissiveIntensity: 1.2 },
  { id: "leaf1", position: [-2, 1.5, 3],     color: "#00d4ff", radius: 0.10, emissiveIntensity: 0.6 },
  { id: "leaf2", position: [2, 1.5, 3],      color: "#00d4ff", radius: 0.10, emissiveIntensity: 0.6 },
];

const NODE_MAP = new Map(NODE_DEFS.map((n) => [n.id, n]));

// ─── Edges ────────────────────────────────────────────────────────────────────

const EDGE_PAIRS: [string, string][] = [
  ["root", "a1"],  ["a1", "a2"],   ["a2", "a3"],
  ["root", "b1"],  ["b1", "b2"],   ["b2", "b3"],
  ["root", "c1"],  ["c1", "c2"],   ["c2", "c3"],
  ["root", "leaf1"], ["root", "leaf2"],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCurve(from: NodeDef, to: NodeDef): THREE.CatmullRomCurve3 {
  const p0 = new THREE.Vector3(...from.position);
  const p3 = new THREE.Vector3(...to.position);
  const mid = p0.clone().lerp(p3, 0.5);
  const p1 = mid.clone().add(new THREE.Vector3(-0.3, 0.2, 0.3));
  const p2 = mid.clone().add(new THREE.Vector3(0.3, -0.2, -0.3));
  return new THREE.CatmullRomCurve3([p0, p1, p2, p3]);
}

function initStaggeredProgress(count: number): Float32Array {
  const arr = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    arr[i] = (i / count) % 1;
  }
  return arr;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NodeOrb({ position, color, radius, emissiveIntensity }: NodeDef) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>
      {/* Glow halo */}
      <mesh>
        <sphereGeometry args={[radius * 2.2, 16, 16]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

function EdgeTube({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const geometry = useMemo(
    () => new THREE.TubeGeometry(curve, 20, 0.02, 8, false),
    [curve]
  );
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color="#00d4ff" transparent opacity={0.35} />
    </mesh>
  );
}

// ─── Scene content ────────────────────────────────────────────────────────────

function SceneContent() {
  const curves = useMemo(
    () =>
      EDGE_PAIRS.map(([fromId, toId]) =>
        buildCurve(NODE_MAP.get(fromId)!, NODE_MAP.get(toId)!)
      ),
    []
  );

  const PARTICLES_PER_EDGE = 3;
  const totalParticles = EDGE_PAIRS.length * PARTICLES_PER_EDGE;

  const particleRefs = useRef<(THREE.Mesh | null)[]>(
    new Array(totalParticles).fill(null)
  );
  const progressRef = useRef<Float32Array>(
    initStaggeredProgress(totalParticles)
  );

  useFrame((_, delta) => {
    const speed = 0.18;
    for (let i = 0; i < totalParticles; i++) {
      progressRef.current[i] = (progressRef.current[i] + delta * speed) % 1;
      const mesh = particleRefs.current[i];
      if (!mesh) continue;
      const edgeIdx = Math.floor(i / PARTICLES_PER_EDGE);
      const curve = curves[edgeIdx];
      const pt = curve.getPoint(progressRef.current[i]);
      mesh.position.set(pt.x, pt.y, pt.z);
    }
  });

  return (
    <>
      {curves.map((curve, i) => (
        <EdgeTube key={i} curve={curve} />
      ))}
      {NODE_DEFS.map((n) => (
        <NodeOrb key={n.id} {...n} />
      ))}
      {Array.from({ length: totalParticles }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            particleRefs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="white" transparent opacity={0.9} />
        </mesh>
      ))}
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function WaypointScene() {
  return (
    <Canvas
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      camera={{ position: [0, 4, 14], fov: 55 }}
    >
      <color attach="background" args={["#050510"]} />
      <Stars radius={80} depth={50} count={4000} factor={4} saturation={0} fade />
      <ambientLight intensity={0.1} />
      <pointLight position={[10, 10, 5]} intensity={1} color="white" />
      <pointLight position={[0, 0, 3]} intensity={0.8} color="#00d4ff" />
      <pointLight position={[-5, -3, -5]} intensity={0.6} color="#8b5cf6" />
      <OrbitControls
        autoRotate
        autoRotateSpeed={0.4}
        target={[0, 3, 0]}
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
      />
      <SceneContent />
    </Canvas>
  );
}
