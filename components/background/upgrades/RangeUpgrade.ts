import { Upgrade, type Upgradeable } from './Upgrade'
import type { PowerUpType } from '../types'

export class RangeUpgrade extends Upgrade {
  readonly type: PowerUpType = 'UPGRADE_RANGE'
  readonly duration: number = 0 // Мгновенный эффект
  readonly icon: string = '🔭'
  readonly weight: number = 5
  readonly isGood: boolean = true

  apply(target: Upgradeable): void {
    if (target.rangeMult !== undefined) {
      target.rangeMult = 1.5
    }
  }
}

