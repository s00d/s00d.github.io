import type { Simulation } from '../simulation'
import type { Renderer } from '../renderer/Renderer'
import type { EntitySystem } from './EntitySystem'
import type { Projectile } from '../projectiles/Projectile'
import { ProjectileCollisionService } from '../services/ProjectileCollisionService'
import { BombProjectile } from '../projectiles/BombProjectile'

export class ProjectileSystem implements EntitySystem {
  update(sim: Simulation): void {
    // Собираем снаряды для возврата в пул ДО удаления из менеджера
    const toRelease: Projectile[] = []

    // Обновляем снаряды
    for (const p of sim.projectiles.getAll()) {
      if (!p.markedForDeletion) {
        // Вызываем update (может быть переопределен в дочерних классах)
        p.update(sim)
        // Проверяем коллизии только для обычных снарядов (не BombProjectile)
        // BombProjectile имеет свою логику коллизий в update()
        if (!p.markedForDeletion && !(p instanceof BombProjectile)) {
          ProjectileCollisionService.checkCollisions(p, sim)
        }
      }
      if (p.markedForDeletion) {
        toRelease.push(p)
      }
    }

    // Удаление помеченных из менеджера
    sim.projectiles.updateOnly(sim)

    // Возвращаем в пул после удаления из менеджера
    for (const p of toRelease) {
      sim.projectilePool.release(p)
    }
  }

  render(sim: Simulation, renderer: Renderer): void {
    sim.projectiles.renderOnly(renderer, (p, r) => {
      r.drawProjectile(p)
    }, sim)
  }
}

