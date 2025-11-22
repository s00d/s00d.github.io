import type { Simulation } from '../simulation'
import type { Renderer } from '../renderer/Renderer'
import { BHState } from '../types'
import { CONFIG } from '../config'
import { CollisionService } from '../services/CollisionService'
import type { EntitySystem } from './EntitySystem'
import { Ship } from '../entities/Ship'
import { VoidSerpent } from '../entities/VoidSerpent'
import { UpgradeFactory } from '../upgrades/UpgradeFactory'

export class PowerUpSystem implements EntitySystem {
  update(sim: Simulation): void {
    // Спавн бонусов
    if (sim.blackHole.state !== BHState.EXPLODING && Math.random() < CONFIG.POWERUP_RATE) {
      sim.spawnPowerUp()
    }

    // Обновление сущностей
    sim.powerUps.updateOnly(sim)

    // Проверка коллизий с кораблями и змеями (оптимизировано через SpatialGrid)
    for (const p of sim.powerUps.getAll()) {
      if (p.markedForDeletion) continue

      const nearbyEntities = sim.spatialGrid.query(p.x, p.y, 50) // Радиус проверки коллизий

      // Проверка столкновения с кораблями
      for (const entity of nearbyEntities) {
        if (entity instanceof Ship) {
          const s = entity as Ship
          if (CollisionService.checkCircleCollision(p, s, 25, 0)) {
            UpgradeFactory.apply(p.type, s, sim)
            p.markedForDeletion = true
            break
          }
        } else if (entity instanceof VoidSerpent && !p.markedForDeletion) {
          // Проверка столкновения с призраками
          const s = entity as VoidSerpent
          if (s.segments.length > 0) {
            const head = s.segments[0]
            if (head && CollisionService.checkCircleCollision(p, head, 25, 20)) {
              UpgradeFactory.apply(p.type, s, sim)
              p.markedForDeletion = true
              break
            }
          }
        }
      }
    }
  }

  render(sim: Simulation, renderer: Renderer): void {
    sim.powerUps.renderOnly(renderer, (p, r) => {
      r.drawPowerUp(p)
    }, sim)
  }
}

