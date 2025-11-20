/**
 * Утилиты для генерации неонового свечения
 */

export interface GlowConfig {
  color: string
  intensity: number // 0-1
  blur: number
  spread?: number
}

/**
 * Применяет неоновое свечение к контексту canvas
 */
export function applyGlow(ctx: CanvasRenderingContext2D, config: GlowConfig) {
  ctx.shadowColor = config.color
  ctx.shadowBlur = config.blur * config.intensity
  if (config.spread !== undefined) {
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  }
}

/**
 * Создает градиент для неонового свечения
 */
export function createGlowGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  intensity: number = 1.0
): CanvasGradient {
  const gradient = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius * 2)
  const alpha = Math.min(1, intensity * 0.8)

  // Конвертируем hex в rgba
  let rgbaColor = color
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16)
    const g = parseInt(color.slice(3, 5), 16)
    const b = parseInt(color.slice(5, 7), 16)
    rgbaColor = `rgba(${r}, ${g}, ${b}, ${alpha})`
  } else if (color.startsWith('rgb')) {
    rgbaColor = color.replace('rgb', 'rgba').replace(')', `, ${alpha})`)
  }

  gradient.addColorStop(0, color)
  gradient.addColorStop(0.5, rgbaColor)
  gradient.addColorStop(1, 'transparent')
  return gradient
}

/**
 * Рисует неоновое кольцо
 */
export function drawGlowRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  config: GlowConfig
) {
  ctx.save()
  applyGlow(ctx, config)
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.strokeStyle = config.color
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.restore()
}

/**
 * Рисует неоновую линию
 */
export function drawGlowLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  config: GlowConfig,
  lineWidth: number = 2
) {
  ctx.save()
  applyGlow(ctx, config)
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.strokeStyle = config.color
  ctx.lineWidth = lineWidth
  ctx.stroke()
  ctx.restore()
}

/**
 * Рисует неоновый круг
 */
export function drawGlowCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  config: GlowConfig
) {
  ctx.save()
  applyGlow(ctx, config)
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = config.color
  ctx.fill()
  ctx.restore()
}

/**
 * Создает пульсирующее свечение (для анимации)
 */
export function getPulsingGlow(baseIntensity: number, time: number, speed: number = 1.0): number {
  return baseIntensity * (0.7 + 0.3 * Math.sin(time * speed))
}

