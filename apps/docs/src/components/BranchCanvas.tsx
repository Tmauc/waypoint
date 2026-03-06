"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Seeded LCG RNG ──────────────────────────────────────────────────────────

function createRNG(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = ((s * 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface BranchDef {
  from: [number, number, number];
  to: [number, number, number];
  level: number;
}

interface NodeDef {
  pos: [number, number, number];
  level: number;
}

// ─── Central fractal tree ─────────────────────────────────────────────────────

function buildTree(): { branches: BranchDef[]; nodes: NodeDef[] } {
  const rng = createRNG(42);
  const branches: BranchDef[] = [];
  const nodes: NodeDef[] = [];

  nodes.push({ pos: [0, 9, 0], level: 0 });

  const grow = (
    pos: [number, number, number],
    angle: number,
    level: number,
    len: number
  ) => {
    if (level >= 4) return;
    const spreads =
      level === 0 ? [-0.9, 0, 0.9]
      : level === 1 ? [-0.6, 0.6]
      : level === 2 ? [-0.45, 0.45]
      :               [-0.33, 0.33];

    for (const sp of spreads) {
      const a = angle + sp;
      const end: [number, number, number] = [
        pos[0] + Math.sin(a) * len,
        pos[1] - Math.cos(a) * len,
        pos[2] + (rng() * 2 - 1) * 0.25,
      ];
      branches.push({ from: pos, to: end, level });
      nodes.push({ pos: end, level: level + 1 });
      grow(end, a, level + 1, len * 0.65);
    }
  };

  grow([0, 9, 0], 0, 0, 3.2);
  return { branches, nodes };
}

// ─── Side clusters (8 mini-trees on left & right edges) ───────────────────────

function buildSideClusters(): { branches: BranchDef[]; nodes: NodeDef[] } {
  const rng = createRNG(137);
  const branches: BranchDef[] = [];
  const nodes: NodeDef[] = [];

  // Each cluster: starting pos, initial angle (from -Y axis, sin=right), startLevel, initial length
  // Left side (negative x) → angle slightly positive = grows right-ish + down
  // Right side (positive x) → angle slightly negative = grows left-ish + down
  const clusters: Array<{
    pos: [number, number, number];
    angle: number;
    startLevel: number;
    len: number;
  }> = [
    // ── Left side ──────────────────────────────────────────────────
    { pos: [-11,  8.5, -1.5], angle:  0.50, startLevel: 1, len: 2.6 },
    { pos: [-13,  3.0,  2.0], angle:  0.35, startLevel: 1, len: 2.3 },
    { pos: [-12, -3.5, -2.0], angle:  0.60, startLevel: 2, len: 2.0 },
    { pos: [-10,-10.5,  1.5], angle:  0.45, startLevel: 2, len: 1.8 },

    // ── Right side ─────────────────────────────────────────────────
    { pos: [ 11,  7.0,  2.0], angle: -0.50, startLevel: 1, len: 2.6 },
    { pos: [ 13,  1.5, -1.5], angle: -0.35, startLevel: 1, len: 2.3 },
    { pos: [ 12, -5.0,  1.5], angle: -0.60, startLevel: 2, len: 2.0 },
    { pos: [ 10,-11.5, -2.0], angle: -0.45, startLevel: 2, len: 1.8 },
  ];

  for (const { pos, angle, startLevel, len } of clusters) {
    nodes.push({ pos, level: startLevel });

    const grow = (
      p: [number, number, number],
      a: number,
      level: number,
      l: number
    ) => {
      if (level >= 4) return;
      // Slightly asymmetric spread for organic feel
      const spreads =
        level <= 1 ? [-0.65, 0.55]
        : level === 2 ? [-0.50, 0.42]
        :               [-0.37, 0.30];

      for (const sp of spreads) {
        const na = a + sp;
        const end: [number, number, number] = [
          p[0] + Math.sin(na) * l,
          p[1] - Math.cos(na) * l,
          p[2] + (rng() * 2 - 1) * 0.30,
        ];
        branches.push({ from: p, to: end, level });
        nodes.push({ pos: end, level: level + 1 });
        grow(end, na, level + 1, l * 0.65);
      }
    };

    grow(pos, angle, startLevel, len);
  }

  return { branches, nodes };
}

// ─── Combine all geometry (module-level, runs once) ───────────────────────────

const TREE = buildTree();
const SIDE = buildSideClusters();

const ALL_BRANCHES = [...TREE.branches, ...SIDE.branches];
const ALL_NODES    = [...TREE.nodes,    ...SIDE.nodes   ];

// ─── Level config ─────────────────────────────────────────────────────────────

const CFG = [
  { color: "#8b5cf6", tubeR: 0.022, nodeR: 0.22, opacity: 0.55 },
  { color: "#7c3aed", tubeR: 0.017, nodeR: 0.16, opacity: 0.47 },
  { color: "#00d4ff", tubeR: 0.013, nodeR: 0.12, opacity: 0.40 },
  { color: "#0ea5e9", tubeR: 0.009, nodeR: 0.08, opacity: 0.34 },
  { color: "#22c55e", tubeR: 0.007, nodeR: 0.06, opacity: 0.28 },
];

// ─── Branch tube ─────────────────────────────────────────────────────────────

function BranchTube({ branch }: { branch: BranchDef }) {
  const cfg = CFG[branch.level];
  const geo = useMemo(() => {
    const p0 = new THREE.Vector3(...branch.from);
    const p1 = new THREE.Vector3(...branch.to);
    const mid = p0.clone().lerp(p1, 0.5);
    const curve = new THREE.CatmullRomCurve3([
      p0,
      mid.clone().add(new THREE.Vector3(-0.08, 0.04, 0.08)),
      mid.clone().add(new THREE.Vector3(0.08, -0.04, -0.08)),
      p1,
    ]);
    return new THREE.TubeGeometry(curve, 10, cfg.tubeR, 5, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <mesh geometry={geo}>
      <meshBasicMaterial color={cfg.color} transparent opacity={cfg.opacity} />
    </mesh>
  );
}

// ─── Node orb ────────────────────────────────────────────────────────────────

function NodeOrb({ pos, level }: { pos: [number, number, number]; level: number }) {
  const cfg = CFG[level];
  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[cfg.nodeR, 14, 14]} />
        <meshStandardMaterial
          color={cfg.color}
          emissive={cfg.color}
          emissiveIntensity={1.2}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[cfg.nodeR * 1.6, 8, 8]} />
        <meshBasicMaterial color={cfg.color} transparent opacity={0.10} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[cfg.nodeR * 2.8, 8, 8]} />
        <meshBasicMaterial color={cfg.color} transparent opacity={0.05} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

// ─── Scene content ────────────────────────────────────────────────────────────

const PPB = 4;
const TOTAL_P = ALL_BRANCHES.length * PPB;

function SceneContent() {
  const groupRef = useRef<THREE.Group>(null);
  const pRefs = useRef<(THREE.Mesh | null)[]>(new Array(TOTAL_P).fill(null));
  const prog = useRef<Float32Array>(
    (() => {
      const a = new Float32Array(TOTAL_P);
      for (let i = 0; i < TOTAL_P; i++) a[i] = (i % PPB) / PPB;
      return a;
    })()
  );

  const curves = useMemo(
    () =>
      ALL_BRANCHES.map((b) => {
        const p0 = new THREE.Vector3(...b.from);
        const p1 = new THREE.Vector3(...b.to);
        const mid = p0.clone().lerp(p1, 0.5);
        return new THREE.CatmullRomCurve3([
          p0,
          mid.clone().add(new THREE.Vector3(-0.08, 0.04, 0.08)),
          mid.clone().add(new THREE.Vector3(0.08, -0.04, -0.08)),
          p1,
        ]);
      }),
    []
  );

  useFrame(({ clock }, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.07) * 0.18;
      groupRef.current.position.y =
        -(typeof window !== "undefined" ? window.scrollY : 0) * 0.0002;
    }
    for (let i = 0; i < TOTAL_P; i++) {
      prog.current[i] = (prog.current[i] + delta * 0.12) % 1;
      const mesh = pRefs.current[i];
      if (!mesh) continue;
      const pt = curves[Math.floor(i / PPB)].getPoint(prog.current[i]);
      mesh.position.copy(pt);
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 6, 8]}   intensity={0.8} color="#8b5cf6" />
      <pointLight position={[6, 0, 5]}   intensity={0.5} color="#00d4ff" />
      <pointLight position={[-8, 2, 4]}  intensity={0.4} color="#7c3aed" />
      <pointLight position={[ 8, 2, 4]}  intensity={0.4} color="#0ea5e9" />

      {ALL_BRANCHES.map((b, i) => (
        <BranchTube key={i} branch={b} />
      ))}

      {ALL_NODES.map((n, i) => (
        <NodeOrb key={i} pos={n.pos} level={n.level} />
      ))}

      {Array.from({ length: TOTAL_P }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => { pRefs.current[i] = el; }}
        >
          <sphereGeometry args={[0.032, 5, 5]} />
          <meshBasicMaterial color="white" transparent opacity={0.80} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function BranchCanvas() {
  return (
    <Canvas
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
      camera={{ position: [0, 2, 16], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true }}
    >
      <SceneContent />
    </Canvas>
  );
}
