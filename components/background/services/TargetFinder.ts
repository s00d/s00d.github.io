import { MathUtils } from '../utils/math'
import { TARGET_TYPE } from '../constants/states'
import type { Entity } from '../entities/Entity'
import { Ship } from '../entities/Ship'
import { VoidSerpent } from '../entities/VoidSerpent'
import { PowerUp } from '../entities/PowerUp'
import type { BigMeteor } from '../entities/BigMeteor'
import type { Simulation } from '../simulation'

/**
 * Тип цели для поиска
 */
export type TargetType = typeof TARGET_TYPE.SERPENT | typeof TARGET_TYPE.SHIP | typeof TARGET_TYPE.POINT | typeof TARGET_TYPE.POWERUP | typeof TARGET_TYPE.BIG_METEOR | null

/**
 * Результат поиска цели
 */
export interface TargetResult {
  target: { x: number; y: number; vx?: number; vy?: number } | null
  type: TargetType
}

/**
 * Приоритеты поиска целей
 */
export interface TargetPriorities {
  powerUps?: { enabled: boolean; maxDistance: number }
  bigMeteor?: { enabled: boolean; maxDistance: number }
  serpents?: { enabled: boolean; maxDistance?: number }
  ships?: { enabled: boolean; maxDistance: number; excludeSelf?: boolean }
  wander?: { enabled: boolean; margin: number; minDistance: number }
}

/**
 * Универсальный поисковик целей
 */
export class TargetFinder {
  /**
   * Найти лучшую цель для сущности
   */
  static findBest(
    entity: Entity,
    sim: Simulation,
    priorities: TargetPriorities
  ): TargetResult {
    let closestDist = Infinity
    let bestTarget: { x: number; y: number; vx?: number; vy?: number } | null = null
    let bestType: TargetType = null

    // 1. Приоритет: БОНУСЫ (оптимизировано через SpatialGrid)
    if (priorities.powerUps?.enabled) {
      const maxDist = priorities.powerUps.maxDistance
      const maxDistSq = maxDist * maxDist
      const nearbyPowerUps = sim.spatialGrid.query(entity.x, entity.y, maxDist)

      for (const p of nearbyPowerUps) {
        if (p instanceof PowerUp && p.isGood) {
          const dSq = MathUtils.distSq(entity, p)
          if (dSq < closestDist * closestDist && dSq < maxDistSq) {
            closestDist = Math.sqrt(dSq)
            bestTarget = p
            bestType = TARGET_TYPE.POWERUP
          }
        }
      }
    }

    // 2. Приоритет: БОЛЬШОЙ МЕТЕОРИТ
    if (priorities.bigMeteor?.enabled && sim.bigMeteor) {
      const maxDist = priorities.bigMeteor.maxDistance
      const maxDistSq = maxDist * maxDist
      const dSq = MathUtils.distSq(entity, sim.bigMeteor)
      if (dSq < closestDist * closestDist && dSq < maxDistSq) {
        closestDist = Math.sqrt(dSq)
        bestTarget = sim.bigMeteor
        bestType = TARGET_TYPE.POINT
      }
    }

    // 3. Приоритет: ЗМЕИ (оптимизировано через SpatialGrid)
    if (priorities.serpents?.enabled) {
      const maxDist = priorities.serpents.maxDistance || Infinity
      const maxDistSq = maxDist * maxDist
      const nearbyEntities = sim.spatialGrid.query(entity.x, entity.y, maxDist)

      for (const e of nearbyEntities) {
        if (e instanceof VoidSerpent) {
          const serpent = e as VoidSerpent
          if (serpent.segments.length === 0) continue
          const head = serpent.segments[0]
          if (!head) continue
          const dSq = MathUtils.distSq(entity, head)
          if (dSq < closestDist * closestDist && dSq < maxDistSq) {
            closestDist = Math.sqrt(dSq)
            bestTarget = head
            bestType = TARGET_TYPE.SERPENT
          }
        }
      }
    }

    // 4. Приоритет: КОРАБЛИ (оптимизировано через SpatialGrid)
    if (priorities.ships?.enabled) {
      const maxDist = priorities.ships.maxDistance
      const maxDistSq = maxDist * maxDist
      const excludeSelf = priorities.ships.excludeSelf
      const nearbyEntities = sim.spatialGrid.query(entity.x, entity.y, maxDist)

      for (const e of nearbyEntities) {
        if (e instanceof Ship) {
          const ship = e as Ship
          if (excludeSelf && ship === entity) continue
          const dSq = MathUtils.distSq(entity, ship)
          if (dSq < closestDist * closestDist && dSq < maxDistSq) {
            closestDist = Math.sqrt(dSq)
            bestTarget = ship
            bestType = TARGET_TYPE.SHIP
          }
        }
      }
    }

    // 5. Приоритет: ПАТРУЛЬ (только если нет других целей)
    if (bestTarget === null && priorities.wander?.enabled && entity instanceof Ship) {
      const ship = entity as Ship
      if (!ship.wanderTarget || MathUtils.dist(ship, ship.wanderTarget) < priorities.wander.minDistance) {
        const margin = priorities.wander.margin
        ship.wanderTarget = {
          x: MathUtils.randomRange(margin, sim.width - margin),
          y: MathUtils.randomRange(margin, sim.height - margin)
        }
      }
      if (ship.wanderTarget) {
        return { target: ship.wanderTarget, type: TARGET_TYPE.POINT }
      }
    }

    return { target: bestTarget, type: bestType }
  }

  /**
   * Найти лучшую цель для корабля
   */
  static findForShip(ship: Ship, sim: Simulation): TargetResult {
    return this.findBest(ship, sim, {
      powerUps: { enabled: true, maxDistance: 500 },
      bigMeteor: { enabled: true, maxDistance: 800 },
      serpents: { enabled: true },
      ships: { enabled: true, maxDistance: 1000, excludeSelf: true },
      wander: { enabled: true, margin: 100, minDistance: 100 }
    })
  }

  /**
   * Найти лучшую цель для змеи
   */
  static findForSerpent(serpent: VoidSerpent, sim: Simulation): TargetResult {
    return this.findBest(serpent, sim, {
      powerUps: { enabled: true, maxDistance: 400 },
      ships: { enabled: true, maxDistance: 800, excludeSelf: false }
    })
  }
}

