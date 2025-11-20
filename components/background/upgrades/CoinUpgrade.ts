import { Upgrade, type Upgradeable } from './Upgrade'
import type { PowerUpType } from '../types'
import type { Ship } from '../entities/Ship'
import type { VoidSerpent } from '../entities/VoidSerpent'
import { economy } from '../economy'

export class CoinUpgrade extends Upgrade {
  readonly type: PowerUpType = 'COIN'
  readonly duration: number = 0 // Мгновенный эффект
  readonly icon: string = '💰'
  readonly weight: number = 3
  readonly isGood: boolean = true

  apply(target: Upgradeable): void {
    // Монета добавляет +500 к балансу в зависимости от того, кто ее берет
    if (target instanceof Ship) {
      // Корабль - добавляем к балансу игрока
      economy.coins += 500
    } else if (target instanceof VoidSerpent) {
      // Призрак - добавляем к балансу черной дыры (через симуляцию)
      // Это будет обработано в simulation.ts при подборе
    }
  }
}

