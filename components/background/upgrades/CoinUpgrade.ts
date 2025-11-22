import { Upgrade, type Upgradeable } from './Upgrade'
import type { PowerUpType } from '../types'
import { Ship } from '../entities/Ship'
import { VoidSerpent } from '../entities/VoidSerpent'
import { economy } from '../economy'
import type { Simulation } from '../simulation'
import { CoinReward } from '../ui/CoinReward'
import { EffectSpawnService } from '../services/EffectSpawnService'

export class CoinUpgrade extends Upgrade {
  readonly type: PowerUpType = 'COIN'
  readonly duration: number = 0 // Мгновенный эффект
  readonly icon: string = '💰'
  readonly weight: number = 3
  readonly isGood: boolean = true

  apply(target: Upgradeable, sim: Simulation): void {
    // Монета добавляет +500 к балансу в зависимости от того, кто ее берет
    if (target instanceof Ship) {
      // Корабль - добавляем к балансу игрока
      economy.coins += 500
            EffectSpawnService.createExplosion(target.x, target.y, 20, '#fbbf24', sim)
      const coinReward = CoinReward.create(target.x, target.y, 500)
      sim.floatingTexts.add(coinReward)
    } else if (target instanceof VoidSerpent) {
      // Призрак - добавляем к балансу черной дыры
      economy.darkMatter += 500
            EffectSpawnService.createExplosion(target.x, target.y, 20, '#fbbf24', sim)
      const coinReward = CoinReward.create(target.x, target.y, 500)
      coinReward.text = `+500⚫`
      coinReward.color = '#8b5cf6'
      sim.floatingTexts.add(coinReward)
    }
  }
}

