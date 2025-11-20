import { BHState } from '../../types'
import { CONFIG } from '../../config'
import type { BlackHoleState } from './BlackHoleState'
import type { BlackHole } from '../BlackHole'
import type { Simulation } from '../../simulation'

export class StableState implements BlackHoleState {
  update(blackHole: BlackHole, sim: Simulation): void {
    // Проверяем переход в нестабильное состояние
    if (blackHole.mass >= CONFIG.CRITICAL_MASS) {
      blackHole.setState(BHState.UNSTABLE)
    }
  }
}

