import { FloatingText } from '../entities/FloatingText'
import { MathUtils } from '../utils/math'

/**
 * Класс для отображения вылетающих цифр награды (монет)
 * Инкапсулирует логику определения цвета, размера и позиции для награды
 */
export class CoinReward extends FloatingText {
  /**
   * Создает новый экземпляр цифры награды
   * @param x - X координата
   * @param y - Y координата
   * @param amount - количество монет
   */
  constructor(x: number, y: number, amount: number) {
    const text = `+${Math.floor(amount)}$`
    const color = '#fbbf24' // Золотой цвет
    const size = 18

    // Немного рандомизируем позицию, чтобы цифры не слипались
    const offsetX = MathUtils.randomRange(-10, 10)
    const offsetY = MathUtils.randomRange(-10, 10)

    super(x + offsetX, y + offsetY, text, color)
    this.size = size

    // Для награды делаем более плавную анимацию
    this.vy = -1.2 // Медленнее чем урон, но все равно вверх
    this.vx = MathUtils.randomRange(-0.3, 0.3) // Меньше разброс
  }

  /**
   * Статический метод для создания цифры награды
   * @param x - X координата
   * @param y - Y координата
   * @param amount - количество монет
   * @returns экземпляр CoinReward
   */
  static create(x: number, y: number, amount: number): CoinReward {
    return new CoinReward(x, y, amount)
  }
}

