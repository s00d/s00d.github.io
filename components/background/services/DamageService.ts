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
    serpents: readonly VoidSerpent[]
  ): Array<{ serpent: VoidSerpent, damage: number, pushAngle: number }> {
    const affected: Array<{ serpent: VoidSerpent, damage: number, pushAngle: number }> = []

    const radiusSq = radius * radius
    for (const s of serpents) {
      // Проверяем расстояние до каждого сегмента змеи, чтобы попасть наверняка (оптимизировано через distSq)
      let hit = false
      for (const seg of s.segments) {
        const distSq = MathUtils.distSq({x, y}, seg)
        if (distSq < radiusSq) {
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

