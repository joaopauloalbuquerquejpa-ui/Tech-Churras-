'use client'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

function EmberPoints() {
  const ref = useRef<THREE.Points>(null)
  const count = 180

  const { geometry, speeds, drifts } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sp = new Float32Array(count)
    const dr = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 14
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4
      sp[i] = 0.012 + Math.random() * 0.022
      dr[i] = (Math.random() - 0.5) * 0.006
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return { geometry: geo, speeds: sp, drifts: dr }
  }, [])

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.09,
        color: '#f97316',
        transparent: true,
        opacity: 0.65,
        sizeAttenuation: true,
      }),
    []
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
        arr[i * 3]     = (Math.random() - 0.5) * 14
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
      <EmberPoints />
    </Canvas>
  )
}
