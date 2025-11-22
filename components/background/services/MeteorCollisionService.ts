import type { Simulation } from '../simulation'
import type { BigMeteor } from '../entities/BigMeteor'
import { Ship } from '../entities/Ship'
import { VoidSerpent } from '../entities/VoidSerpent'
import { Meteor } from '../entities/Meteor'
import { CollisionService } from './CollisionService'
import { DamageApplicationService } from './DamageApplicationService'
import { EffectSpawnService } from './EffectSpawnService'

/**
 * Сервис для обработки коллизий большого метеорита
 * Отвечает за столкновения с кораблями, призраками и другими метеоритами
 */
export class MeteorCollisionService {
  /**
   * Проверяет и обрабатывает все коллизии большого метеорита
   */
  static checkCollisions(meteor: BigMeteor, sim: Simulation): void {
    // Столкновения (оптимизировано через SpatialGrid)
    const collisionRadius = meteor.size + 50 // Радиус проверки коллизий
    const nearbyEntities = sim.spatialGrid.query(meteor.x, meteor.y, collisionRadius)

    // Столкновение с кораблями
    for (const entity of nearbyEntities) {
      if (entity instanceof Ship) {
        const ship = entity as Ship
        const shipRadius = ship.sizeMult * 5
        if (CollisionService.checkCircleCollision(meteor, ship, meteor.size, shipRadius)) {
          DamageApplicationService.applyDamageToShip(ship, 9999, sim)
          EffectSpawnService.createExplosion(ship.x, ship.y, 20, ship.color, sim)
        }
      } else if (entity instanceof VoidSerpent) {
        // Столкновение с призраками
        const serpent = entity as VoidSerpent
        for (const segment of serpent.segments) {
          if (CollisionService.checkCircleCollision(meteor, segment, meteor.size, 0)) {
            DamageApplicationService.applyDamageToSerpent(serpent, 9999, sim)
            EffectSpawnService.createExplosion(segment.x, segment.y, 20, serpent.color, sim)
            break
          }
        }
      } else if (entity instanceof Meteor) {
        // Столкновение с другими метеоритами
        const other = entity as Meteor
        if (CollisionService.checkCircleCollision(meteor, other, meteor.size, other.size)) {
          other.markedForDeletion = true
          EffectSpawnService.createExplosion(other.x, other.y, 10, other.color, sim)
        }
      }
    }
  }
}

