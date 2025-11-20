import type { CanvasService } from '../services/CanvasService'

/**
 * Класс для отрисовки бара перезарядки
 */
export class CooldownBar {
  /**
   * Рисует бар перезарядки
   * @param canvas - сервис канваса
   * @param x - X координата центра
   * @param y - Y координата центра
   * @param width - ширина бара
   * @param height - высота бара
   * @param currentTime - текущее время кулдауна
   * @param maxTime - максимальное время кулдауна
   */
  static draw(
    canvas: CanvasService,
    x: number,
    y: number,
    width: number,
    height: number,
    currentTime: number,
    maxTime: number
  ): void {
    if (currentTime <= 0 || maxTime <= 0) return
    
    const ratio = Math.max(0, Math.min(1, 1 - (currentTime / maxTime)))
    
    // Фон (черный полупрозрачный)
    canvas.drawRect(x - width / 2, y, width, height, 'rgba(0,0,0,0.6)')
    
    // Желтая полоса перезарядки
    canvas.drawRect(x - width / 2, y, width * ratio, height, '#fbbf24')
  }
}

