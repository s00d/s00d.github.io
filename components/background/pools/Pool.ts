/**
 * Базовый интерфейс для объектов, которые могут быть переиспользованы в пуле
 */
export interface Poolable {
  /**
   * Сбросить состояние объекта перед переиспользованием
   */
  reset(): void
}

/**
 * Базовый класс для пула объектов
 */
export class Pool<T extends Poolable> {
  private pool: T[] = []
  private createFn: () => T
  private maxSize: number

  constructor(createFn: () => T, initialSize: number = 10, maxSize: number = 200) {
    this.createFn = createFn
    this.maxSize = maxSize
    // Предварительно создаем начальные объекты
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn())
    }
  }

  /**
   * Получить объект из пула
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    // Если пул пуст, создаем новый объект
    return this.createFn()
  }

  /**
   * Вернуть объект в пул
   */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      obj.reset()
      this.pool.push(obj)
    }
    // Если пул переполнен, объект просто удаляется (будет собран GC)
  }

  /**
   * Очистить пул
   */
  clear(): void {
    this.pool = []
  }

  /**
   * Получить текущий размер пула
   */
  get size(): number {
    return this.pool.length
  }
}

