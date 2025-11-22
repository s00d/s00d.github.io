import { Upgrade, type Upgradeable, type EffectModifiers } from './Upgrade'
import type { PowerUpType } from '../types'
import { CONFIG } from '../config'
import type { Simulation } from '../simulation'
import { EffectSpawnService } from '../services/EffectSpawnService'

export class DamageBoostUpgrade extends Upgrade {
  readonly type: PowerUpType = 'DAMAGE_BOOST'
  readonly duration: number = CONFIG.POWERUP_DURATION
  readonly icon: string = '⚔️'
  readonly weight: number = 7
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
      EffectSpawnService.createExplosion(target.x, target.y, 15, target.color || '#f43f5e', sim)
    }
  }

  override updateEffect?(target: Upgradeable, effect: { type: PowerUpType; timer: number }): void {
    if (target.damageMult !== undefined) {
      // Для VoidSerpent - 2.0, для Ship - 3.0
      const isVoidSerpent = 'segments' in target
      target.damageMult = isVoidSerpent ? 2.0 : 3.0
    }
  }

  override removeEffect?(target: Upgradeable): void {
    const index = target.statusIcons.indexOf(this.icon)
    if (index > -1) {
      target.statusIcons.splice(index, 1)
    }
  }
}

