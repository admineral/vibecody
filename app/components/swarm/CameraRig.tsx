'use client'

import { useRef, type ComponentRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Group, TOUCH, Vector3 } from 'three'
import type { CameraMode } from '@/app/lib/swarm/types'

type OrbitControlsImpl = ComponentRef<typeof OrbitControls>

interface CameraRigProps {
  mode: CameraMode
  followId: string | null
  groupRefs: MutableRefObject<Record<string, Group | null>>
}

export default function CameraRig({ mode, followId, groupRefs }: CameraRigProps) {
  const controls = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()
  const look = useRef(new Vector3())
  const desired = useRef(new Vector3())
  const cinematicAngle = useRef(0)

  useFrame((_, delta) => {
    const id = followId ?? 'lead'
    const target = groupRefs.current[id]
    if (!target) return

    if (mode === 'follow') {
      desired.current.set(0, 1.4, 5.2)
      desired.current.applyQuaternion(target.quaternion)
      desired.current.add(target.position)
      camera.position.lerp(desired.current, 1 - Math.exp(-delta * 3.2))
      look.current.copy(target.position)
      camera.lookAt(look.current)
      if (controls.current) {
        controls.current.target.lerp(target.position, 0.2)
      }
    }

    if (mode === 'cinematic') {
      cinematicAngle.current += delta * 0.22
      const r = 18
      desired.current.set(
        target.position.x + Math.cos(cinematicAngle.current) * r,
        target.position.y + 8,
        target.position.z + Math.sin(cinematicAngle.current) * r,
      )
      camera.position.lerp(desired.current, 1 - Math.exp(-delta * 1.6))
      look.current.copy(target.position)
      camera.lookAt(look.current)
      if (controls.current) {
        controls.current.target.lerp(target.position, 0.12)
      }
    }
  })

  return (
    <OrbitControls
      ref={controls}
      enablePan
      enableZoom
      enableRotate={mode === 'orbit'}
      enableDamping
      dampingFactor={0.08}
      minDistance={4}
      maxDistance={48}
      maxPolarAngle={Math.PI / 2.05}
      touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}
    />
  )
}
