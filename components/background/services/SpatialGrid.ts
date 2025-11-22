import type { Entity } from '../entities/Entity'

/**
 * Пространственная сетка для оптимизации проверок коллизий
 * Разбивает пространство на ячейки для быстрого поиска сущностей в области
 */
export class SpatialGrid {
  private grid: Map<string, Set<Entity>> = new Map()
  private cellSize: number

  constructor(cellSize: number = 100) {
    this.cellSize = cellSize
  }

  /**
   * Получить ключ ячейки для координат
   */
  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.cellSize)
    const cellY = Math.floor(y / this.cellSize)
    return `${cellX},${cellY}`
  }

  /**
   * Получить ключи ячеек для области (без создания массива для оптимизации памяти)
   * Использует генератор для итерации по ячейкам
   */
  private *getCellKeysForArea(x: number, y: number, radius: number): Generator<string> {
    const minX = Math.floor((x - radius) / this.cellSize)
    const maxX = Math.floor((x + radius) / this.cellSize)
    const minY = Math.floor((y - radius) / this.cellSize)
    const maxY = Math.floor((y + radius) / this.cellSize)

    // Ограничиваем размер области для предотвращения переполнения памяти
    const MAX_CELLS = 10000 // Максимум 100x100 ячеек
    const cellCount = (maxX - minX + 1) * (maxY - minY + 1)

    if (cellCount > MAX_CELLS) {
      // Если область слишком большая, ограничиваем радиус
      const limitedRadius = Math.sqrt(MAX_CELLS / Math.PI) * this.cellSize
      const limitedMinX = Math.floor((x - limitedRadius) / this.cellSize)
      const limitedMaxX = Math.floor((x + limitedRadius) / this.cellSize)
      const limitedMinY = Math.floor((y - limitedRadius) / this.cellSize)
      const limitedMaxY = Math.floor((y + limitedRadius) / this.cellSize)

      for (let cx = limitedMinX; cx <= limitedMaxX; cx++) {
        for (let cy = limitedMinY; cy <= limitedMaxY; cy++) {
          yield `${cx},${cy}`
        }
      }
    } else {
      for (let cx = minX; cx <= maxX; cx++) {
        for (let cy = minY; cy <= maxY; cy++) {
          yield `${cx},${cy}`
        }
      }
    }
  }

  /**
   * Вставить сущность в сетку
   */
  insert(entity: Entity): void {
    const key = this.getCellKey(entity.x, entity.y)
    if (!this.grid.has(key)) {
      this.grid.set(key, new Set())
    }
    this.grid.get(key)!.add(entity)
  }

  /**
   * Удалить сущность из сетки
   */
  remove(entity: Entity): void {
    const key = this.getCellKey(entity.x, entity.y)
    const cell = this.grid.get(key)
    if (cell) {
      cell.delete(entity)
      if (cell.size === 0) {
        this.grid.delete(key)
      }
    }
  }

  /**
   * Обновить позицию сущности в сетке
   */
  update(entity: Entity, oldX: number, oldY: number): void {
    const oldKey = this.getCellKey(oldX, oldY)
    const newKey = this.getCellKey(entity.x, entity.y)

    if (oldKey !== newKey) {
      // Удаляем из старой ячейки
      const oldCell = this.grid.get(oldKey)
      if (oldCell) {
        oldCell.delete(entity)
        if (oldCell.size === 0) {
          this.grid.delete(oldKey)
        }
      }
      // Добавляем в новую ячейку
      this.insert(entity)
    }
  }

  /**
   * Найти сущности в области
   */
  query(x: number, y: number, radius: number): Entity[] {
    // Ограничиваем максимальный радиус для предотвращения переполнения памяти
    const MAX_RADIUS = 500 // Максимальный радиус поиска
    const limitedRadius = Math.min(radius, MAX_RADIUS)

    const results = new Set<Entity>()
    const radiusSq = limitedRadius * limitedRadius

    // Итерируемся напрямую по генератору, не создавая массив
    for (const key of this.getCellKeysForArea(x, y, limitedRadius)) {
      const cell = this.grid.get(key)
      if (cell) {
        for (const entity of cell) {
          // Проверяем, что сущность действительно в радиусе
          const dx = entity.x - x
          const dy = entity.y - y
          const distSq = dx * dx + dy * dy
          if (distSq <= radiusSq) {
            results.add(entity)
          }
        }
      }
    }

    return Array.from(results)
  }

  /**
   * Очистить сетку
   */
  clear(): void {
    this.grid.clear()
  }

  /**
   * Получить количество ячеек
   */
  get cellCount(): number {
    return this.grid.size
  }
}

