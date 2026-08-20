'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AGENTS, BUILDINGS, buildingWorldPosition, heightFromLines, kindColor } from './cityData'
import { getMission } from './flows'
import type {
  AgentKind,
  AgentRuntime,
  BuildingState,
  CodeSlabState,
  FlowStep,
  TrailSegment,
  WorldSnapshot,
} from './types'

function cloneBuildings(): BuildingState[] {
  return BUILDINGS.map((b) => ({
    id: b.id,
    name: b.name,
    district: b.district,
    position: buildingWorldPosition(b),
    height: heightFromLines(b.lines),
    lines: b.lines,
    kind: b.kind,
    color: kindColor(b.kind),
    code: b.code,
    hasBug: Boolean(b.hasBug),
    beingWorked: false,
    spawned: !b.hidden,
    growth: 1,
  }))
}

function initialAgents(buildings: BuildingState[]): AgentRuntime[] {
  const visible = buildings.filter((b) => b.spawned)
  return AGENTS.map((agent, i) => {
    const home = visible[i % visible.length]
    const [x, , z] = home.position
    return {
      id: agent.id,
      status: 'Booting swarm…',
      targetId: home.id,
      position: [x, home.height + 2.2, z],
      kind: 'idle' as AgentKind,
      beam: false,
    }
  })
}

function resetWorld(missionId: string): WorldSnapshot {
  const buildings = cloneBuildings()
  return {
    time: 0,
    missionId,
    playing: true,
    buildings,
    agents: initialAgents(buildings),
    slabs: [],
    trails: [],
    log: ['[dev] simulateReadableStream(mission) — no API'],
    activeStep: null,
  }
}

function agentById(world: WorldSnapshot, id: FlowStep['agent']) {
  return world.agents.find((a) => a.id === id)
}

function buildingById(world: WorldSnapshot, id?: string) {
  if (!id) return undefined
  return world.buildings.find((b) => b.id === id)
}

function xyz(x: number, y: number, z: number): [number, number, number] {
  return [x, y, z]
}

function applyStep(world: WorldSnapshot, step: FlowStep) {
  const agent = agentById(world, step.agent)
  if (!agent) return

  world.buildings.forEach((b) => {
    b.beingWorked = false
  })

  const from = xyz(agent.position[0], agent.position[1], agent.position[2])
  const target = buildingById(world, step.targetId)
  if (target) {
    agent.targetId = target.id
    agent.position = xyz(target.position[0], target.height + 2.4, target.position[2])
    target.beingWorked = step.kind !== 'talk'
  }

  agent.kind = step.kind
  agent.status = step.message
  agent.beam = step.kind === 'scan' || step.kind === 'edit' || step.kind === 'fix' || step.kind === 'grow'

  if (step.spawnId) {
    const spawned = buildingById(world, step.spawnId)
    if (spawned) {
      spawned.spawned = true
      spawned.beingWorked = true
      spawned.growth = 0.08
      agent.targetId = spawned.id
      agent.position = xyz(spawned.position[0], spawned.height + 2.4, spawned.position[2])
    }
  }

  if (step.kind === 'fix' && target) {
    target.hasBug = false
  }

  if (step.code && target) {
    target.code = step.code
    upsertSlab(world, target, step.code, agent)
  } else if (target && (step.kind === 'scan' || step.kind === 'edit' || step.kind === 'grow')) {
    upsertSlab(world, target, target.code, agent)
  }

  if (typeof step.growBy === 'number' && target) {
    target.height += step.growBy
    target.lines += Math.round(step.growBy * 40)
    agent.position = xyz(target.position[0], target.height + 2.4, target.position[2])
  }

  const toolLine = step.tool ? `[dev] ${step.agent}.${step.tool}` : `[dev] ${step.agent}.${step.kind}()`
  world.log = [toolLine, `    ${step.message}`, ...world.log].slice(0, 18)
  world.activeStep = step

  if (step.kind === 'fly' || step.kind === 'link' || step.kind === 'scan') {
    const color = AGENTS.find((a) => a.id === step.agent)?.color ?? '#fff'
    const to = agent.position
    if (from[0] !== to[0] || from[2] !== to[2]) {
      world.trails = [
        {
          id: `${step.agent}-${world.time}`,
          from,
          to: xyz(to[0], to[1], to[2]),
          color,
          bornAt: world.time,
        },
        ...world.trails,
      ].slice(0, 48)
    }
  }

  if (step.kind === 'link' && step.linkTo) {
    const other = buildingById(world, step.linkTo)
    if (target && other) {
      const color = AGENTS.find((a) => a.id === step.agent)?.color ?? '#fff'
      world.trails = [
        {
          id: `link-${target.id}-${other.id}-${world.time}`,
          from: xyz(target.position[0], target.height + 0.4, target.position[2]),
          to: xyz(other.position[0], other.height + 0.4, other.position[2]),
          color,
          bornAt: world.time,
        },
        ...world.trails,
      ].slice(0, 48)
    }
  }
}

function upsertSlab(world: WorldSnapshot, building: BuildingState, code: string, agent: AgentRuntime) {
  const accent = AGENTS.find((a) => a.id === agent.id)?.color ?? '#a78bfa'
  const existing = world.slabs.find((s) => s.buildingId === building.id)
  const next: CodeSlabState = {
    buildingId: building.id,
    title: building.name,
    text: code,
    visible: true,
    accent,
  }
  if (existing) {
    Object.assign(existing, next)
  } else {
    world.slabs = [next, ...world.slabs].slice(0, 6)
  }
}

export function useSwarmEngine(missionId: string, speed: number, playing: boolean) {
  const worldRef = useRef<WorldSnapshot>(resetWorld(missionId))
  const appliedRef = useRef(new Set<number>())
  const [snapshot, setSnapshot] = useState<WorldSnapshot>(() => structuredClone(worldRef.current))

  const restart = useCallback((id = missionId) => {
    worldRef.current = resetWorld(id)
    appliedRef.current = new Set()
    setSnapshot(structuredClone(worldRef.current))
  }, [missionId])

  useEffect(() => {
    restart(missionId)
  }, [missionId, restart])

  useEffect(() => {
    let frame = 0
    let last = performance.now()
    let hudAt = 0

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const world = worldRef.current
      const mission = getMission(world.missionId)

      world.buildings.forEach((b) => {
        if (b.spawned && b.growth < 1) {
          b.growth = Math.min(1, b.growth + dt * 0.85)
        }
      })

      if (playing) {
        world.time += dt * 1000 * speed
        if (world.time > mission.duration) {
          if (mission.loop) {
            const trails = world.trails.slice(0, 24)
            const spawned = world.buildings.map((b) => ({ ...b, beingWorked: false }))
            worldRef.current = {
              ...resetWorld(world.missionId),
              buildings: spawned,
              trails,
            }
            appliedRef.current = new Set()
          } else {
            world.time = mission.duration
          }
        }

        const current = worldRef.current
        const steps = getMission(current.missionId).steps
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i]
          if (current.time >= step.at && !appliedRef.current.has(i)) {
            appliedRef.current.add(i)
            applyStep(current, step)
          }
        }
      }

      if (now - hudAt > 90) {
        hudAt = now
        setSnapshot(structuredClone(worldRef.current))
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, speed])

  const agents = useMemo(() => AGENTS, [])

  return { snapshot, restart, agents }
}
