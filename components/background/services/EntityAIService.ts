import type { Simulation } from '../simulation'
import { Ship } from '../entities/Ship'
import type { VoidSerpent } from '../entities/VoidSerpent'
import { BHState, type ShipState } from '../types'
import { SHIP_STATE, TARGET_TYPE } from '../constants/states'
import { CONFIG } from '../config'
import { MathUtils } from '../utils/math'
import { Navigator } from '../utils/navigator'
import { TargetFinder, type TargetType } from './TargetFinder'

/**
 * Результат работы AI для корабля
 */
export interface ShipAIResult {
  desiredAngle: number
  engineThrust: number
  state: ShipState
  target: { x: number; y: number } | null
  targetType: TargetType
}

/**
 * Результат работы AI для призрака
 */
export interface SerpentAIResult {
  angle: number
  speed: number
  target: { x: number; y: number } | null
  targetType: TargetType
}

/**
 * Универсальный сервис для логики принятия решений (AI) кораблей и призраков
 */
export class EntityAIService {
  /**
   * Обновляет AI корабля и возвращает желаемые параметры движения
   */
  static updateShipAI(ship: Ship, sim: Simulation): ShipAIResult {
    const bh = sim.blackHole
    const distToBHSq = MathUtils.distSq(ship, bh)
    const distToBH = Math.sqrt(distToBHSq)
    const angleToBH = MathUtils.angle(ship, bh)

    // Поиск цели
    const { target, type } = TargetFinder.findForShip(ship, sim)
    const navTarget = target ? { x: target.x, y: target.y } : null

    let desiredAngle = ship.angle
    let engineThrust = 0.4
    let state: ShipState = SHIP_STATE.ROAM

    const panicDist = 180 + (bh.mass / CONFIG.CRITICAL_MASS) * 200
    const panicDistSq = panicDist * panicDist

    // A. ПАНИКА (Override всего)
    if (bh.state !== BHState.EXPLODING && distToBHSq < panicDistSq) {
      state = SHIP_STATE.PANIC
      desiredAngle = MathUtils.angle(bh, ship) // Строго от дыры
      engineThrust = 1.0 // Максимальный форсаж
    } else if (target) {
      // B. УМНАЯ НАВИГАЦИЯ К ЦЕЛИ
      const distToTargetSq = MathUtils.distSq(ship, target)
      const distToTarget = Math.sqrt(distToTargetSq)
      const angleToTarget = MathUtils.angle(ship, target)

      // Проверяем, перекрывает ли черная дыра путь к цели
      const angleDiffBH = Math.abs(MathUtils.normalizeAngle(angleToTarget - angleToBH))
      const isPathBlocked = distToBHSq < distToTargetSq && angleDiffBH < 0.8 // ~45 градусов

      if (isPathBlocked && bh.state !== BHState.EXPLODING) {
        // МАРШРУТИЗАЦИЯ: Огибаем дыру
        const avoidDir = MathUtils.normalizeAngle(angleToBH - ship.angle) > 0 ? -1 : 1
        desiredAngle = angleToBH + (Math.PI / 2) * avoidDir // Летим по касательной
        state = SHIP_STATE.ROAM
      } else {
        // Путь чист, выполняем боевую задачу или полет
        const isBigMeteor = sim.bigMeteor && target === sim.bigMeteor

        if (Ship.canAttack(type) || isBigMeteor) {
          state = SHIP_STATE.DOGFIGHT
          // Ускоряемся если цель далеко
          engineThrust = distToTarget > 400 ? 0.7 : 0.5
          // Используем метод корабля для расчета угла маневра
          desiredAngle = ship.combatManeuverAngle(target, distToTarget)
        } else {
          state = SHIP_STATE.ROAM
          desiredAngle = Navigator.getPathToTarget(ship, target, bh)
          engineThrust = 0.4
        }
      }
    }

    return {
      desiredAngle,
      engineThrust,
      state,
      target: navTarget,
      targetType: type
    }
  }

  /**
   * Обновляет AI призрака и возвращает желаемые параметры движения
   */
  static updateSerpentAI(serpent: VoidSerpent, sim: Simulation): SerpentAIResult {
    const bh = sim.blackHole
    const distFromCenterSq = MathUtils.distSq(serpent, bh)

    // Поиск цели
    const result = TargetFinder.findForSerpent(serpent, sim)
    const target = result.target ? { x: result.target.x, y: result.target.y } : null
    const targetType = (result.type === TARGET_TYPE.SHIP || result.type === TARGET_TYPE.POWERUP) ? result.type : null

    let angle = serpent.angle
    let speed = 2.0 * serpent.speedMult // Базовая скорость

    if (result.target) {
      // Поворачиваем к цели
      const angleToTarget = MathUtils.angle(serpent, result.target)
      let diff = MathUtils.normalizeAngle(angleToTarget - serpent.angle)
      // Змея поворачивает медленнее кораблей
      angle = serpent.angle + Math.sign(diff) * Math.min(Math.abs(diff), 0.05)
      speed = 3.0 * serpent.speedMult // Ускоряемся к цели
    } else {
      // Если нет цели, просто плаваем вокруг дыры или от нее
      if (distFromCenterSq > (400 * 400)) {
        // Возвращаемся к центру
        const angleToCenter = MathUtils.angle(serpent, bh)
        let diff = MathUtils.normalizeAngle(angleToCenter - serpent.angle)
        angle = serpent.angle + Math.sign(diff) * Math.min(Math.abs(diff), 0.02)
      }
    }

    return {
      angle,
      speed,
      target,
      targetType
    }
  }
}

