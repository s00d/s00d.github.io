import { Upgrade, type Upgradeable, type EffectModifiers } from './Upgrade'
import type { PowerUpType } from '../types'
import { CONFIG } from '../config'
import type { Simulation } from '../simulation'
import { EffectSpawnService } from '../services/EffectSpawnService'

export class SizeDownUpgrade extends Upgrade {
  readonly type: PowerUpType = 'SIZE_DOWN'
  readonly duration: number = 600
  readonly icon: string = '➖'
  readonly weight: number = 5
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
    if (target.sizeMult !== undefined) {
      target.sizeMult = CONFIG.SIZE_MODIFIER_SMALL
    }
  }

  override removeEffect?(target: Upgradeable): void {
    const index = target.statusIcons.indexOf(this.icon)
    if (index > -1) {
      target.statusIcons.splice(index, 1)
    }
    if (target.sizeMult !== undefined) {
      target.sizeMult = 1.0
    }
  }
}

