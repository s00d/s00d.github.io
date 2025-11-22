import type { Simulation } from '../simulation'
import type { Renderer } from '../renderer/Renderer'
import type { EntitySystem } from './EntitySystem'

export class FloatingTextSystem implements EntitySystem {
  update(sim: Simulation): void {
    sim.floatingTexts.updateOnly(sim)
  }

  render(sim: Simulation, renderer: Renderer): void {
    sim.floatingTexts.renderOnly(renderer, (ft, r) => {
      ft.draw(r.ctx)
    }, sim)
  }
}

