import type { CanvasService } from '../services/CanvasService'

/**
 * Класс для отрисовки бара топлива
 */
export class FuelBar {
  /**
   * Рисует бар топлива
   * @param canvas - сервис канваса
   * @param x - X координата центра
   * @param y - Y координата центра
   * @param width - ширина бара
   * @param height - высота бара
   * @param value - текущее значение топлива
   * @param maxValue - максимальное значение топлива
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
    if (value <= 0 || maxValue <= 0) return
    
    const ratio = Math.max(0, Math.min(1, value / maxValue))
    
    // Фон (темно-серый)
    canvas.drawRect(x - width / 2, y, width, height, '#555')
    
    // Оранжевая полоса топлива
    canvas.drawRect(x - width / 2, y, width * ratio, height, '#f59e0b')
  }
}

