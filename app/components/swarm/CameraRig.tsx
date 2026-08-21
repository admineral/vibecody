'use client'

import { useEffect, useRef, type ComponentRef, type MutableRefObject } from 'react'
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
  homePosition: [number, number, number]
  resetNonce?: number
}

export default function CameraRig({
  mode,
  followId,
  groupRefs,
  portrait = true,
  chipMode = false,
  homePosition,
  resetNonce = 0,
}: CameraRigProps) {
  const controls = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()
  const look = useRef(new Vector3())
  const desired = useRef(new Vector3())
  const cinematicAngle = useRef(0)

  useEffect(() => {
    if (!controls.current) return
    if (!resetNonce) {
      controls.current.target.set(0, chipMode ? 0.2 : 0.6, 0)
      return
    }
    camera.position.set(...homePosition)
    controls.current.target.set(0, chipMode ? 0.2 : 0.6, 0)
    controls.current.update()
  }, [resetNonce, camera, homePosition, chipMode])

  useFrame((_, delta) => {
    if (camera instanceof PerspectiveCamera) {
      const targetFov = chipMode ? (portrait ? 62 : 50) : portrait ? 68 : 52
      if (Math.abs(camera.fov - targetFov) > 0.1) {
        camera.fov = targetFov
        camera.updateProjectionMatrix()
      }
    }

    const ctrl = controls.current
    if (ctrl) {
      ctrl.enabled = mode !== 'cinematic'
    }

    const id = followId ?? 'lead'
    const target = groupRefs.current[id]

    if (mode === 'follow' && target && ctrl) {
      ctrl.target.lerp(target.position, 1 - Math.exp(-delta * 5.5))
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
      } else if (target) {
        const r = portrait ? 11 : 18
        desired.current.set(
          target.position.x + Math.cos(cinematicAngle.current) * r,
          target.position.y + (portrait ? 6.4 : 8),
          target.position.z + Math.sin(cinematicAngle.current) * r,
        )
        look.current.copy(target.position)
      } else {
        const r = 16
        desired.current.set(
          Math.cos(cinematicAngle.current) * r,
          9,
          Math.sin(cinematicAngle.current) * r,
        )
        look.current.set(0, 0.8, 0)
      }
      camera.position.lerp(desired.current, 1 - Math.exp(-delta * 1.6))
      camera.lookAt(look.current)
      if (ctrl) ctrl.target.lerp(look.current, 0.12)
    }
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan
      enableZoom
      enableRotate={mode !== 'cinematic'}
      enableDamping
      dampingFactor={0.1}
      rotateSpeed={portrait ? 1.15 : 0.9}
      zoomSpeed={0.85}
      panSpeed={0.7}
      minDistance={chipMode ? 6 : 2.6}
      maxDistance={chipMode ? 80 : 120}
      minPolarAngle={chipMode ? 0.08 : 0.12}
      maxPolarAngle={chipMode ? 1.35 : Math.PI / 2.08}
      screenSpacePanning
      touches={{ ONE: TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}
    />
  )
}
