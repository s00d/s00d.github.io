import type { Simulation } from '../simulation'
import { Ship } from '../entities/Ship'
import { VoidSerpent } from '../entities/VoidSerpent'
import type { BigMeteor } from '../entities/BigMeteor'
import { EffectSpawnService } from './EffectSpawnService'

/**
 * Сервис для обработки смерти сущностей
 * Отвечает за создание эффектов смерти, выдачу наград и помечание для удаления
 */
export class DeathService {
  /**
   * Обрабатывает смерть корабля
   * @param ship - корабль
   * @param sim - симуляция
   */
  static handleShipDeath(ship: Ship, sim: Simulation): void {
    EffectSpawnService.createExplosion(ship.x, ship.y, 50, ship.color, sim)
    ship.markedForDeletion = true
  }

  /**
   * Обрабатывает смерть змеи
   * @param serpent - змея
   * @param sim - симуляция
   */
  static handleSerpentDeath(serpent: VoidSerpent, sim: Simulation): void {
    EffectSpawnService.createExplosion(serpent.x, serpent.y, 60, '#ffffff', sim)

    // --- ВЫДАЧА НАГРАДЫ ---
    const reward = serpent.bounty
    EffectSpawnService.addCoins(reward, serpent.x, serpent.y, sim)

    // Add dark matter for upgrades (same amount as coins)
    EffectSpawnService.addDarkMatter(reward, serpent.x, serpent.y, sim)

    serpent.markedForDeletion = true
  }

  /**
   * Обрабатывает смерть большого метеорита
   * @param bigMeteor - большой метеорит
   * @param sim - симуляция
   */
  static handleBigMeteorDeath(bigMeteor: BigMeteor, sim: Simulation): void {
    EffectSpawnService.createExplosion(bigMeteor.x, bigMeteor.y, 50, bigMeteor.color, sim)
    bigMeteor.markedForDeletion = true
    // Спавним новый большой метеорит
    sim.spawnManager.spawnBigMeteor(sim)
  }

  /**
   * Обрабатывает смерть сущности (универсальный метод)
   * @param entity - корабль или змея
   * @param sim - симуляция
   */
  static handleDeath(entity: Ship | VoidSerpent, sim: Simulation): void {
    if (entity instanceof Ship) {
      this.handleShipDeath(entity, sim)
    } else if (entity instanceof VoidSerpent) {
      this.handleSerpentDeath(entity, sim)
    }
  }
}

