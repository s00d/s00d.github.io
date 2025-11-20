import type { CanvasService } from '../services/CanvasService'

/**
 * Класс для отрисовки бара щита
 */
export class ShieldBar {
  /**
   * Рисует бар щита
   * @param canvas - сервис канваса
   * @param x - X координата центра
   * @param y - Y координата центра
   * @param width - ширина бара
   * @param height - высота бара
   * @param value - текущее значение щита
   * @param maxValue - максимальное значение щита
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
    const alpha = ratio
    
    // Синяя полупрозрачная полоса щита
    canvas.drawRect(x - width / 2, y, width * ratio, height, `rgba(59, 130, 246, ${alpha})`)
  }
}

