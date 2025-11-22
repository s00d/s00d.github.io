import type { Simulation } from '../simulation'
import type { Renderer } from '../renderer/Renderer'
import { CONFIG } from '../config'
import type { EntitySystem } from './EntitySystem'

export class ShipSystem implements EntitySystem {
  update(sim: Simulation): void {
    // Поддержание количества кораблей
    while (sim.ships.count < CONFIG.SHIP_COUNT) {
      sim.spawnShip()
    }

    // Обновление сущностей
    sim.ships.updateOnly(sim)
  }

  render(sim: Simulation, renderer: Renderer): void {
    sim.ships.renderOnly(renderer, (s, r) => {
      r.drawShip(s)
    }, sim)
  }
}

