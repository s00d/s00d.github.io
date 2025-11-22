import { MathUtils } from './math'
import { BHState } from '../types'
import type { Entity } from '../entities/Entity'
import type { Ship } from '../entities/Ship'
import type { BlackHole } from '../entities/BlackHole'
import { SHIP_STATE } from '../constants/states'

export class Navigator {
  static getAvoidanceVector(entity: Entity, obstacles: readonly Entity[], separationDist: number): {x: number, y: number} {
    let pushX = 0
    let pushY = 0
    const separationDistSq = separationDist * separationDist
    
    for (const obs of obstacles) {
      if (obs === entity) continue
      const dx = obs.x - entity.x
      const dy = obs.y - entity.y
      const dSq = dx * dx + dy * dy
      
      if (dSq < separationDistSq && dSq > 0) {
        const d = Math.sqrt(dSq) // Вычисляем только если нужно
        const force = (1 - d / separationDist)
        pushX -= (dx / d) * force
        pushY -= (dy / d) * force
      }
    }
    return {x: pushX, y: pushY}
  }

  static getPathToTarget(ship: Ship, target: {x: number, y: number}, bh: BlackHole): number {
    const angleToTarget = MathUtils.angle(ship, target)

    // Если паника - просто бежим от дыры
    if (ship.state === SHIP_STATE.PANIC) return MathUtils.angle(bh, ship)

    // Проверка на Черную Дыру по курсу (оптимизировано через distSq)
    const distToBHSq = MathUtils.distSq(ship, bh)
    const distToTargetSq = MathUtils.distSq(ship, target)
    const angleToBH = MathUtils.angle(ship, bh)
    const angleDiff = Math.abs(MathUtils.normalizeAngle(angleToTarget - angleToBH))

    // Если дыра ближе чем цель и находится прямо по курсу (~45 град)
    const maxDistSq = 500 * 500
    if (bh.state !== BHState.EXPLODING && distToBHSq < distToTargetSq && angleDiff < 0.8 && distToBHSq < maxDistSq) {
      // Огибаем
      const avoidDir = MathUtils.normalizeAngle(angleToBH - ship.angle) > 0 ? -1 : 1
      return angleToBH + (Math.PI / 2) * avoidDir
    }

    return angleToTarget
  }
}

