import type { Simulation } from '../simulation'
import type { Renderer } from '../renderer/Renderer'
import { BHState } from '../types'
import { economy } from '../economy'
import type { EntitySystem } from './EntitySystem'
import { BlackHoleUpgradeService } from '../services/BlackHoleUpgradeService'

export class SerpentSystem implements EntitySystem {
  update(sim: Simulation): void {
    // Автоматический заказ призрака при достаточном балансе
    const baseCostReduction = sim.blackHole.upgrades.serpentBaseCost * 50
    const debuffIncrease = sim.blackHole.debuffs.serpentCost * 50
    const SERPENT_BASE_COST = Math.max(100, 500 - baseCostReduction + debuffIncrease)
    const SERPENT_EXTRA_COST = sim.serpents.count > 0 ? 100 * Math.pow(2, sim.serpents.count - 1) : 0
    const SERPENT_COST = SERPENT_BASE_COST + SERPENT_EXTRA_COST

    // Автоматическая покупка улучшений
    if (sim.blackHole.state === BHState.STABLE && economy.darkMatter < SERPENT_COST) {
      BlackHoleUpgradeService.autoBuyUpgrade(sim.blackHole)
    }

    // Спавн змеи при достаточном балансе
    if (sim.blackHole.state === BHState.STABLE && economy.darkMatter >= SERPENT_COST) {
      economy.darkMatter -= SERPENT_COST
      sim.spawnSerpent()
    }

    // Обновление сущностей
    sim.serpents.updateOnly(sim)
  }

  render(sim: Simulation, renderer: Renderer): void {
    sim.serpents.renderOnly(renderer, (s, r) => {
      r.drawVoidSerpent(s)
    }, sim)
  }
}

