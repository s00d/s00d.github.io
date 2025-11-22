/**
 * Класс для генерации и отрисовки анимированной туманности на фоне
 */
export class NebulaBackground {
  private layers: Array<{
    baseX: number
    baseY: number
    baseRadius: number
    color: string
    speedX: number
    speedY: number
    pulseSpeed: number
    intensitySpeed: number
  }> = []

  constructor() {
    // Инициализируем 5 слоев туманности с разными параметрами
    this.layers = [
      {
        baseX: 0.3,
        baseY: 0.4,
        baseRadius: 0.6,
        color: '#4c1d95', // Темно-фиолетовый
        speedX: 0.0001,
        speedY: 0.00008,
        pulseSpeed: 0.0005,
        intensitySpeed: 0.0008
      },
      {
        baseX: 0.7,
        baseY: 0.6,
        baseRadius: 0.5,
        color: '#6d28d9', // Фиолетовый
        speedX: -0.00012,
        speedY: 0.0001,
        pulseSpeed: 0.0006,
        intensitySpeed: 0.0007
      },
      {
        baseX: 0.5,
        baseY: 0.3,
        baseRadius: 0.4,
        color: '#1e3a8a', // Темно-синий
        speedX: 0.00008,
        speedY: -0.0001,
        pulseSpeed: 0.0004,
        intensitySpeed: 0.0009
      },
      {
        baseX: 0.2,
        baseY: 0.7,
        baseRadius: 0.45,
        color: '#312e81', // Глубокий фиолетовый
        speedX: -0.0001,
        speedY: -0.00008,
        pulseSpeed: 0.00055,
        intensitySpeed: 0.0006
      },
      {
        baseX: 0.8,
        baseY: 0.2,
        baseRadius: 0.35,
        color: '#3b82f6', // Синий
        speedX: 0.00009,
        speedY: 0.00012,
        pulseSpeed: 0.00045,
        intensitySpeed: 0.00085
      }
    ]
  }

  /**
   * Отрисовывает туманность на канвасе
   * @param ctx - контекст канваса
   * @param width - ширина экрана
   * @param height - высота экрана
   * @param time - текущее время в миллисекундах (для анимации)
   */
  draw(ctx: CanvasRenderingContext2D, width: number, height: number, time: number): void {
    ctx.save()

    // Рисуем каждый слой туманности
    for (const layer of this.layers) {
      // Вычисляем анимированные позиции (без ускорения)
      const x = (layer.baseX + Math.sin(time * layer.speedX) * 0.2) * width
      const y = (layer.baseY + Math.cos(time * layer.speedY) * 0.2) * height

      // Вычисляем анимированный размер (пульсация)
      const pulse = Math.sin(time * layer.pulseSpeed) * 0.1 + 1.0
      const radius = layer.baseRadius * Math.max(width, height) * pulse

      // Вычисляем интенсивность (мерцание) - уменьшаем для менее яркого фона
      const intensity = (Math.sin(time * layer.intensitySpeed) * 0.2 + 0.8) * 0.5

      // Создаем радиальный градиент
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)

      // Центр градиента - более яркий
      const centerColor = this.hexToRgba(layer.color, intensity)
      gradient.addColorStop(0, centerColor)

      // Средняя часть - средняя прозрачность
      gradient.addColorStop(0.5, this.hexToRgba(layer.color, intensity * 0.7))

      // Края - прозрачные
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

      // Рисуем градиент
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
    }

    ctx.restore()
  }

  /**
   * Конвертирует hex цвет в rgba с заданной прозрачностью
   */
  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
}

