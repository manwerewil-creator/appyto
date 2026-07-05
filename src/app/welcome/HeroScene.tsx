"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Torus, Icosahedron, Sphere, RoundedBox } from "@react-three/drei";
import type { Group } from "three";

// Slow-spinning group of abstract metallic/glass shapes behind the phone
// mockup. `spin={false}` (prefers-reduced-motion) freezes both the group
// rotation and each shape's individual float — the scene renders once and
// sits still, never a looping distraction.
function Shapes({ spin }: { spin: boolean }) {
  const group = useRef<Group>(null);
  useFrame((_, delta) => {
    if (!spin || !group.current) return;
    group.current.rotation.y += delta * 0.06;
    group.current.rotation.x += delta * 0.015;
  });

  return (
    <group ref={group}>
      <Float speed={spin ? 1.4 : 0} floatIntensity={spin ? 1.2 : 0} rotationIntensity={spin ? 0.6 : 0}>
        <Torus args={[1.1, 0.32, 32, 96]} position={[1.5, 0.7, -1.2]}>
          <meshPhysicalMaterial color="#159e8c" roughness={0.25} metalness={0.6} clearcoat={0.6} />
        </Torus>
      </Float>
      <Float speed={spin ? 1.1 : 0} floatIntensity={spin ? 1 : 0} rotationIntensity={spin ? 0.5 : 0}>
        <Icosahedron args={[0.85, 0]} position={[-1.7, -0.5, -0.6]}>
          <meshPhysicalMaterial color="#e7e5df" roughness={0.15} metalness={0.2} clearcoat={0.9} />
        </Icosahedron>
      </Float>
      <Float speed={spin ? 0.9 : 0} floatIntensity={spin ? 0.8 : 0} rotationIntensity={spin ? 0.4 : 0}>
        <Sphere args={[0.55, 48, 48]} position={[1.8, -1.4, -1.6]}>
          <meshPhysicalMaterial color="#82807a" roughness={0.3} metalness={0.7} clearcoat={0.4} />
        </Sphere>
      </Float>
      <Float speed={spin ? 1 : 0} floatIntensity={spin ? 0.9 : 0} rotationIntensity={spin ? 0.5 : 0}>
        <RoundedBox args={[0.9, 0.9, 0.9]} radius={0.18} smoothness={4} position={[-1.4, 1.5, -1.3]}>
          <meshPhysicalMaterial color="#159e8c" roughness={0.35} metalness={0.5} clearcoat={0.5} />
        </RoundedBox>
      </Float>
    </group>
  );
}

export default function HeroScene({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.55} />
      <pointLight position={[3, 3, 4]} intensity={1.4} color="#5fd6c4" />
      <pointLight position={[-3, -2, 2]} intensity={0.8} color="#ffffff" />
      <Suspense fallback={null}>
        <Shapes spin={!reduceMotion} />
      </Suspense>
    </Canvas>
  );
}
