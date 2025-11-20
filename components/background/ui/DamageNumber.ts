import { FloatingText } from '../entities/FloatingText'
import { MathUtils } from '../utils/math'

/**
 * Класс для отображения вылетающих цифр урона
 * Инкапсулирует логику определения цвета, размера и позиции для урона
 */
export class DamageNumber extends FloatingText {
  /**
   * Создает новый экземпляр цифры урона
   * @param x - X координата
   * @param y - Y координата
   * @param damage - значение урона
   * @param isCrit - является ли урон критическим
   */
  constructor(x: number, y: number, damage: number, isCrit: boolean = false) {
    const text = Math.floor(damage).toString()
    const color = isCrit ? '#ef4444' : '#ffffff' // Красный для крита, белый обычный
    const size = isCrit ? 24 : 14

    // Немного рандомизируем позицию, чтобы цифры не слипались
    const offsetX = MathUtils.randomRange(-10, 10)
    const offsetY = MathUtils.randomRange(-10, 10)

    super(x + offsetX, y + offsetY, text, color)
    this.size = size

    // Для крита делаем более заметную анимацию
    if (isCrit) {
      this.vy = -2.0 // Быстрее летит вверх
      this.vx = MathUtils.randomRange(-1, 1) // Больше разброс
    }
  }

  /**
   * Статический метод для создания цифры урона
   * @param x - X координата
   * @param y - Y координата
   * @param damage - значение урона
   * @param isCrit - является ли урон критическим
   * @returns экземпляр DamageNumber
   */
  static create(x: number, y: number, damage: number, isCrit: boolean = false): DamageNumber {
    return new DamageNumber(x, y, damage, isCrit)
  }
}

