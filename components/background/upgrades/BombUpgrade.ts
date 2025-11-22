import { Upgrade, type Upgradeable } from './Upgrade'
import type { PowerUpType } from '../types'
import { BHState } from '../types'
import type { Ship } from '../entities/Ship'
import type { Simulation } from '../simulation'
import { BombProjectile } from '../projectiles/BombProjectile'
import { CONFIG } from '../config'
import { MathUtils } from '../utils/math'
import { EffectSpawnService } from '../services/EffectSpawnService'

export class BombUpgrade extends Upgrade {
  readonly type: PowerUpType = 'UPGRADE_BOMB'
  readonly duration: number = 0 // Мгновенный эффект
  readonly icon: string = '💣'
  readonly weight: number = 5
  readonly isGood: boolean = true

  apply(target: Upgradeable, sim: Simulation): void {
    if (target.bombLevel !== undefined) {
      target.bombLevel = 2
      // Создаем эффект применения
      EffectSpawnService.createExplosion(target.x, target.y, 15, CONFIG.COLORS.bomb, sim)
    }
  }

  /**
   * Пытается выстрелить бомбой в черную дыру
   * @param ship - корабль
   * @param sim - симуляция
   * @returns true, если бомба была выпущена
   */
  tryFireBomb(ship: Ship, sim: Simulation): boolean {
    if (ship.bombLevel === undefined || ship.bombLevel < 1) {
      return false
    }

    if (ship.bombCooldown > 0) {
      return false
    }

    const bh = sim.blackHole
    const angleToBH = MathUtils.angle(ship, bh)
    const bhDiff = Math.abs(MathUtils.normalizeAngle(angleToBH - ship.angle))
    const distBH = MathUtils.dist(ship, bh)

    // Стреляем бомбой, если смотрим на дыру и она близко
    if (bhDiff < 0.5 && distBH < 500 && bh.state !== BHState.EXPLODING) {
      const damage = ship.bombLevel === 2 ? CONFIG.BOMB_DAMAGE * 2 : CONFIG.BOMB_DAMAGE
      EffectSpawnService.spawnBomb(ship.x, ship.y, ship.vx, ship.vy, ship.angle, ship.bombLevel, sim)
      ship.bombCooldown = 400
      return true
    }

    return false
  }
}

