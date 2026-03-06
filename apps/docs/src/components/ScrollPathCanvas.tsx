"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Spine — serpente du hero au footer ──────────────────────────────────────

const SPINE_PTS = [
  [ 1.5,  7.8,  0.4],
  [-0.5,  6.2, -0.3],
  [ 2.0,  4.6,  0.6],
  [-2.0,  3.1, -0.4],
  [ 1.5,  1.6,  0.5],
  [-2.5,  0.0, -0.2],
  [ 2.0, -1.6,  0.4],
  [-1.5, -3.1, -0.3],
  [ 2.5, -4.6,  0.6],
  [-1.0, -6.2, -0.4],
  [ 1.5, -7.8,  0.2],
].map(([x, y, z]) => new THREE.Vector3(x, y, z));

// ─── Offshoots — branches latérales, déclenchées par la progression du scroll ─

const OFFSHOOTS: Array<{
  t: number; // fraction de scroll où la branche apparaît
  pts: THREE.Vector3[];
}> = [
  {
    t: 0.06,
    pts: [[ 1.5,  7.8, 0.4], [ 3.8, 7.4, -0.3], [ 6.2, 8.0,  0.2], [ 8.0, 7.2, -0.5]],
  },
  {
    t: 0.18,
    pts: [[-0.5,  6.2,-0.3], [-3.2, 6.6,  0.4], [-6.0, 5.9, -0.2], [-8.0, 6.6,  0.3]],
  },
  {
    t: 0.30,
    pts: [[ 2.0,  4.6, 0.6], [ 4.6, 4.0, -0.4], [ 7.0, 4.8,  0.3]],
  },
  {
    t: 0.43,
    pts: [[-2.0,  3.1,-0.4], [-4.8, 3.6,  0.5], [-7.5, 2.9, -0.3], [-9.0, 3.6,  0.2]],
  },
  {
    t: 0.55,
    pts: [[ 1.5,  1.6, 0.5], [ 4.2, 1.1, -0.2], [ 6.5, 1.9,  0.4]],
  },
  {
    t: 0.65,
    pts: [[-2.5,  0.0,-0.2], [-5.2, 0.5,  0.5], [-8.0,-0.4, -0.3]],
  },
  {
    t: 0.75,
    pts: [[ 2.0, -1.6, 0.4], [ 4.8,-1.0, -0.3], [ 7.0,-2.1,  0.3]],
  },
  {
    t: 0.86,
    pts: [[-1.5, -3.1,-0.3], [-4.2,-2.6,  0.5], [-7.0,-3.6, -0.2]],
  },
].map(o => ({
  ...o,
  pts: (o.pts as [number, number, number][]).map(([x, y, z]) => new THREE.Vector3(x, y, z)),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MAIN_T = 280; // tubular segments spine
const MAIN_R = 5;   // radial segments spine
const OFF_T  = 55;  // tubular segments offshoot
const OFF_R  = 4;   // radial segments offshoot

function makeTube(
  pts: THREE.Vector3[],
  tubSeg: number,
  radius: number,
  radSeg: number
): THREE.TubeGeometry {
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(pts),
    tubSeg, radius, radSeg, false
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────────

function VineScene() {
  const groupRef = useRef<THREE.Group>(null);

  const { mainGeo, offGeos } = useMemo(() => {
    const mainGeo = makeTube(SPINE_PTS, MAIN_T, 0.018, MAIN_R);
    const offGeos = OFFSHOOTS.map(o => makeTube(o.pts, OFF_T, 0.011, OFF_R));
    mainGeo.setDrawRange(0, 0);
    offGeos.forEach(g => g.setDrawRange(0, 0));
    return { mainGeo, offGeos };
  }, []);

  useFrame(() => {
    const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
    const maxScroll = typeof document !== "undefined"
      ? Math.max(document.body.scrollHeight - window.innerHeight, 1)
      : 4000;

    const p = Math.min(scrollY / maxScroll, 1);

    if (groupRef.current) {
      groupRef.current.position.y = -scrollY * 0.0002;
    }

    // Spine — croît proportionnellement au scroll
    mainGeo.setDrawRange(0, Math.floor(p * MAIN_T) * MAIN_R * 6);

    // Offshoots — apparaissent quand le scroll dépasse leur seuil
    OFFSHOOTS.forEach((o, i) => {
      if (p < o.t) {
        offGeos[i].setDrawRange(0, 0);
      } else {
        const lp = Math.min((p - o.t) / 0.10, 1);
        offGeos[i].setDrawRange(0, Math.floor(lp * OFF_T) * OFF_R * 6);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* Spine — core lumineux */}
      <mesh geometry={mainGeo}>
        <meshBasicMaterial color="#c8f4ff" transparent opacity={0.82} depthWrite={false} />
      </mesh>
      {/* Spine — halo diffus */}
      <mesh geometry={mainGeo}>
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.28} depthWrite={false} />
      </mesh>

      {/* Offshoots */}
      {offGeos.map((geo, i) => (
        <group key={i}>
          <mesh geometry={geo}>
            <meshBasicMaterial color="#b8ecff" transparent opacity={0.70} depthWrite={false} />
          </mesh>
          <mesh geometry={geo}>
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.22} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

// Canvas positionné absolute dans un wrapper sticky — devient visible seulement
// quand <main> entre dans la viewport (après le hero).
export function ScrollPathCanvas() {
  return (
    <Canvas
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        pointerEvents: "none",
        mixBlendMode: "screen",
      }}
      camera={{ position: [0, 2, 16], fov: 55 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true }}
    >
      <VineScene />
    </Canvas>
  );
}
