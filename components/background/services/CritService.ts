import { EconomyService } from './EconomyService'

/**
 * Сервис для расчета критического урона
 */
export class CritService {
  /**
   * Рассчитывает критический урон
   * @param baseDamage - базовый урон
   * @param critLevel - уровень крита (по умолчанию из EconomyService)
   * @returns объект с итоговым уроном и флагом крита
   */
  static calculateCritDamage(baseDamage: number, critLevel?: number): { damage: number, isCrit: boolean } {
    const level = critLevel ?? EconomyService.getCritLevel()
    const critChance = level * 0.05 // 5% шанс за уровень
    const isCrit = Math.random() < critChance

    if (isCrit) {
      return { damage: baseDamage * 2.0, isCrit: true } // Крит x2
    }

    return { damage: baseDamage, isCrit: false }
  }
}

