import { Upgrade, type Upgradeable } from './Upgrade'
import type { PowerUpType } from '../types'
import type { Simulation } from '../simulation'
import { CONFIG } from '../config'
import { EffectSpawnService } from '../services/EffectSpawnService'

export class ShieldUpgrade extends Upgrade {
  readonly type: PowerUpType = 'GET_SHIELD'
  readonly duration: number = 0 // Мгновенный эффект
  readonly icon: string = '🛡️'
  readonly weight: number = 5
  readonly isGood: boolean = true

  apply(target: Upgradeable, sim: Simulation): void {
    if (target.shield !== undefined && target.maxShield !== undefined) {
      target.shield = target.maxShield
      // Создаем эффект применения
      EffectSpawnService.createExplosion(target.x, target.y, 15, CONFIG.COLORS.shield, sim)
    }
  }
}

