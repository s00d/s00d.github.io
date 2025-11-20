import type { PowerUpType } from '../types'
import { UpgradeFactory } from '../upgrades/UpgradeFactory'
import type { Upgrade } from '../upgrades/Upgrade'

/**
 * Фабрика для генерации типов power-up
 * Использует систему весов из классов апгрейдов
 */
export class PowerUpFactory {
  private static totalWeight: number = 0
  private static initialized: boolean = false
  private static upgradeList: Upgrade[] = []

  /**
   * Инициализирует список апгрейдов и общий вес
   */
  private static initialize(): void {
    if (this.initialized) return

    // Получаем все апгрейды из UpgradeFactory
    const allTypes: PowerUpType[] = [
      'SPEED_BOOST', 'DAMAGE_BOOST', 'SIZE_UP', 'SIZE_DOWN',
      'GET_SHIELD', 'GET_TELEPORT', 'UPGRADE_RANGE', 'UPGRADE_BOMB',
      'HEAL',
      'GET_MINIGUN', 'GET_SHOTGUN', 'GET_RAILGUN', 'GET_MISSILE',
      'GET_PLASMA', 'GET_FLAK', 'GET_WAVE', 'GET_SNIPER',
      'SLOW_DOWN', 'WEAPON_JAM'
    ]

    this.upgradeList = []
    for (const type of allTypes) {
      const upgrade = UpgradeFactory.create(type)
      if (upgrade && upgrade.weight > 0) {
        this.upgradeList.push(upgrade)
      }
    }

    this.totalWeight = this.upgradeList.reduce((sum, upgrade) => sum + upgrade.weight, 0)
    this.initialized = true
  }

  /**
   * Генерирует случайный тип power-up на основе весов
   * @returns объект с типом и флагом isGood
   */
  static generateType(): { type: PowerUpType, isGood: boolean } {
    this.initialize()

    if (this.upgradeList.length === 0) {
      return { type: 'HEAL', isGood: true }
    }

    const rand = Math.random() * this.totalWeight
    let accumulatedWeight = 0

    for (const upgrade of this.upgradeList) {
      accumulatedWeight += upgrade.weight
      if (rand < accumulatedWeight) {
        return { type: upgrade.type, isGood: upgrade.isGood }
      }
    }

    // Fallback на последний элемент (не должно произойти)
    const last = this.upgradeList[this.upgradeList.length - 1]
    if (last) {
      return { type: last.type, isGood: last.isGood }
    }
    // Если массив пуст (не должно произойти)
    return { type: 'HEAL', isGood: true }
  }
}

