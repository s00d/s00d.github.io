import { BHState } from '../../types'
import { CONFIG } from '../../config'
import type { BlackHoleState } from './BlackHoleState'
import type { BlackHole } from '../BlackHole'
import type { Simulation } from '../../simulation'

export class ReformingState implements BlackHoleState {
  update(blackHole: BlackHole, sim: Simulation): void {
    const timeMult = sim.warpFactor

    // Уменьшаем радиус до начального размера
    if (blackHole.radius > CONFIG.START_RADIUS + 1) {
      blackHole.radius -= 1 * timeMult
    } else {
      // Когда достигли начального размера, переходим в стабильное состояние
      blackHole.setState(BHState.STABLE)
    }
  }
}

