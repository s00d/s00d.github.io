import { Upgrade, type Upgradeable } from './Upgrade'
import type { PowerUpType } from '../types'
import { VoidSerpent } from '../entities/VoidSerpent'

export class HealUpgrade extends Upgrade {
  readonly type: PowerUpType = 'HEAL'
  readonly duration: number = 0 // Мгновенный эффект
  readonly icon: string = '❤️'
  readonly weight: number = 7
  readonly isGood: boolean = true

  apply(target: Upgradeable): void {
    if (target.hp !== undefined && target.maxHp !== undefined) {
      // Для VoidSerpent даем больше HP (10 вместо 2)
      const healAmount = target instanceof VoidSerpent ? 10 : 2
      target.hp = Math.min(target.hp + healAmount, target.maxHp)
    }
  }
}

