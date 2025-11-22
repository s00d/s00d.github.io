import type { Simulation } from '../simulation'
import type { Renderer } from '../renderer/Renderer'
import type { EntitySystem } from './EntitySystem'
import type { Particle } from '../entities/Particle'

export class ParticleSystem implements EntitySystem {
  update(sim: Simulation): void {
    // Собираем частицы для возврата в пул ДО удаления из менеджера
    const toRelease: Particle[] = []

    // Обновление частиц (Particle.update() не принимает sim)
    for (const p of sim.particles.getAll()) {
      if (!p.markedForDeletion) {
        p.update()
      }
      if (p.markedForDeletion) {
        toRelease.push(p)
      }
    }

    // Удаление помеченных из менеджера
    sim.particles.updateOnly(sim)

    // Возвращаем в пул после удаления из менеджера
    for (const p of toRelease) {
      sim.particlePool.release(p)
    }
  }

  render(sim: Simulation, renderer: Renderer): void {
    // Используем батчинг для оптимизации рендеринга
    // getAll() уже возвращает только активные частицы (после updateOnly)
    const particles = sim.particles.getAll()
    if (particles.length > 0) {
      renderer.drawParticlesBatch(particles)
    }
  }
}

