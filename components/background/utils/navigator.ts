import { MathUtils } from './math'
import { BHState } from '../types'
import type { Entity } from '../entities/Entity'
import type { Ship } from '../entities/Ship'
import type { BlackHole } from '../entities/BlackHole'
import { SHIP_STATE } from '../constants/states'

export class Navigator {
  static getAvoidanceVector(entity: Entity, obstacles: Entity[], separationDist: number): {x: number, y: number} {
    let pushX = 0
    let pushY = 0
    for (const obs of obstacles) {
      if (obs === entity) continue
      const d = MathUtils.dist(entity, obs)
      if (d < separationDist && d > 0) {
        const force = (1 - d / separationDist)
        pushX -= ((obs.x - entity.x) / d) * force
        pushY -= ((obs.y - entity.y) / d) * force
      }
    }
    return {x: pushX, y: pushY}
  }

  static getPathToTarget(ship: Ship, target: {x: number, y: number}, bh: BlackHole): number {
    const angleToTarget = MathUtils.angle(ship, target)

    // Если паника - просто бежим от дыры
    if (ship.state === SHIP_STATE.PANIC) return MathUtils.angle(bh, ship)

    // Проверка на Черную Дыру по курсу
    const distToBH = MathUtils.dist(ship, bh)
    const distToTarget = MathUtils.dist(ship, target)
    const angleToBH = MathUtils.angle(ship, bh)
    const angleDiff = Math.abs(MathUtils.normalizeAngle(angleToTarget - angleToBH))

    // Если дыра ближе чем цель и находится прямо по курсу (~45 град)
    if (bh.state !== BHState.EXPLODING && distToBH < distToTarget && angleDiff < 0.8 && distToBH < 500) {
      // Огибаем
      const avoidDir = MathUtils.normalizeAngle(angleToBH - ship.angle) > 0 ? -1 : 1
      return angleToBH + (Math.PI / 2) * avoidDir
    }

    return angleToTarget
  }
}

