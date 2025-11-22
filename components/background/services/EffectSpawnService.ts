import type { Simulation } from '../simulation'
import { Shockwave } from '../entities/Shockwave'
import { DamageNumber } from '../ui/DamageNumber'
import { CoinReward } from '../ui/CoinReward'
import { economy } from '../economy'
import { MathUtils } from '../utils/math'
import { DamageService } from './DamageService'
import { CONFIG } from '../config'
import { DamageApplicationService } from './DamageApplicationService'

/**
 * Сервис для создания всех визуальных и игровых эффектов
 * Централизует логику создания эффектов, которая раньше была в Simulation
 */
export class EffectSpawnService {
  /**
   * Создает взрыв (частицы)
   */
  static createExplosion(x: number, y: number, count: number, color: string, sim: Simulation): void {
    // Ограничитель: если частиц уже слишком много, не спавним новые
    if (sim.particles.count > 300) return

    // Уменьшаем количество частиц в 2 раза, но делаем их крупнее
    const safeCount = Math.floor(count * 0.5)

    for (let i = 0; i < safeCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = MathUtils.randomRange(2, 12) // Чуть быстрее
      // Size range 2-6 (было 1-4)
      const particle = sim.particlePool.acquire(x, y, color, MathUtils.randomRange(2, 6), Math.cos(angle) * speed, Math.sin(angle) * speed)
      sim.particles.add(particle)
    }
  }

  /**
   * Создает текст урона
   */
  static spawnDamageText(x: number, y: number, damage: number, isCrit: boolean, sim: Simulation): void {
    const damageText = DamageNumber.create(x, y, damage, isCrit)
    sim.floatingTexts.add(damageText)
  }

  /**
   * Добавляет монеты с визуальным эффектом
   */
  static addCoins(amount: number, x: number, y: number, sim: Simulation): void {
    economy.coins += amount
    const coinReward = CoinReward.create(x, y, amount)
    sim.floatingTexts.add(coinReward)
  }

  /**
   * Добавляет темную материю с визуальным эффектом
   */
  static addDarkMatter(amount: number, x: number, y: number, sim: Simulation): void {
    economy.darkMatter += amount
    const darkMatterReward = CoinReward.create(x, y, amount)
    darkMatterReward.text = `+${amount}⚫`
    darkMatterReward.color = '#8b5cf6'
    sim.floatingTexts.add(darkMatterReward)
  }

  /**
   * Создает бомбу
   */
  static spawnBomb(
    x: number,
    y: number,
    vx: number,
    vy: number,
    angle: number,
    bombLevel: number,
    sim: Simulation
  ): void {
    // Урон бомбы = База + (Уровень апгрейда * 10)
    const damage = CONFIG.BOMB_DAMAGE + (bombLevel - 1) * 10
    const bomb = sim.projectilePool.acquireBomb(x + Math.cos(angle) * 10, y + Math.sin(angle) * 10, vx + Math.cos(angle) * 6, vy + Math.sin(angle) * 6, damage)
    sim.projectiles.add(bomb)
  }

  /**
   * Создает ударную волну
   */
  static spawnShockwave(x: number, y: number, sim: Simulation): void {
    sim.shockwaves.add(new Shockwave(x, y))

    // ЛОГИКА УРОНА ПО ПЛОЩАДИ (AOE)
    const affected = DamageService.applyAoeDamage(x, y, 250, 10, sim.serpents.getAll())

    for (const { serpent, damage, pushAngle } of affected) {
      DamageApplicationService.applyDamageToSerpent(serpent, damage, sim)
      // Отталкиваем змею от взрыва (немного физики)
      serpent.x += Math.cos(pushAngle) * 20
      serpent.y += Math.sin(pushAngle) * 20
    }
  }
}

