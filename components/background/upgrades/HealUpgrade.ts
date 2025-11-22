import { Upgrade, type Upgradeable } from './Upgrade'
import type { PowerUpType } from '../types'
import { VoidSerpent } from '../entities/VoidSerpent'
import type { Simulation } from '../simulation'
import { EffectSpawnService } from '../services/EffectSpawnService'

export class HealUpgrade extends Upgrade {
  readonly type: PowerUpType = 'HEAL'
  readonly duration: number = 0 // Мгновенный эффект
  readonly icon: string = '❤️'
  readonly weight: number = 7
  readonly isGood: boolean = true

  apply(target: Upgradeable, sim: Simulation): void {
    if (target.hp !== undefined && target.maxHp !== undefined) {
      // Для VoidSerpent даем больше HP (10 вместо 2)
      const healAmount = target instanceof VoidSerpent ? 10 : 2
      target.hp = Math.min(target.hp + healAmount, target.maxHp)
      // Создаем эффект лечения
      EffectSpawnService.createExplosion(target.x, target.y, 10, '#10b981', sim)
    }
  }
}

