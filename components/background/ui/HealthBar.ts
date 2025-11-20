import type { CanvasService } from '../services/CanvasService'

/**
 * Класс для отрисовки бара здоровья
 */
export class HealthBar {
  /**
   * Рисует бар здоровья
   * @param canvas - сервис канваса
   * @param x - X координата центра
   * @param y - Y координата центра
   * @param width - ширина бара
   * @param height - высота бара
   * @param value - текущее значение HP
   * @param maxValue - максимальное значение HP
   */
  static draw(
    canvas: CanvasService,
    x: number,
    y: number,
    width: number,
    height: number,
    value: number,
    maxValue: number
  ): void {
    const ratio = Math.max(0, Math.min(1, value / maxValue))
    
    // Фон (черный полупрозрачный)
    canvas.drawRect(x - width / 2, y, width, height, 'rgba(0,0,0,0.6)')
    
    // Зеленая полоса здоровья
    canvas.drawRect(x - width / 2, y, width * ratio, height, '#00ff00')
  }
}

