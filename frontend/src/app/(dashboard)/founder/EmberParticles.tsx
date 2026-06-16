'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

function EmberPoints({ count, size, opacity, speed, color, spread }: {
  count: number; size: number; opacity: number; speed: number; color: string; spread: number
}) {
  const ref = useRef<THREE.Points>(null)

  const { geometry, speeds, drifts } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sp = new Float32Array(count)
    const dr = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * spread
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4
      sp[i] = speed * (0.5 + Math.random())
      dr[i] = (Math.random() - 0.5) * 0.008
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return { geometry: geo, speeds: sp, drifts: dr }
  }, [count, speed, spread])

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size,
        color,
        transparent: true,
        opacity,
        sizeAttenuation: true,
      }),
    [size, opacity, color]
  )

  useFrame(() => {
    if (!ref.current) return
    const attr = ref.current.geometry.attributes.position
    const arr = attr.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i * 3]     += drifts[i]
      arr[i * 3 + 1] += speeds[i]
      if (arr[i * 3 + 1] > 5) {
        arr[i * 3 + 1] = -5
        arr[i * 3]     = (Math.random() - 0.5) * spread
      }
    }
    attr.needsUpdate = true
  })

  return <points ref={ref} geometry={geometry} material={material} />
}

export default function EmberParticles({ className = '' }: { className?: string }) {
  return (
    <Canvas
      className={className}
      camera={{ position: [0, 0, 10], fov: 55 }}
      gl={{ alpha: true, antialias: false }}
    >
      {/* Camada 1: brasas pequenas e rápidas — laranjas */}
      <EmberPoints count={350} size={0.12} opacity={0.9} speed={0.018} color="#f97316" spread={16} />
      {/* Camada 2: brasas maiores e lentas — amarelo-âmbar, dão profundidade */}
      <EmberPoints count={100} size={0.22} opacity={0.6} speed={0.009} color="#fbbf24" spread={14} />
      {/* Camada 3: faíscas vermelhas no fundo */}
      <EmberPoints count={60}  size={0.08} opacity={0.75} speed={0.025} color="#ef4444" spread={12} />
    </Canvas>
  )
}
