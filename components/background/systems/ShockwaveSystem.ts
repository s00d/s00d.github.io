import type { Simulation } from '../simulation'
import type { Renderer } from '../renderer/Renderer'
import type { EntitySystem } from './EntitySystem'

export class ShockwaveSystem implements EntitySystem {
  update(sim: Simulation): void {
    sim.shockwaves.updateOnly(sim)
  }

  render(sim: Simulation, renderer: Renderer): void {
    sim.shockwaves.renderOnly(renderer, (sw, r) => {
      sw.draw(r.ctx)
    }, sim)
  }
}

