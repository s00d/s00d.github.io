import type { Simulation } from '../simulation'
import type { Projectile } from '../projectiles/Projectile'
import { Ship } from '../entities/Ship'
import { VoidSerpent } from '../entities/VoidSerpent'
import { CollisionService } from './CollisionService'
import { DamageApplicationService } from './DamageApplicationService'
import { EffectSpawnService } from './EffectSpawnService'

/**
 * Сервис для обработки коллизий снарядов
 * Отвечает за проверку столкновений снарядов с различными сущностями
 */
export class ProjectileCollisionService {
  /**
   * Проверяет и обрабатывает все коллизии снаряда
   */
  static checkCollisions(projectile: Projectile, sim: Simulation): void {
    // Большой метеорит
    if (sim.bigMeteor) {
      if (CollisionService.checkCircleCollision(projectile, sim.bigMeteor, projectile.size, sim.bigMeteor.size)) {
        ProjectileCollisionService.onHitBigMeteor(projectile, sim)
        return
      }
    }

    // Используем SpatialGrid для оптимизации проверок коллизий
    const collisionRadius = projectile.size + 50 // Радиус проверки коллизий
    const nearbyEntities = sim.spatialGrid.query(projectile.x, projectile.y, collisionRadius)

    // Корабли и змеи
    for (const entity of nearbyEntities) {
      if (entity instanceof Ship) {
        const s = entity as Ship
        if (s.color === projectile.color) continue // Friendly fire off
        if (CollisionService.checkShipCollision(projectile, s, 12, projectile.size)) {
          ProjectileCollisionService.onHitShip(projectile, s, sim)
          return
        }
      } else if (entity instanceof VoidSerpent) {
        // Змеи
        const s = entity as VoidSerpent
        if (s.segments && s.segments.length > 0) {
          const head = s.segments[0]
          if (head) {
            const headRadius = 20 * (s.sizeMult || 1.0)
            if (CollisionService.checkCircleCollision(projectile, head, projectile.size, headRadius)) {
              ProjectileCollisionService.onHitSerpent(projectile, s, sim)
              return
            }
          }
        }
      }
    }
  }

  /**
   * Обработка попадания в большой метеорит
   */
  static onHitBigMeteor(projectile: Projectile, sim: Simulation): void {
    if (!sim.bigMeteor) return
    // Обычные пули наносят 0.1 урона большому метеориту (10 пуль = 1 HP)
    DamageApplicationService.applyDamageToBigMeteor(sim.bigMeteor, 0.1, sim)
    EffectSpawnService.createExplosion(projectile.x, projectile.y, 8, projectile.color, sim)
    projectile.markedForDeletion = true
  }

  /**
   * Обработка попадания в корабль
   */
  static onHitShip(projectile: Projectile, ship: Ship, sim: Simulation): void {
    DamageApplicationService.applyDamageToShip(ship, projectile.damage, sim)
    // Вызываем createHitEffect с колбэком для создания стандартного эффекта
    projectile.createHitEffect(sim, (x, y, color) => {
      EffectSpawnService.createExplosion(x, y, 5, color, sim)
    })
    if (projectile.shouldDeleteOnHit()) {
      projectile.markedForDeletion = true
    }
  }

  /**
   * Обработка попадания в призрака
   */
  static onHitSerpent(projectile: Projectile, serpent: VoidSerpent, sim: Simulation): void {
    DamageApplicationService.applyDamageToSerpent(serpent, projectile.damage, sim)
    // Вызываем createHitEffect с колбэком для создания стандартного эффекта
    projectile.createHitEffect(sim, (x, y, color) => {
      EffectSpawnService.createExplosion(x, y, 5, color, sim)
    })
    if (projectile.shouldDeleteOnHit()) {
      projectile.markedForDeletion = true
    }
  }
}

