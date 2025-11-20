import { economy } from '../economy'

/**
 * Сервис для доступа к экономике
 * Инкапсулирует логику расчета множителей из economy
 */
export class EconomyService {
  /**
   * Получить множитель урона на основе уровня урона в economy
   */
  static getDamageMultiplier(): number {
    return 1.0 + (economy.damageLevel - 1) * 0.2
  }

  /**
   * Получить множитель перезарядки на основе уровня скорости турели в economy
   */
  static getReloadMultiplier(): number {
    return 1.0 + (economy.turretSpeed - 1) * 0.15
  }

  /**
   * Получить скорость регенерации (количество кадров между восстановлением HP)
   * Ур 1: раз в 300 кадров (5 сек). Ур 5: раз в 60 кадров (1 сек).
   */
  static getRegenRate(): number {
    return Math.max(60, 360 - (economy.regenLevel * 60))
  }

  /**
   * Получить уровень регенерации
   */
  static getRegenLevel(): number {
    return economy.regenLevel
  }

  /**
   * Получить уровень крита
   */
  static getCritLevel(): number {
    return economy.critLevel
  }

  /**
   * Получить уровень корпуса
   */
  static getHullLevel(): number {
    return economy.hullLevel
  }

  /**
   * Получить уровень щита
   */
  static getShieldLevel(): number {
    return economy.shieldLevel
  }
}

