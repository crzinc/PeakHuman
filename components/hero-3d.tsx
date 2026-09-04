"use client"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float } from "@react-three/drei"
import { useRef, useMemo } from "react"
import * as THREE from "three"

function Torus({ position = [0, 0, 0] as [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.15
      ref.current.rotation.y += delta * 0.22
    }
  })
  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
      <mesh ref={ref} position={position}>
        <torusGeometry args={[1.15, 0.33, 18, 48]} />
        <meshStandardMaterial color="#0A0A0A" roughness={0.35} metalness={0.12} />
      </mesh>
    </Float>
  )
}

function Ico({ position = [0, 0, 0] as [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.28
      ref.current.rotation.z += delta * 0.12
    }
  })
  return (
    <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.9}>
      <mesh ref={ref} position={position} scale={0.75}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#E7E5E4" roughness={0.9} metalness={0} wireframe />
      </mesh>
    </Float>
  )
}

function Dots() {
  const count = 48
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // eslint-disable-next-line react-hooks/purity
      p[i * 3] = (Math.random() - 0.5) * 8
      // eslint-disable-next-line react-hooks/purity
      p[i * 3 + 1] = (Math.random() - 0.5) * 5
      // eslint-disable-next-line react-hooks/purity
      p[i * 3 + 2] = (Math.random() - 0.5) * 4 - 1.5
    }
    return p
  }, [])
  const ref = useRef<THREE.Points>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.03
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#A8A29E" transparent opacity={0.55} sizeAttenuation />
    </points>
  )
}

export function Hero3D() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0.6, 5.8], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 4, 2]} intensity={1.1} />
        <directionalLight position={[-3, -2, -2]} intensity={0.35} color="#F5F5F3" />
        <Torus position={[0.35, 0.18, 0]} />
        <Ico position={[-1.05, -0.42, -0.7]} />
        <Dots />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#FCFCF9]/20 pointer-events-none" />
    </div>
  )
}
