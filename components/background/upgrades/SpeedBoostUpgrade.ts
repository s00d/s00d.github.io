import { Upgrade, type Upgradeable, type EffectModifiers } from './Upgrade'
import type { PowerUpType } from '../types'
import { CONFIG } from '../config'
import type { Simulation } from '../simulation'
import { EffectSpawnService } from '../services/EffectSpawnService'

export class SpeedBoostUpgrade extends Upgrade {
  readonly type: PowerUpType = 'SPEED_BOOST'
  readonly duration: number = CONFIG.POWERUP_DURATION
  readonly icon: string = '⚡'
  readonly weight: number = 8
  readonly isGood: boolean = true

  apply(target: Upgradeable, sim: Simulation): void {
    const existing = target.activeEffects.find(e => e.type === this.type)
    if (existing) {
      existing.timer = this.duration
    } else {
      target.activeEffects.push({ type: this.type, timer: this.duration })
      if (!target.statusIcons.includes(this.icon)) {
        target.statusIcons.push(this.icon)
      }
      // Создаем эффект применения
      EffectSpawnService.createExplosion(target.x, target.y, 15, target.color || '#10b981', sim)
    }
  }

  override updateEffect?(target: Upgradeable, effect: { type: PowerUpType; timer: number }): void {
    if (target.speedMult !== undefined) {
      target.speedMult = 1.8
    }
  }

  override removeEffect?(target: Upgradeable): void {
    const index = target.statusIcons.indexOf(this.icon)
    if (index > -1) {
      target.statusIcons.splice(index, 1)
    }
  }
}

