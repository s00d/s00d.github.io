import { BHState } from '../../types'
import type { BlackHoleState } from './BlackHoleState'
import type { BlackHole } from '../BlackHole'
import type { Simulation } from '../../simulation'

export class UnstableState implements BlackHoleState {
  update(blackHole: BlackHole, sim: Simulation): void {
    const timeMult = sim.warpFactor
    
    // Увеличиваем тряску
    blackHole.shake += 0.8 * timeMult
    
    // Если тряска превышает порог, переходим к взрыву
    if (blackHole.shake > 120) {
      blackHole.setState(BHState.EXPLODING)
      blackHole.shockwaveRadius = 1
      sim.spawnSupernovaDebris()
    }
  }
}

