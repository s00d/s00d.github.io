import { Upgrade, type Upgradeable } from './Upgrade'
import type { PowerUpType } from '../types'
import type { Simulation } from '../simulation'
import { HealUpgrade } from './HealUpgrade'
import { SpeedBoostUpgrade } from './SpeedBoostUpgrade'
import { DamageBoostUpgrade } from './DamageBoostUpgrade'
import { RapidFireUpgrade } from './RapidFireUpgrade'
import { SlowDownUpgrade } from './SlowDownUpgrade'
import { WeaponJamUpgrade } from './WeaponJamUpgrade'
import { SizeUpUpgrade } from './SizeUpUpgrade'
import { SizeDownUpgrade } from './SizeDownUpgrade'
import { ShieldUpgrade } from './ShieldUpgrade'
import { TeleportUpgrade } from './TeleportUpgrade'
import { BombUpgrade } from './BombUpgrade'
import { RangeUpgrade } from './RangeUpgrade'
import { WeaponUpgrade } from './WeaponUpgrade'
import { CoinUpgrade } from './CoinUpgrade'
import { Minigun } from '../weapons/Minigun'
import { Shotgun } from '../weapons/Shotgun'
import { Railgun } from '../weapons/Railgun'
import { MissileLauncher } from '../weapons/MissileLauncher'
import { PlasmaGun } from '../weapons/PlasmaGun'
import { FlakCannon } from '../weapons/FlakCannon'
import { WaveGun } from '../weapons/WaveGun'
import { SniperRifle } from '../weapons/SniperRifle'

export class UpgradeFactory {
  private static upgrades: Map<PowerUpType, Upgrade> = new Map()

  static {
    // Инициализация всех апгрейдов
    this.upgrades.set('HEAL', new HealUpgrade())
    this.upgrades.set('SPEED_BOOST', new SpeedBoostUpgrade())
    this.upgrades.set('DAMAGE_BOOST', new DamageBoostUpgrade())
    this.upgrades.set('RAPID_FIRE', new RapidFireUpgrade())
    this.upgrades.set('SLOW_DOWN', new SlowDownUpgrade())
    this.upgrades.set('WEAPON_JAM', new WeaponJamUpgrade())
    this.upgrades.set('SIZE_UP', new SizeUpUpgrade())
    this.upgrades.set('SIZE_DOWN', new SizeDownUpgrade())
    this.upgrades.set('GET_SHIELD', new ShieldUpgrade())
    this.upgrades.set('GET_TELEPORT', new TeleportUpgrade())
    this.upgrades.set('UPGRADE_BOMB', new BombUpgrade())
    this.upgrades.set('UPGRADE_RANGE', new RangeUpgrade())
    this.upgrades.set('COIN', new CoinUpgrade())
    
    // Оружие
    this.upgrades.set('GET_MINIGUN', new WeaponUpgrade('GET_MINIGUN', Minigun, '∴', 5))
    this.upgrades.set('GET_SHOTGUN', new WeaponUpgrade('GET_SHOTGUN', Shotgun, '⋗', 5))
    this.upgrades.set('GET_RAILGUN', new WeaponUpgrade('GET_RAILGUN', Railgun, '━', 4))
    this.upgrades.set('GET_MISSILE', new WeaponUpgrade('GET_MISSILE', MissileLauncher, '🚀', 4))
    this.upgrades.set('GET_PLASMA', new WeaponUpgrade('GET_PLASMA', PlasmaGun, '🟣', 4))
    this.upgrades.set('GET_FLAK', new WeaponUpgrade('GET_FLAK', FlakCannon, '💥', 4))
    this.upgrades.set('GET_WAVE', new WeaponUpgrade('GET_WAVE', WaveGun, '〰️', 3))
    this.upgrades.set('GET_SNIPER', new WeaponUpgrade('GET_SNIPER', SniperRifle, '🎯', 3))
  }

  /**
   * Создает апгрейд по типу
   */
  static create(type: PowerUpType): Upgrade | null {
    return this.upgrades.get(type) || null
  }

  /**
   * Применяет апгрейд к объекту
   */
  static apply(type: PowerUpType, target: Upgradeable, sim: Simulation): void {
    const upgrade = this.create(type)
    if (upgrade) {
      upgrade.apply(target, sim)
    }
  }
}

