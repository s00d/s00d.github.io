import { CONFIG } from '../config'
import { BHState } from '../types'
import { MathUtils } from '../utils/math'
import type { Entity } from '../entities/Entity'
import type { BlackHole } from '../entities/BlackHole'

/**
 * Сервис для расчета гравитации и взаимодействия с черной дырой
 */
export class GravityService {
  /**
   * Рассчитывает силу притяжения гравитации
   * @param entity - сущность
   * @param blackHole - черная дыра
   * @returns вектор скорости для применения гравитации { vx, vy }
   */
  static calculateGravityPull(entity: Entity, blackHole: BlackHole): { vx: number, vy: number } | null {
    if (blackHole.state === BHState.EXPLODING) {
      return null // Гравитация не действует во время взрыва
    }

    const distToBHSq = MathUtils.distSq(entity, blackHole)
    const angleToBH = MathUtils.angle(entity, blackHole)

    const gravityPower = 0.1 + (blackHole.mass / CONFIG.CRITICAL_MASS) * 0.9
    const gRadius = CONFIG.GRAVITY_RADIUS_BASE * (0.5 + gravityPower * 0.5)
    const gRadiusSq = gRadius * gRadius

    if (distToBHSq < gRadiusSq) {
      const distToBH = Math.sqrt(distToBHSq) // Вычисляем только если нужно
      const pull = 0.3 * gravityPower * (1 - distToBH / gRadius)
      return {
        vx: Math.cos(angleToBH) * pull,
        vy: Math.sin(angleToBH) * pull
      }
    }

    return null
  }

  /**
   * Проверяет, должна ли сущность умереть от гравитации (поглощение черной дырой)
   * @param entity - сущность
   * @param blackHole - черная дыра
   * @returns true, если сущность должна умереть
   */
  static shouldDieFromGravity(entity: Entity, blackHole: BlackHole): boolean {
    if (blackHole.state === BHState.EXPLODING) {
      return false // Не умираем от гравитации во время взрыва
    }

    // Оптимизация: используем distSq для избежания sqrt
    const distToBHSq = MathUtils.distSq(entity, blackHole)
    const visualRadiusSq = blackHole.visualRadius * blackHole.visualRadius
    return distToBHSq < visualRadiusSq
  }

  /**
   * Проверяет, должна ли сущность умереть от ударной волны взрыва
   * @param entity - сущность
   * @param blackHole - черная дыра
   * @returns true, если сущность должна умереть от ударной волны
   */
  static shouldDieFromShockwave(entity: Entity, blackHole: BlackHole): boolean {
    if (blackHole.state !== BHState.EXPLODING) {
      return false
    }

    // Оптимизация: используем distSq для избежания sqrt
    const distToBHSq = MathUtils.distSq(entity, blackHole)
    const shockwaveRadiusSq = (blackHole.shockwaveRadius + 50) * (blackHole.shockwaveRadius + 50)
    return distToBHSq < shockwaveRadiusSq
  }
}

