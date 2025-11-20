import { Upgrade, type Upgradeable } from './Upgrade'
import type { PowerUpType } from '../types'

export class ShieldUpgrade extends Upgrade {
  readonly type: PowerUpType = 'GET_SHIELD'
  readonly duration: number = 0 // Мгновенный эффект
  readonly icon: string = '🛡️'
  readonly weight: number = 5
  readonly isGood: boolean = true

  apply(target: Upgradeable): void {
    if (target.shield !== undefined && target.maxShield !== undefined) {
      target.shield = target.maxShield
    }
  }
}

