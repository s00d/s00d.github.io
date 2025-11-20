/**
 * Кеш для хранения предварительно сгенерированной графики
 */

export interface CachedGraphics {
  canvas: HTMLCanvasElement
  width: number
  height: number
  key: string
}

class GraphicsCache {
  private cache: Map<string, CachedGraphics> = new Map()
  private maxSize: number = 100

  /**
   * Создает новый canvas для кеширования
   */
  createCanvas(width: number, height: number): HTMLCanvasElement {
    // Используем обычный canvas для совместимости
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    return canvas
  }

  /**
   * Получает кешированную графику по ключу
   */
  get(key: string): CachedGraphics | undefined {
    return this.cache.get(key)
  }

  /**
   * Сохраняет графику в кеш
   */
  set(key: string, graphics: CachedGraphics): void {
    // Ограничиваем размер кеша
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, graphics)
  }

  /**
   * Проверяет наличие в кеше
   */
  has(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Очищает кеш
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Генерирует ключ для кеша на основе параметров
   */
  generateKey(prefix: string, params: Record<string, any>): string {
    const paramStr = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|')
    return `${prefix}:${paramStr}`
  }
}

export const graphicsCache = new GraphicsCache()

