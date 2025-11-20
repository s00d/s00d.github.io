import type { Simulation } from '../simulation'
import type { Ship } from '../entities/Ship'
import type { CachedGraphics } from '../utils/graphicsCache'

export interface WeaponConfig {
  cooldown: number
  damage: number
  speed: number
  spread: number
  color: string | null
  size: number
  count?: number // Для дробовика
}

export abstract class Weapon {
  cooldownTimer: number = 0
  protected cachedVisual: CachedGraphics | null = null

  // Параметры оружия - каждый класс определяет свои
  abstract readonly config: WeaponConfig
  abstract readonly icon: string
  abstract readonly duration: number // Длительность действия оружия в кадрах

  update() {
    if (this.cooldownTimer > 0) this.cooldownTimer--
  }

  get isReady(): boolean {
    return this.cooldownTimer <= 0
  }

  // Метод выстрела. Возвращает true, если выстрел произошел
  fire(sim: Simulation, owner: Ship, angle: number, damageMult: number, reloadMult: number): boolean {
    if (!this.isReady) return false

    this.spawnProjectiles(sim, owner, angle, damageMult)

    // Установка кулдауна с учетом баффа скорострельности
    this.cooldownTimer = this.config.cooldown / reloadMult
    return true
  }

  // Абстрактный метод, который реализует каждый ствол
  protected abstract spawnProjectiles(sim: Simulation, owner: Ship, angle: number, damageMult: number): void

  // Генерация визуала для оружия (кешируется)
  abstract generateVisual(width: number, height: number): CachedGraphics

  // Получить кешированный визуал или сгенерировать новый
  getVisual(width: number, height: number): CachedGraphics {
    if (!this.cachedVisual) {
      this.cachedVisual = this.generateVisual(width, height)
    }
    return this.cachedVisual
  }

  // Получить допустимый угол для стрельбы
  getAllowedAngle(): number {
    return 0.5 // По умолчанию
  }

  // Получить дальность стрельбы
  getRange(baseRange: number): number {
    return baseRange + 100 // По умолчанию
  }
}

