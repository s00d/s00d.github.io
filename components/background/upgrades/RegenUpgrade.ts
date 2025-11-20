import { Upgrade, type Upgradeable } from './Upgrade'
import { EconomyService } from '../services/EconomyService'

/**
 * RegenUpgrade - специальный апгрейд для регенерации HP
 * Не является PowerUp, работает через economy.regenLevel
 */
export class RegenUpgrade {
  private static instance: RegenUpgrade | null = null

  static getInstance(): RegenUpgrade {
    if (!this.instance) {
      this.instance = new RegenUpgrade()
    }
    return this.instance
  }

  /**
   * Обновляет регенерацию HP для корабля
   * @param target - корабль
   * @param regenTimer - текущий таймер регенерации (будет изменен)
   * @returns true, если HP был восстановлен
   */
  updateRegen(target: Upgradeable, regenTimer: { value: number }): boolean {
    if (EconomyService.getRegenLevel() === 0 || target.hp === undefined || target.maxHp === undefined) {
      return false
    }

    if (target.hp >= target.maxHp) {
      return false
    }

    regenTimer.value++

    const regenRate = EconomyService.getRegenRate()

    if (regenTimer.value > regenRate) {
      target.hp++
      regenTimer.value = 0
      return true
    }

    return false
  }
}


