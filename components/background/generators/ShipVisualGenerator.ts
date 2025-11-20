import { MathUtils } from '../utils/math'

/**
 * Типы корпусов кораблей
 */
export enum ShipHullType {
  TRIANGLE = 'TRIANGLE',      // Классический треугольник
  ARROW = 'ARROW',            // Стрела (острый нос)
  DIAMOND = 'DIAMOND',        // Ромб
  FIGHTER = 'FIGHTER',        // Истребитель (с крыльями)
  INTERCEPTOR = 'INTERCEPTOR', // Перехватчик (узкий и длинный)
  SCOUT = 'SCOUT',            // Разведчик (компактный)
  CRUISER = 'CRUISER',        // Крейсер (широкий)
  BOMBER = 'BOMBER'           // Бомбардировщик (тяжелый)
}

/**
 * Стиль корабля
 */
export enum ShipStyle {
  SHARP = 'SHARP',      // Острые углы
  ROUNDED = 'ROUNDED',  // Закругленные углы
  ANGULAR = 'ANGULAR'   // Угловатый
}

/**
 * Конфигурация визуала корабля
 */
export interface ShipVisualConfig {
  hullType: ShipHullType
  style: ShipStyle
  length: number        // Длина корабля
  width: number         // Ширина корабля
  noseSharpness: number // Острота носа (0-1)
  hasWings: boolean     // Есть ли крылья
  hasCockpit: boolean   // Есть ли кабина
  hasAntenna: boolean   // Есть ли антенна
  wingSize: number      // Размер крыльев (если есть)
  detailLevel: number   // Уровень детализации (0-1)
  points: Array<{ x: number; y: number }> // Точки для отрисовки корпуса
}

/**
 * Генератор визуала кораблей
 * Создает уникальные визуальные варианты для каждого корабля
 */
export class ShipVisualGenerator {
  private static seedCounter: number = 0

  /**
   * Генерирует уникальную конфигурацию визуала для корабля
   * @param seed - опциональное начальное значение для генератора
   * @returns конфигурация визуала
   */
  static generate(seed?: number): ShipVisualConfig {
    const rng = this.createRNG(seed)

    // Выбираем тип корпуса
    const hullTypes = Object.values(ShipHullType)
    const hullType = hullTypes[Math.floor(rng() * hullTypes.length)] as ShipHullType

    // Выбираем стиль
    const styles = Object.values(ShipStyle)
    const style = styles[Math.floor(rng() * styles.length)] as ShipStyle

    // Генерируем параметры
    const length = 8 + rng() * 6  // 8-14
    const width = 4 + rng() * 4   // 4-8
    const noseSharpness = rng()
    const hasWings = rng() > 0.4
    const hasCockpit = rng() > 0.6
    const hasAntenna = rng() > 0.7
    const wingSize = hasWings ? 0.5 + rng() * 0.5 : 0
    const detailLevel = rng()

    // Генерируем точки корпуса в зависимости от типа
    const points = this.generateHullPoints(hullType, style, length, width, noseSharpness, rng)

    return {
      hullType,
      style,
      length,
      width,
      noseSharpness,
      hasWings,
      hasCockpit,
      hasAntenna,
      wingSize,
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
   * Генерирует точки корпуса в зависимости от типа
   */
  private static generateHullPoints(
    hullType: ShipHullType,
    style: ShipStyle,
    length: number,
    width: number,
    noseSharpness: number,
    rng: () => number
  ): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = []
    const roundness = style === ShipStyle.ROUNDED ? 0.3 : style === ShipStyle.ANGULAR ? 0 : 0.1

    switch (hullType) {
      case ShipHullType.TRIANGLE:
        // Классический треугольник
        points.push({ x: length, y: 0 })                    // Нос
        points.push({ x: -length * 0.4, y: width })         // Левый задний
        points.push({ x: -length * 0.2, y: 0 })              // Центр задней части
        points.push({ x: -length * 0.4, y: -width })        // Правый задний
        break

      case ShipHullType.ARROW:
        // Стрела с острым носом
        const arrowNose = length * (0.7 + noseSharpness * 0.3)
        points.push({ x: arrowNose, y: 0 })                  // Острый нос
        points.push({ x: -length * 0.3, y: width * 0.8 })   // Левый задний
        points.push({ x: -length * 0.5, y: 0 })             // Центр задней части
        points.push({ x: -length * 0.3, y: -width * 0.8 })  // Правый задний
        break

      case ShipHullType.DIAMOND:
        // Ромб
        points.push({ x: length * 0.6, y: 0 })               // Верхний нос
        points.push({ x: 0, y: width })                     // Левый
        points.push({ x: -length * 0.6, y: 0 })             // Нижний задний
        points.push({ x: 0, y: -width })                    // Правый
        break

      case ShipHullType.FIGHTER:
        // Истребитель с крыльями
        points.push({ x: length, y: 0 })                    // Нос
        points.push({ x: -length * 0.2, y: width * 1.2 })  // Левый задний (крыло)
        points.push({ x: -length * 0.4, y: width * 0.3 })  // Левый центр
        points.push({ x: -length * 0.3, y: 0 })            // Центр задней части
        points.push({ x: -length * 0.4, y: -width * 0.3 }) // Правый центр
        points.push({ x: -length * 0.2, y: -width * 1.2 }) // Правый задний (крыло)
        break

      case ShipHullType.INTERCEPTOR:
        // Перехватчик - узкий и длинный
        points.push({ x: length * 1.2, y: 0 })               // Длинный нос
        points.push({ x: -length * 0.3, y: width * 0.6 })  // Левый задний
        points.push({ x: -length * 0.1, y: 0 })            // Центр задней части
        points.push({ x: -length * 0.3, y: -width * 0.6 }) // Правый задний
        break

      case ShipHullType.SCOUT:
        // Разведчик - компактный
        points.push({ x: length * 0.8, y: 0 })              // Нос
        points.push({ x: -length * 0.3, y: width * 0.7 })  // Левый задний
        points.push({ x: -length * 0.2, y: 0 })            // Центр задней части
        points.push({ x: -length * 0.3, y: -width * 0.7 }) // Правый задний
        break

      case ShipHullType.CRUISER:
        // Крейсер - широкий
        points.push({ x: length * 0.9, y: 0 })             // Нос
        points.push({ x: -length * 0.1, y: width * 1.3 }) // Левый задний
        points.push({ x: -length * 0.3, y: width * 0.5 }) // Левый центр
        points.push({ x: -length * 0.4, y: 0 })           // Центр задней части
        points.push({ x: -length * 0.3, y: -width * 0.5 }) // Правый центр
        points.push({ x: -length * 0.1, y: -width * 1.3 }) // Правый задний
        break

      case ShipHullType.BOMBER:
        // Бомбардировщик - тяжелый и широкий
        points.push({ x: length * 0.7, y: 0 })            // Нос
        points.push({ x: 0, y: width * 1.1 })             // Левый верх
        points.push({ x: -length * 0.4, y: width * 0.8 }) // Левый задний
        points.push({ x: -length * 0.5, y: 0 })           // Центр задней части
        points.push({ x: -length * 0.4, y: -width * 0.8 }) // Правый задний
        points.push({ x: 0, y: -width * 1.1 })            // Правый верх
        break
    }

    return points
  }

  /**
   * Получить случайный тип корпуса
   */
  static getRandomHullType(): ShipHullType {
    const types = Object.values(ShipHullType)
    return types[Math.floor(Math.random() * types.length)] as ShipHullType
  }

  /**
   * Получить случайный стиль
   */
  static getRandomStyle(): ShipStyle {
    const styles = Object.values(ShipStyle)
    return styles[Math.floor(Math.random() * styles.length)] as ShipStyle
  }
}

