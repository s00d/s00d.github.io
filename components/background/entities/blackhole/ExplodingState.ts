import { BHState } from '../../types'
import type { BlackHoleState } from './BlackHoleState'
import type { BlackHole } from '../BlackHole'
import type { Simulation } from '../../simulation'

export class ExplodingState implements BlackHoleState {
  update(blackHole: BlackHole, sim: Simulation): void {
    const timeMult = sim.warpFactor
    
    // Увеличиваем радиус ударной волны
    blackHole.shockwaveRadius += 25 * timeMult
    blackHole.shake = 0
    
    // Если волна достигла края экрана, переходим к восстановлению
    if (blackHole.shockwaveRadius > Math.max(sim.width, sim.height) * 1.5) {
      blackHole.setState(BHState.REFORMING)
      blackHole.mass = 0
      blackHole.safetyTimer = 200
      sim.initStars()
    }
  }
}

