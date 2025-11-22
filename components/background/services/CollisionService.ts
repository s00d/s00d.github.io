import { MathUtils } from '../utils/math'
import type { Entity } from '../entities/Entity'

/**
 * Универсальный сервис для проверки столкновений
 */
export class CollisionService {
  /**
   * Проверяет столкновение двух кругов
   * @param a - первая сущность
   * @param b - вторая сущность
   * @param radiusA - радиус первой сущности
   * @param radiusB - радиус второй сущности
   * @returns true, если произошло столкновение
   */
  static checkCircleCollision(
    a: Entity | { x: number; y: number },
    b: Entity | { x: number; y: number },
    radiusA: number,
    radiusB: number
  ): boolean {
    // Оптимизация: используем distSq для избежания sqrt
    const distSq = MathUtils.distSq(a, b)
    const radiusSum = radiusA + radiusB
    return distSq < (radiusSum * radiusSum)
  }

  /**
   * Проверяет, находится ли точка внутри круга
   * @param point - точка
   * @param center - центр круга
   * @param radius - радиус круга
   * @returns true, если точка внутри круга
   */
  static checkPointInCircle(
    point: { x: number; y: number },
    center: Entity | { x: number; y: number },
    radius: number
  ): boolean {
    // Оптимизация: используем distSq для избежания sqrt
    const distSq = MathUtils.distSq(point, center)
    return distSq < (radius * radius)
  }

  /**
   * Проверяет столкновение снаряда с сегментами змеи
   * @param projectile - снаряд
   * @param segments - массив сегментов змеи
   * @param segmentRadius - радиус сегмента
   * @param projectileRadius - радиус снаряда
   * @returns true, если произошло столкновение
   */
  static checkSegmentCollision(
    projectile: Entity | { x: number; y: number },
    segments: Array<{ x: number; y: number }>,
    segmentRadius: number,
    projectileRadius: number
  ): boolean {
    for (const seg of segments) {
      if (this.checkCircleCollision(projectile, seg, projectileRadius, segmentRadius)) {
        return true
      }
    }
    return false
  }

  /**
   * Проверяет столкновение снаряда с кораблем
   * @param projectile - снаряд
   * @param ship - корабль
   * @param shipBaseRadius - базовый радиус корабля
   * @param shipSizeMult - множитель размера корабля
   * @param projectileRadius - радиус снаряда
   * @returns true, если произошло столкновение
   */
  static checkShipCollision(
    projectile: Entity | { x: number; y: number },
    ship: Entity & { sizeMult?: number },
    shipBaseRadius: number,
    projectileRadius: number
  ): boolean {
    const shipRadius = shipBaseRadius * (ship.sizeMult || 1.0)
    return this.checkCircleCollision(projectile, ship, projectileRadius, shipRadius)
  }
}

