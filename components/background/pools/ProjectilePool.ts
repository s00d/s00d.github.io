import { LinearProjectile } from '../projectiles/LinearProjectile'
import { BombProjectile } from '../projectiles/BombProjectile'
import type { Projectile } from '../projectiles/Projectile'
import { Pool, type Poolable } from './Pool'

/**
 * LinearProjectile с поддержкой пула
 */
class PoolableLinearProjectile extends LinearProjectile implements Poolable {
  reset(): void {
    this.x = 0
    this.y = 0
    this.vx = 0
    this.vy = 0
    this.color = '#8b5cf6'
    this.damage = 1
    this.size = 2
    this.life = 60
    this.maxLife = 60
    this.markedForDeletion = false
  }
}

/**
 * BombProjectile с поддержкой пула
 */
class PoolableBombProjectile extends BombProjectile implements Poolable {
  reset(): void {
    this.x = 0
    this.y = 0
    this.vx = 0
    this.vy = 0
    this.damage = 6
    this.size = 4
    this.life = 300
    this.maxLife = 300
    this.markedForDeletion = false
  }
}

/**
 * Пул для переиспользования снарядов
 */
export class ProjectilePool {
  private linearPool: Pool<PoolableLinearProjectile>
  private bombPool: Pool<PoolableBombProjectile>

  constructor(linearInitialSize: number = 20, linearMaxSize: number = 100, bombInitialSize: number = 10, bombMaxSize: number = 50) {
    this.linearPool = new Pool(
      () => new PoolableLinearProjectile(0, 0, 0, 0, '#8b5cf6', 1, 2, 60),
      linearInitialSize,
      linearMaxSize
    )
    this.bombPool = new Pool(
      () => new PoolableBombProjectile(0, 0, 0, 0, 6),
      bombInitialSize,
      bombMaxSize
    )
  }

  /**
   * Получить LinearProjectile из пула
   */
  acquireLinear(x: number, y: number, vx: number, vy: number, color: string, damage: number, size: number, life: number): LinearProjectile {
    const projectile = this.linearPool.acquire()
    projectile.x = x
    projectile.y = y
    projectile.vx = vx
    projectile.vy = vy
    projectile.color = color
    projectile.damage = damage
    projectile.size = size
    projectile.life = life
    projectile.maxLife = life
    projectile.markedForDeletion = false
    return projectile
  }

  /**
   * Получить BombProjectile из пула
   */
  acquireBomb(x: number, y: number, vx: number, vy: number, damage: number): BombProjectile {
    const projectile = this.bombPool.acquire()
    projectile.x = x
    projectile.y = y
    projectile.vx = vx
    projectile.vy = vy
    projectile.damage = damage
    projectile.life = 300
    projectile.maxLife = 300
    projectile.markedForDeletion = false
    return projectile
  }

  /**
   * Вернуть снаряд в пул
   */
  release(projectile: Projectile): void {
    if (projectile instanceof PoolableLinearProjectile) {
      this.linearPool.release(projectile)
    } else if (projectile instanceof PoolableBombProjectile) {
      this.bombPool.release(projectile)
    }
    // Другие типы снарядов не поддерживают пулинг
  }

  /**
   * Очистить все пулы
   */
  clear(): void {
    this.linearPool.clear()
    this.bombPool.clear()
  }

  /**
   * Получить общий размер пулов
   */
  get size(): number {
    return this.linearPool.size + this.bombPool.size
  }
}

