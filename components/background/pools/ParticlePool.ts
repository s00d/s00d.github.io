import { Particle } from '../entities/Particle'
import { Pool, type Poolable } from './Pool'

/**
 * Particle с поддержкой пула
 */
class PoolableParticle extends Particle implements Poolable {
  reset(): void {
    this.x = 0
    this.y = 0
    this.vx = 0
    this.vy = 0
    this.color = '#ffffff'
    this.size = 1
    this.life = 1.0
    this.markedForDeletion = false
  }
}

/**
 * Пул для переиспользования частиц
 */
export class ParticlePool {
  private pool: Pool<PoolableParticle>

  constructor(initialSize: number = 50, maxSize: number = 300) {
    this.pool = new Pool(
      () => new PoolableParticle(0, 0, '#ffffff', 1, 0, 0),
      initialSize,
      maxSize
    )
  }

  /**
   * Получить частицу из пула
   */
  acquire(x: number, y: number, color: string, size: number, vx: number, vy: number): Particle {
    const particle = this.pool.acquire()
    particle.x = x
    particle.y = y
    particle.color = color
    particle.size = size
    particle.vx = vx
    particle.vy = vy
    particle.life = 1.0
    particle.markedForDeletion = false
    return particle
  }

  /**
   * Вернуть частицу в пул
   */
  release(particle: Particle): void {
    if (particle instanceof PoolableParticle) {
      this.pool.release(particle)
    }
  }

  /**
   * Очистить пул
   */
  clear(): void {
    this.pool.clear()
  }

  /**
   * Получить размер пула
   */
  get size(): number {
    return this.pool.size
  }
}

