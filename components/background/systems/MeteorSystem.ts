import type { Simulation } from '../simulation'
import type { Renderer } from '../renderer/Renderer'
import { BHState } from '../types'
import { CONFIG } from '../config'
import type { EntitySystem } from './EntitySystem'

export class MeteorSystem implements EntitySystem {
  update(sim: Simulation): void {
    // Спавн метеоритов
    const activeMeteors = sim.meteors.filter(m => !m.isDebris).length
    if (sim.blackHole.state !== BHState.EXPLODING && activeMeteors < CONFIG.MAX_METEORS && Math.random() < 0.05) {
      sim.spawnMeteor()
    }

    // Обновление сущностей
    sim.meteors.updateOnly(sim)
  }

  render(sim: Simulation, renderer: Renderer): void {
    // Используем батчинг для оптимизации рендеринга метеоритов
    const meteors = sim.meteors.getAll()
    if (meteors.length > 0) {
      renderer.drawMeteorsBatch(meteors, sim.warpFactor)
    }
    if (sim.bigMeteor) {
      renderer.drawBigMeteor(sim.bigMeteor, sim.warpFactor)
    }
  }
}

