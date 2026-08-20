'use client'

import { useRef, type ComponentRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Group, PerspectiveCamera, TOUCH, Vector3 } from 'three'
import type { CameraMode } from '@/app/lib/swarm/types'

type OrbitControlsImpl = ComponentRef<typeof OrbitControls>

interface CameraRigProps {
  mode: CameraMode
  followId: string | null
  groupRefs: MutableRefObject<Record<string, Group | null>>
  portrait?: boolean
  chipMode?: boolean
}

export default function CameraRig({ mode, followId, groupRefs, portrait = true, chipMode = false }: CameraRigProps) {
  const controls = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()
  const look = useRef(new Vector3())
  const desired = useRef(new Vector3())
  const cinematicAngle = useRef(0)

  useFrame((_, delta) => {
    if (camera instanceof PerspectiveCamera) {
      const targetFov = chipMode ? (portrait ? 62 : 50) : portrait ? 72 : 55
      if (Math.abs(camera.fov - targetFov) > 0.1) {
        camera.fov = targetFov
        camera.updateProjectionMatrix()
      }
    }

    const id = followId ?? 'lead'
    const target = groupRefs.current[id]
    if (!target) return

    if (mode === 'follow') {
      if (chipMode) {
        desired.current.set(0, 1.1, 3.2)
      } else {
        desired.current.set(0, portrait ? 3.4 : 1.4, portrait ? 6.2 : 5.2)
      }
      desired.current.applyQuaternion(target.quaternion)
      desired.current.add(target.position)
      camera.position.lerp(desired.current, 1 - Math.exp(-delta * 3.2))
      look.current.copy(target.position)
      if (chipMode) look.current.y += 0.1
      else if (portrait) look.current.y -= 1.6
      camera.lookAt(look.current)
      if (controls.current) {
        controls.current.target.lerp(target.position, 0.2)
      }
    }

    if (mode === 'cinematic') {
      cinematicAngle.current += delta * 0.22
      if (chipMode) {
        const r = 16
        desired.current.set(
          Math.cos(cinematicAngle.current) * r,
          9.5,
          Math.sin(cinematicAngle.current) * r,
        )
        look.current.set(0, 0.4, 0)
      } else {
        const r = portrait ? 9.5 : 18
        desired.current.set(
          target.position.x + Math.cos(cinematicAngle.current) * r,
          target.position.y + (portrait ? 7.2 : 8),
          target.position.z + Math.sin(cinematicAngle.current) * r,
        )
        look.current.copy(target.position)
        if (portrait) look.current.y -= 1.2
      }
      camera.position.lerp(desired.current, 1 - Math.exp(-delta * 1.6))
      camera.lookAt(look.current)
      if (controls.current) {
        controls.current.target.lerp(look.current, 0.12)
      }
    }
  })

  return (
    <OrbitControls
      ref={controls}
      enablePan={!portrait}
      enableZoom
      enableRotate={mode === 'orbit'}
      enableDamping
      dampingFactor={0.08}
      minDistance={chipMode ? 8 : portrait ? 6 : 4}
      maxDistance={chipMode ? 36 : portrait ? 28 : 48}
      minPolarAngle={chipMode ? 0.12 : portrait ? 0.55 : 0}
      maxPolarAngle={chipMode ? 1.15 : portrait ? 1.15 : Math.PI / 2.05}
      touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}
    />
  )
}
