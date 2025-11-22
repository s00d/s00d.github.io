import type { Simulation } from '../simulation'
import { Ship } from '../entities/Ship'
import { VoidSerpent } from '../entities/VoidSerpent'
import type { BigMeteor } from '../entities/BigMeteor'
import { CONFIG } from '../config'
import { DeathService } from './DeathService'
import { EffectSpawnService } from './EffectSpawnService'

/**
 * Сервис для применения урона к сущностям
 * Отвечает за обработку урона, создание эффектов и вызов DeathService при смерти
 */
export class DamageApplicationService {
  /**
   * Применяет урон к кораблю
   * @param ship - корабль
   * @param damage - урон
   * @param sim - симуляция
   */
  static applyDamageToShip(ship: Ship, damage: number, sim: Simulation): void {
    EffectSpawnService.spawnDamageText(ship.x, ship.y, damage, false, sim)

    // Сначала урон идет в щит
    if (ship.shield > 0) {
      ship.shield -= damage
      // Эффект удара по щиту (синий)
      EffectSpawnService.createExplosion(ship.x, ship.y, 5, CONFIG.COLORS.shield, sim)
      if (ship.shield < 0) {
        ship.hp += ship.shield // Переносим остаток урона на HP
        ship.shield = 0
      }
    } else {
      ship.hp -= damage
      EffectSpawnService.createExplosion(ship.x, ship.y, 10, ship.color, sim)
    }

    // Проверяем смерть
    if (ship.hp <= 0) {
      DeathService.handleShipDeath(ship, sim)
    }
  }

  /**
   * Применяет урон к змее
   * @param serpent - змея
   * @param damage - урон
   * @param sim - симуляция
   */
  static applyDamageToSerpent(serpent: VoidSerpent, damage: number, sim: Simulation): void {
    // Если маленький - сложнее попасть (можно добавить шанс уклонения), но меньше HP
    // Если большой - легче попасть, но урона проходит меньше (толстая шкура)
    const actualDamage = serpent.sizeMult > 1.5 ? damage * 0.7 : damage
    serpent.hp -= actualDamage

    // ПОКАЗЫВАЕМ УРОН (Критом считаем урон > 5, для примера)
    EffectSpawnService.spawnDamageText(serpent.x, serpent.y, actualDamage, actualDamage > 5, sim)

    EffectSpawnService.createExplosion(serpent.x, serpent.y, 5, serpent.color, sim)

    // Проверяем смерть
    if (serpent.hp <= 0) {
      DeathService.handleSerpentDeath(serpent, sim)
    }
  }

  /**
   * Применяет урон к большому метеориту
   * @param bigMeteor - большой метеорит
   * @param damage - урон
   * @param sim - симуляция
   */
  static applyDamageToBigMeteor(bigMeteor: BigMeteor, damage: number, sim: Simulation): void {
    bigMeteor.hp -= damage
    EffectSpawnService.spawnDamageText(bigMeteor.x, bigMeteor.y, damage, false, sim)
    EffectSpawnService.createExplosion(bigMeteor.x, bigMeteor.y, 10, bigMeteor.color, sim)

    if (bigMeteor.hp <= 0) {
      DeathService.handleBigMeteorDeath(bigMeteor, sim)
    }
  }

  /**
   * Применяет урон к сущности (универсальный метод)
   * @param entity - корабль или змея
   * @param damage - урон
   * @param sim - симуляция
   */
  static applyDamage(entity: Ship | VoidSerpent, damage: number, sim: Simulation): void {
    if (entity instanceof Ship) {
      this.applyDamageToShip(entity, damage, sim)
    } else if (entity instanceof VoidSerpent) {
      this.applyDamageToSerpent(entity, damage, sim)
    }
  }
}

