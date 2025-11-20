import { applyGlow, clearGlow } from '../utils/glow'

export interface GlowOptions {
  color: string
  intensity: number
  blur: number
}

/**
 * Сервис для абстракции работы с канвасом
 * Инкапсулирует все операции рисования
 */
export class CanvasService {
  private ctx: CanvasRenderingContext2D

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  /**
   * Сохраняет состояние контекста
   */
  save(): void {
    this.ctx.save()
  }

  /**
   * Восстанавливает состояние контекста
   */
  restore(): void {
    this.ctx.restore()
  }

  /**
   * Перемещает начало координат
   */
  translate(x: number, y: number): void {
    this.ctx.translate(x, y)
  }

  /**
   * Поворачивает контекст
   */
  rotate(angle: number): void {
    this.ctx.rotate(angle)
  }

  /**
   * Масштабирует контекст
   */
  scale(x: number, y: number): void {
    this.ctx.scale(x, y)
  }

  /**
   * Устанавливает глобальную прозрачность
   */
  setGlobalAlpha(alpha: number): void {
    this.ctx.globalAlpha = alpha
  }

  /**
   * Рисует круг
   */
  drawCircle(x: number, y: number, radius: number, color: string, glow?: GlowOptions): void {
    this.ctx.save()
    if (glow) {
      applyGlow(this.ctx, glow)
    }
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, Math.PI * 2)
    this.ctx.fillStyle = color
    this.ctx.fill()
    if (glow) {
      clearGlow(this.ctx)
    }
    this.ctx.restore()
  }

  /**
   * Рисует прямоугольник
   */
  drawRect(x: number, y: number, width: number, height: number, color: string): void {
    this.ctx.fillStyle = color
    this.ctx.fillRect(x, y, width, height)
  }

  /**
   * Рисует линию
   */
  drawLine(x1: number, y1: number, x2: number, y2: number, color: string, width: number = 1): void {
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.moveTo(x1, y1)
    this.ctx.lineTo(x2, y2)
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = width
    this.ctx.stroke()
    this.ctx.restore()
  }

  /**
   * Рисует текст
   */
  drawText(x: number, y: number, text: string, font: string, color: string, align: CanvasTextAlign = 'center'): void {
    this.ctx.save()
    this.ctx.font = font
    this.ctx.textAlign = align
    this.ctx.fillStyle = color
    this.ctx.fillText(text, x, y)
    this.ctx.restore()
  }

  /**
   * Начинает новый путь
   */
  beginPath(): void {
    this.ctx.beginPath()
  }

  /**
   * Перемещает перо в точку
   */
  moveTo(x: number, y: number): void {
    this.ctx.moveTo(x, y)
  }

  /**
   * Рисует линию к точке
   */
  lineTo(x: number, y: number): void {
    this.ctx.lineTo(x, y)
  }

  /**
   * Заполняет текущий путь
   */
  fill(color?: string): void {
    if (color) {
      this.ctx.fillStyle = color
    }
    this.ctx.fill()
  }

  /**
   * Обводит текущий путь
   */
  stroke(color?: string, width?: number): void {
    if (color) {
      this.ctx.strokeStyle = color
    }
    if (width !== undefined) {
      this.ctx.lineWidth = width
    }
    this.ctx.stroke()
  }

  /**
   * Устанавливает стиль заливки
   */
  setFillStyle(color: string): void {
    this.ctx.fillStyle = color
  }

  /**
   * Устанавливает стиль обводки
   */
  setStrokeStyle(color: string): void {
    this.ctx.strokeStyle = color
  }

  /**
   * Устанавливает ширину линии
   */
  setLineWidth(width: number): void {
    this.ctx.lineWidth = width
  }

  /**
   * Устанавливает шрифт
   */
  setFont(font: string): void {
    this.ctx.font = font
  }

  /**
   * Устанавливает выравнивание текста
   */
  setTextAlign(align: CanvasTextAlign): void {
    this.ctx.textAlign = align
  }

  /**
   * Устанавливает пунктирную линию
   */
  setLineDash(segments: number[]): void {
    this.ctx.setLineDash(segments)
  }

  /**
   * Получить прямой доступ к контексту (для сложных операций)
   */
  getContext(): CanvasRenderingContext2D {
    return this.ctx
  }
}

