import type { PowerUpType } from '../types'
import type { Ship } from '../entities/Ship'
import type { VoidSerpent } from '../entities/VoidSerpent'

export interface Upgradeable {
  activeEffects: Array<{ type: PowerUpType; timer: number }>
  statusIcons: string[]
  hp?: number
  maxHp?: number
  shield?: number
  maxShield?: number
  hasTeleport?: boolean
  bombLevel?: number
  rangeMult?: number
  sizeMult?: number
  weapon?: any
  weaponTimer?: number
  // Модификаторы, управляемые апгрейдами
  speedMult?: number
  damageMult?: number
  reloadMult?: number
  isJammed?: boolean
}

export interface EffectModifiers {
  speedMult?: number
  damageMult?: number
  reloadMult?: number
  sizeMult?: number
  isJammed?: boolean
}

/**
 * Базовый класс для всех апгрейдов
 * Апгрейд сам управляет изменением состояния объекта
 */
export abstract class Upgrade {
  abstract readonly type: PowerUpType
  abstract readonly duration: number // Длительность эффекта в кадрах (0 = мгновенный)
  abstract readonly icon: string // Иконка для отображения
  abstract readonly weight: number // Вес вероятности появления (чем больше, тем чаще)
  abstract readonly isGood: boolean // Является ли апгрейд положительным

  /**
   * Применяет апгрейд к объекту
   * @param target - корабль или призрак
   */
  abstract apply(target: Upgradeable): void

  /**
   * Обновляет эффект апгрейда (для временных эффектов)
   * Апгрейд напрямую изменяет свойства target
   * @param target - корабль или призрак
   * @param effect - текущий эффект
   */
  updateEffect?(target: Upgradeable, effect: { type: PowerUpType; timer: number }): void

  /**
   * Удаляет эффект апгрейда (для очистки)
   * @param target - корабль или призрак
   */
  removeEffect?(target: Upgradeable): void

  /**
   * Получить иконку для отображения
   */
  getIcon(): string {
    return this.icon
  }
}

