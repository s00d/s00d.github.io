import type { Effect } from '../types'
import { UpgradeFactory } from '../upgrades/UpgradeFactory'

/**
 * Интерфейс для сущностей с эффектами
 */
export interface EntityWithEffects {
  activeEffects: Effect[]
  sizeMult?: number
  speedMult?: number
  damageMult?: number
  statusIcons?: string[]
}

/**
 * Сервис для обработки эффектов сущностей
 * Устраняет дублирование кода между Ship и VoidSerpent
 */
export class EffectService {
  /**
   * Обновить эффекты сущности
   * @param entity - сущность с эффектами
   */
  static updateEffects(entity: EntityWithEffects): void {
    // Сброс множителей к дефолту (если они есть)
    if (entity.sizeMult !== undefined) entity.sizeMult = 1.0
    if (entity.speedMult !== undefined) entity.speedMult = 1.0
    if (entity.damageMult !== undefined) entity.damageMult = 1.0

    // Обработка эффектов
    for (let i = entity.activeEffects.length - 1; i >= 0; i--) {
      const eff = entity.activeEffects[i]
      if (!eff) {
        entity.activeEffects.splice(i, 1)
        continue
      }

      eff.timer--

      // Получаем апгрейд для эффекта
      const upgrade = UpgradeFactory.create(eff.type)
      if (upgrade && upgrade.updateEffect) {
        upgrade.updateEffect(entity, eff)
      }

      // Удаляем истекшие эффекты
      if (eff.timer <= 0) {
        entity.activeEffects.splice(i, 1)
        // Удаляем иконку при истечении эффекта
        if (upgrade && upgrade.removeEffect) {
          upgrade.removeEffect(entity)
        }
      }
    }
  }
}

