import type { Simulation } from '../simulation'
import type { BlackHole } from '../entities/BlackHole'
import { economy } from '../economy'

/**
 * Сервис для логики улучшений черной дыры
 * Отвечает за автоматическую покупку улучшений, расчет стоимости и применение дебаффов
 */
export class BlackHoleUpgradeService {
  /**
   * Применяет дебаффы из economy к черной дыре
   */
  static applyDebuffs(blackHole: BlackHole): void {
    blackHole.debuffs.serpentCost = economy.blackHoleSerpentCostDebuff
    blackHole.debuffs.balanceRate = economy.blackHoleBalanceRateDebuff
    blackHole.debuffs.darkMatterRate = economy.blackHoleDarkMatterRateDebuff
  }

  /**
   * Автоматически покупает первое доступное улучшение черной дыры
   */
  static autoBuyUpgrade(blackHole: BlackHole): void {
    const upgrades = [
      { type: 'serpentBaseCost' as const, cost: this.getUpgradeCost(blackHole, 'serpentBaseCost') },
      { type: 'serpentHealth' as const, cost: this.getUpgradeCost(blackHole, 'serpentHealth') },
      { type: 'serpentSpeed' as const, cost: this.getUpgradeCost(blackHole, 'serpentSpeed') },
      { type: 'serpentDamage' as const, cost: this.getUpgradeCost(blackHole, 'serpentDamage') },
      { type: 'balanceRate' as const, cost: this.getUpgradeCost(blackHole, 'balanceRate') }
    ]

    // Сортируем по стоимости (от дешевых к дорогим)
    upgrades.sort((a, b) => a.cost - b.cost)

    // Покупаем первое доступное улучшение за darkMatter из economy
    for (const upgrade of upgrades) {
      if (economy.darkMatter >= upgrade.cost) {
        economy.darkMatter -= upgrade.cost
        blackHole.upgrades[upgrade.type]++
        break
      }
    }
  }

  /**
   * Получить стоимость улучшения черной дыры
   */
  static getUpgradeCost(blackHole: BlackHole, type: keyof typeof blackHole.upgrades): number {
    const level = blackHole.upgrades[type]
    const baseCosts: Record<keyof typeof blackHole.upgrades, number> = {
      serpentBaseCost: 200,
      serpentHealth: 300,
      serpentSpeed: 250,
      serpentDamage: 400,
      balanceRate: 500
    }
    const multipliers: Record<keyof typeof blackHole.upgrades, number> = {
      serpentBaseCost: 1.5,
      serpentHealth: 1.6,
      serpentSpeed: 1.55,
      serpentDamage: 1.65,
      balanceRate: 1.7
    }

    const base = baseCosts[type]
    const mult = multipliers[type]
    return Math.floor(base * Math.pow(mult, level))
  }
}

