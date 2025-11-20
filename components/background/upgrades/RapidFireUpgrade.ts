import { Upgrade, type Upgradeable, type EffectModifiers } from './Upgrade'
import type { PowerUpType } from '../types'
import { CONFIG } from '../config'

export class RapidFireUpgrade extends Upgrade {
  readonly type: PowerUpType = 'RAPID_FIRE'
  readonly duration: number = CONFIG.POWERUP_DURATION
  readonly icon: string = '🔥'
  readonly weight: number = 0 // Не используется в power-up'ах
  readonly isGood: boolean = true

  apply(target: Upgradeable): void {
    const existing = target.activeEffects.find(e => e.type === this.type)
    if (existing) {
      existing.timer = this.duration
    } else {
      target.activeEffects.push({ type: this.type, timer: this.duration })
      if (!target.statusIcons.includes(this.icon)) {
        target.statusIcons.push(this.icon)
      }
    }
  }

  override updateEffect?(target: Upgradeable, effect: { type: PowerUpType; timer: number }): void {
    if (target.reloadMult !== undefined) {
      target.reloadMult = 4.0
    }
  }

  override removeEffect?(target: Upgradeable): void {
    const index = target.statusIcons.indexOf(this.icon)
    if (index > -1) {
      target.statusIcons.splice(index, 1)
    }
  }
}

