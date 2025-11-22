import { Entity } from '../entities/Entity'
import { MathUtils } from '../utils/math'
import type { Simulation } from '../simulation'

export abstract class Projectile extends Entity {
  damage: number
  size: number
  life: number
  maxLife: number

  constructor(x: number, y: number, vx: number, vy: number, color: string, damage: number, size: number, life: number) {
    super(x, y, color)
    this.vx = vx; this.vy = vy; this.damage = damage; this.size = size; this.life = life; this.maxLife = life
  }

  // Базовая логика коллизий (пустая реализация - логика в ProjectileSystem)
  checkCollisions(sim: Simulation): void {
    // Пустая реализация - проверка коллизий выполняется в ProjectileSystem
    // для избежания циклических зависимостей
  }

  /**
   * Создает эффект попадания
   * @param sim - симуляция
   * @param createDefaultEffect - функция для создания стандартного эффекта (передается из сервиса)
   */
  createHitEffect(sim: Simulation, createDefaultEffect?: (x: number, y: number, color: string) => void): void {
    // Базовый метод создает стандартный эффект, если передан колбэк
    if (createDefaultEffect) {
      createDefaultEffect(this.x, this.y, this.color)
    }
  }

  /**
   * Определяет, должен ли снаряд удаляться после попадания
   * @returns true, если снаряд должен быть удален после попадания
   */
  shouldDeleteOnHit(): boolean {
    return true
  }

  abstract drawSpecific(ctx: CanvasRenderingContext2D): void

  // Общий апдейт
  update(sim: Simulation) {
    this.life--
    if (this.life <= 0) {
       this.markedForDeletion = true
       return
    }
    this.applyPhysics(sim.warpFactor)
    this.checkCollisions(sim)
  }
}

