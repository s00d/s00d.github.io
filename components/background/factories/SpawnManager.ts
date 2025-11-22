import { MathUtils } from '../utils/math'
import { CONFIG } from '../config'
import { Meteor } from '../entities/Meteor'
import { BigMeteor } from '../entities/BigMeteor'
import { Ship } from '../entities/Ship'
import { PowerUp } from '../entities/PowerUp'
import { VoidSerpent } from '../entities/VoidSerpent'
import type { Simulation } from '../simulation'

/**
 * Централизованный менеджер для спавна всех сущностей
 */
export class SpawnManager {
  /**
   * Спавн обычного метеорита
   */
  spawnMeteor(sim: Simulation): void {
    const angle = Math.random() * Math.PI * 2
    const dist = Math.max(sim.width, sim.height) * 0.7
    const x = sim.blackHole.x + Math.cos(angle) * dist
    const y = sim.blackHole.y + Math.sin(angle) * dist

    const isRepelled = Math.random() > 0.85
    const spread = isRepelled ? 500 : 100
    const targetX = sim.blackHole.x + (Math.random() - 0.5) * spread
    const targetY = sim.blackHole.y + (Math.random() - 0.5) * spread
    const angleToTarget = MathUtils.angle({x, y}, {x: targetX, y: targetY})
    const speed = MathUtils.randomRange(2, 4)

    sim.meteors.add(new Meteor(x, y, Math.cos(angleToTarget) * speed, Math.sin(angleToTarget) * speed, false))
  }

  /**
   * Спавн большого метеорита
   */
  spawnBigMeteor(sim: Simulation): void {
    if (sim.bigMeteor !== null) return

    const angle = Math.random() * Math.PI * 2
    const dist = Math.max(sim.width, sim.height) * 0.7
    const x = sim.blackHole.x + Math.cos(angle) * dist
    const y = sim.blackHole.y + Math.sin(angle) * dist

    // Метеорит всегда летит к центру экрана
    const centerX = sim.width / 2
    const centerY = sim.height / 2
    const angleToCenter = MathUtils.angle({x, y}, {x: centerX, y: centerY})
    const speed = MathUtils.randomRange(1.5, 2.5)

    sim.bigMeteor = new BigMeteor(x, y, Math.cos(angleToCenter) * speed, Math.sin(angleToCenter) * speed)
  }

  /**
   * Спавн корабля
   */
  spawnShip(sim: Simulation): void {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.max(sim.width, sim.height) / 2 + 50
    const x = sim.width / 2 + Math.cos(angle) * radius
    const y = sim.height / 2 + Math.sin(angle) * radius
    sim.ships.add(new Ship(x, y, angle + Math.PI))
  }

  /**
   * Спавн бонуса
   */
  spawnPowerUp(sim: Simulation): void {
    // Спавн в случайном месте, но не слишком близко к дыре (оптимизировано через distSq)
    let x, y, dSq
    const minDistSq = 200 * 200 // Минимальное расстояние в квадрате
    do {
      x = MathUtils.randomRange(50, sim.width - 50)
      y = MathUtils.randomRange(50, sim.height - 50)
      dSq = MathUtils.distSq({x, y}, sim.blackHole)
    } while (dSq < minDistSq) // Не спавнить в центре

    sim.powerUps.add(new PowerUp(x, y))
  }

  /**
   * Спавн змеи
   */
  spawnSerpent(sim: Simulation): VoidSerpent {
    const serpent = new VoidSerpent(sim.blackHole.x, sim.blackHole.y)

    // Применяем улучшения черной дыры к змее
    const upgrades = sim.blackHole.upgrades
    serpent.maxHp += upgrades.serpentHealth * 10
    serpent.hp = serpent.maxHp
    serpent.speed += upgrades.serpentSpeed * 0.5
    serpent.damageMult += upgrades.serpentDamage * 0.5

    sim.serpents.add(serpent)
    return serpent
  }
}

