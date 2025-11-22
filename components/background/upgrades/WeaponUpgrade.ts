import { Upgrade, type Upgradeable } from './Upgrade'
import type { PowerUpType } from '../types'
import type { Weapon } from '../weapons/Weapon'
import type { Simulation } from '../simulation'
import { EffectSpawnService } from '../services/EffectSpawnService'
import { Minigun } from '../weapons/Minigun'
import { Shotgun } from '../weapons/Shotgun'
import { Railgun } from '../weapons/Railgun'
import { MissileLauncher } from '../weapons/MissileLauncher'
import { PlasmaGun } from '../weapons/PlasmaGun'
import { FlakCannon } from '../weapons/FlakCannon'
import { WaveGun } from '../weapons/WaveGun'
import { SniperRifle } from '../weapons/SniperRifle'

export class WeaponUpgrade extends Upgrade {
  readonly type: PowerUpType
  readonly icon: string
  readonly weight: number
  readonly isGood: boolean = true
  private readonly weaponClass: new () => Weapon

  constructor(type: PowerUpType, weaponClass: new () => Weapon, icon: string, weight: number) {
    super()
    this.type = type
    this.weaponClass = weaponClass
    this.icon = icon
    this.weight = weight
  }

  get duration(): number {
    // Получаем duration из экземпляра оружия
    const weaponInstance = new this.weaponClass()
    return weaponInstance.duration
  }

  apply(target: Upgradeable, sim: Simulation): void {
    if (target.weapon !== undefined && target.weaponTimer !== undefined) {
      const newWeapon = new this.weaponClass()
      target.weapon = newWeapon
      target.weaponTimer = this.duration
      // Создаем эффект применения
      EffectSpawnService.createExplosion(target.x, target.y, 15, target.color || '#10b981', sim)
    }
  }
}

