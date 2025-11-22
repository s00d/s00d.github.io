import type { Simulation } from '../simulation'
import { Ship } from '../entities/Ship'
import { VoidSerpent } from '../entities/VoidSerpent'
import type { PowerUp } from '../entities/PowerUp'
import type { Entity } from '../entities/Entity'
import { CONFIG } from '../config'
import { MathUtils } from '../utils/math'
import { TARGET_TYPE } from '../constants/states'
import { DamageApplicationService } from './DamageApplicationService'
import { CritService } from './CritService'
import { UpgradeFactory } from '../upgrades/UpgradeFactory'
import { EffectSpawnService } from './EffectSpawnService'
import { CoinReward } from '../ui/CoinReward'
import { economy } from '../economy'
import type { TargetType } from './TargetFinder'

/**
 * Универсальный сервис для боевой логики кораблей и призраков
 */
export class EntityCombatService {
  /**
   * Обновляет боевую логику корабля
   */
  static updateShipCombat(
    ship: Ship,
    target: { x: number; y: number; vx?: number; vy?: number },
    dist: number,
    isSerpent: boolean,
    sim: Simulation
  ): void {
    // Оптимизация: используем distSq для сравнений
    const distSq = dist * dist

    // Проверка на большой метеорит - атакуем обычным оружием и бомбами
    const isBigMeteor = sim.bigMeteor && target === sim.bigMeteor

    if (isBigMeteor) {
      // Рассчитываем упреждение для большого метеорита
      const tvx = target.vx || 0
      const tvy = target.vy || 0
      const leadX = target.x + tvx * 15
      const leadY = target.y + tvy * 15
      const leadAngle = MathUtils.angle(ship, { x: leadX, y: leadY })
      const aimDiff = Math.abs(MathUtils.normalizeAngle(leadAngle - ship.angle))

      // Стрельба обычным оружием
      if (ship.weapon.isReady && !ship.isJammed) {
        const allowedAngle = ship.weapon.getAllowedAngle()
        const range = ship.weapon.getRange(CONFIG.SHIP_ENGAGEMENT_DIST)
        const rangeSq = range * range

        if (distSq < rangeSq && aimDiff < allowedAngle) {
          const critResult = CritService.calculateCritDamage(ship.damageMult)
          ship.weapon.fire(sim, ship, leadAngle, critResult.damage, ship.reloadMult)
        }
      }

      // Атака большого метеорита бомбами
      if (ship.bombLevel > 0 && ship.bombCooldown <= 0) {
        const angleToTarget = MathUtils.angle(ship, target)
        const aimDiffBomb = Math.abs(MathUtils.normalizeAngle(angleToTarget - ship.angle))

        // Стреляем бомбой, если смотрим на большой метеорит
        if (distSq < (600 * 600) && aimDiffBomb < 0.8) {
          EffectSpawnService.spawnBomb(ship.x, ship.y, ship.vx, ship.vy, angleToTarget, ship.bombLevel, sim)
          ship.bombCooldown = 400
        }
      }
      return
    }

    // Рассчитываем упреждение
    // Если у цели есть скорость (корабль), используем её. Если нет (сегмент змеи), считаем 0
    const tvx = target.vx || 0
    const tvy = target.vy || 0

    const leadX = target.x + tvx * 15
    const leadY = target.y + tvy * 15
    const leadAngle = MathUtils.angle(ship, { x: leadX, y: leadY })

    const aimDiff = Math.abs(MathUtils.normalizeAngle(leadAngle - ship.angle))

    // Стрельба
    if (ship.weapon.isReady && !ship.isJammed) {
      // Угол стрельбы зависит от типа оружия
      const allowedAngle = ship.weapon.getAllowedAngle()

      // Дальность стрельбы
      const range = ship.weapon.getRange(CONFIG.SHIP_ENGAGEMENT_DIST)
      const rangeSq = range * range

      if (distSq < rangeSq && aimDiff < allowedAngle) {
        // CRIT UPGRADE
        const critResult = CritService.calculateCritDamage(ship.damageMult)
        ship.weapon.fire(sim, ship, leadAngle, critResult.damage, ship.reloadMult)
      }
    }

    // Кидаем бомбу в дыру (попутно), если смотрим на неё
    if (ship.bombLevel > 0 && ship.bombCooldown <= 0) {
      const bombUpgrade = UpgradeFactory.create('UPGRADE_BOMB')
      if (bombUpgrade) {
        bombUpgrade.tryFireBomb(ship, sim)
      }
    }
  }

  /**
   * Пытается атаковать цель призраком
   * @returns true, если атака была выполнена
   */
  static trySerpentAttack(
    serpent: VoidSerpent,
    target: Entity,
    targetType: TargetType,
    sim: Simulation
  ): boolean {
    const attackRangeSq = (30 * serpent.sizeMult) * (30 * serpent.sizeMult)
    const distSq = MathUtils.distSq(serpent, target)

    // АТАКА (Укус)
    if (VoidSerpent.canAttack(targetType) && distSq < attackRangeSq) {
      // Кусаем корабль!
      DamageApplicationService.applyDamageToShip(target as Ship, 2 * serpent.damageMult, sim)
      // Отталкиваемся
      serpent.angle += Math.PI
      return true
    }

    return false
  }

  /**
   * Пытается подобрать бонус призраком
   * @returns true, если бонус был подобран
   */
  static trySerpentPowerUpPickup(
    serpent: VoidSerpent,
    target: PowerUp,
    sim: Simulation
  ): boolean {
    const attackRangeSq = (30 * serpent.sizeMult) * (30 * serpent.sizeMult)
    const distSq = MathUtils.distSq(serpent, target)

    if (distSq < attackRangeSq) {
      // Специальная обработка монеты
      if (target.type === 'COIN') {
        economy.darkMatter += 500
        EffectSpawnService.createExplosion(serpent.x, serpent.y, 20, '#fbbf24', sim)
        const coinReward = CoinReward.create(serpent.x, serpent.y, 500)
        coinReward.text = `+500⚫`
        coinReward.color = '#8b5cf6'
        sim.floatingTexts.add(coinReward)
      } else {
        serpent.applyPowerUp(target, sim)
        EffectSpawnService.createExplosion(serpent.x, serpent.y, 10, target.color, sim)
      }
      target.markedForDeletion = true
      return true
    }

    return false
  }
}

