import { Upgrade, type Upgradeable } from './Upgrade'
import type { PowerUpType } from '../types'
import type { Ship } from '../entities/Ship'
import type { Simulation } from '../simulation'
import { CONFIG } from '../config'
import { SHIP_STATE } from '../constants/states'
import { MathUtils } from '../utils/math'

export class TeleportUpgrade extends Upgrade {
  readonly type: PowerUpType = 'GET_TELEPORT'
  readonly duration: number = 0 // Мгновенный эффект
  readonly icon: string = '🌀'
  readonly weight: number = 5
  readonly isGood: boolean = true

  apply(target: Upgradeable): void {
    if (target.hasTeleport !== undefined) {
      target.hasTeleport = true
    }
  }

  /**
   * Пытается выполнить телепорт корабля
   * @param ship - корабль для телепортации
   * @param sim - симуляция
   * @returns true, если телепорт выполнен
   */
  tryTeleport(ship: Ship, sim: Simulation): boolean {
    if (!ship.hasTeleport || ship.state !== SHIP_STATE.DOGFIGHT || !ship.navTarget) {
      return false
    }

    // Прыгаем, если враг далеко
    const dist = MathUtils.dist(ship, ship.navTarget)
    if (dist > 400) {
      // Телепорт за спину врагу
      const angle = MathUtils.angle(ship, ship.navTarget)
      ship.x = ship.navTarget.x - Math.cos(angle) * 100
      ship.y = ship.navTarget.y - Math.sin(angle) * 100

      // Эффект телепортации
      sim.createExplosion(ship.x, ship.y, 20, CONFIG.COLORS.shield)
      ship.hasTeleport = false // Потрачено
      return true
    }

    return false
  }
}

