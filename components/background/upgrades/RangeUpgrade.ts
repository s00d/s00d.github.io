import { Upgrade, type Upgradeable } from './Upgrade'
import type { PowerUpType } from '../types'
import type { Simulation } from '../simulation'
import { EffectSpawnService } from '../services/EffectSpawnService'

export class RangeUpgrade extends Upgrade {
  readonly type: PowerUpType = 'UPGRADE_RANGE'
  readonly duration: number = 0 // Мгновенный эффект
  readonly icon: string = '🔭'
  readonly weight: number = 5
  readonly isGood: boolean = true

  apply(target: Upgradeable, sim: Simulation): void {
    if (target.rangeMult !== undefined) {
      target.rangeMult = 1.5
      // Создаем эффект применения
      EffectSpawnService.createExplosion(target.x, target.y, 15, target.color || '#10b981', sim)
    }
  }
}

