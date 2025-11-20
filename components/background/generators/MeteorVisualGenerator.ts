import { MathUtils } from '../utils/math'

/**
 * Типы форм метеоритов
 */
export enum MeteorShapeType {
  IRREGULAR = 'IRREGULAR',    // Неправильная форма
  ROCKY = 'ROCKY',            // Каменистая
  SPIKY = 'SPIKY',           // Колючая
  ROUNDED = 'ROUNDED',        // Округлая
  ANGULAR = 'ANGULAR'         // Угловатая
}

/**
 * Конфигурация визуала метеорита
 */
export interface MeteorVisualConfig {
  shapeType: MeteorShapeType
  size: number              // Базовый размер
  irregularity: number      // Неправильность формы (0-1)
  detailLevel: number       // Уровень детализации (0-1)
  points: Array<{ x: number; y: number }> // Точки для отрисовки формы
}

/**
 * Генератор визуала метеоритов
 * Создает уникальные формы для больших метеоритов
 */
export class MeteorVisualGenerator {
  private static seedCounter: number = 0

  /**
   * Генерирует уникальную конфигурацию визуала для метеорита
   * @param size - размер метеорита
   * @param seed - опциональное начальное значение для генератора
   * @returns конфигурация визуала
   */
  static generate(size: number, seed?: number): MeteorVisualConfig {
    const rng = this.createRNG(seed)

    // Выбираем тип формы
    const shapeTypes = Object.values(MeteorShapeType)
    const shapeType = shapeTypes[Math.floor(rng() * shapeTypes.length)] as MeteorShapeType

    // Генерируем параметры
    const irregularity = 0.3 + rng() * 0.5  // 0.3-0.8
    const detailLevel = rng()

    // Генерируем точки формы в зависимости от типа
    const points = this.generateShapePoints(shapeType, size, irregularity, rng)

    return {
      shapeType,
      size,
      irregularity,
      detailLevel,
      points
    }
  }

  /**
   * Создает генератор случайных чисел с seed
   */
  private static createRNG(seed?: number): () => number {
    if (seed === undefined) {
      seed = Date.now() + this.seedCounter++
    }

    let value = seed
    return () => {
      value = (value * 9301 + 49297) % 233280
      return value / 233280
    }
  }

  /**
   * Генерирует точки формы в зависимости от типа
   */
  private static generateShapePoints(
    shapeType: MeteorShapeType,
    size: number,
    irregularity: number,
    rng: () => number
  ): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = []
    const numPoints = 6 + Math.floor(rng() * 4) // 6-9 точек

    switch (shapeType) {
      case MeteorShapeType.IRREGULAR:
        // Неправильная форма - случайные точки по кругу
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2
          const radius = size * (0.7 + rng() * 0.6 * irregularity)
          points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
          })
        }
        break

      case MeteorShapeType.ROCKY:
        // Каменистая форма - неровные выступы
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2
          const radius = size * (0.8 + rng() * 0.4 * irregularity)
          points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
          })
        }
        break

      case MeteorShapeType.SPIKY:
        // Колючая форма - острые выступы
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2
          const spikeLength = i % 2 === 0 ? 1.2 : 0.8
          const radius = size * spikeLength * (0.7 + rng() * 0.3 * irregularity)
          points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
          })
        }
        break

      case MeteorShapeType.ROUNDED:
        // Округлая форма - плавные кривые
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2
          const radius = size * (0.85 + rng() * 0.3 * irregularity)
          points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
          })
        }
        break

      case MeteorShapeType.ANGULAR:
        // Угловатая форма - четкие углы
        for (let i = 0; i < numPoints; i++) {
          const angle = (i / numPoints) * Math.PI * 2
          const radius = size * (0.75 + rng() * 0.5 * irregularity)
          points.push({
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
          })
        }
        break
    }

    return points
  }

  /**
   * Получить случайный тип формы
   */
  static getRandomShapeType(): MeteorShapeType {
    const types = Object.values(MeteorShapeType)
    return types[Math.floor(Math.random() * types.length)] as MeteorShapeType
  }
}

