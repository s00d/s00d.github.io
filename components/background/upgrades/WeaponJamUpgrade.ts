import { Upgrade, type Upgradeable, type EffectModifiers } from './Upgrade'
import type { PowerUpType } from '../types'
import { CONFIG } from '../config'

export class WeaponJamUpgrade extends Upgrade {
  readonly type: PowerUpType = 'WEAPON_JAM'
  readonly duration: number = CONFIG.POWERUP_DURATION
  readonly icon: string = '🚫'
  readonly weight: number = 2
  readonly isGood: boolean = false

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
    if (target.isJammed !== undefined) {
      target.isJammed = true
    }
  }

  override removeEffect?(target: Upgradeable): void {
    const index = target.statusIcons.indexOf(this.icon)
    if (index > -1) {
      target.statusIcons.splice(index, 1)
    }
  }
}

