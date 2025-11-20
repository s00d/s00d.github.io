import { MathUtils } from '../utils/math'
import type { VoidSerpent } from '../entities/VoidSerpent'

/**
 * Сервис для расчета урона и AOE эффектов
 */
export class DamageService {
  /**
   * Применяет урон по площади (AOE) к змеям
   * @param x - координата X взрыва
   * @param y - координата Y взрыва
   * @param radius - радиус взрыва
   * @param damage - урон
   * @param serpents - массив змей
   * @returns массив затронутых змей с информацией об уроне
   */
  static applyAoeDamage(
    x: number,
    y: number,
    radius: number,
    damage: number,
    serpents: VoidSerpent[]
  ): Array<{ serpent: VoidSerpent, damage: number, pushAngle: number }> {
    const affected: Array<{ serpent: VoidSerpent, damage: number, pushAngle: number }> = []

    for (const s of serpents) {
      // Проверяем расстояние до каждого сегмента змеи, чтобы попасть наверняка
      let hit = false
      for (const seg of s.segments) {
        const dist = MathUtils.dist({x, y}, seg)
        if (dist < radius) {
          hit = true
          break
        }
      }

      if (hit) {
        const angle = MathUtils.angle({x, y}, s)
        affected.push({
          serpent: s,
          damage,
          pushAngle: angle
        })
      }
    }

    return affected
  }
}

