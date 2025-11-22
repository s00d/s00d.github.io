import type { Entity } from '../entities/Entity'
import type { Simulation } from '../simulation'
import type { Renderer } from '../renderer/Renderer'

/**
 * Универсальный менеджер для управления массивами сущностей
 * Оптимизирует обновление и рендеринг, используя filter() вместо splice()
 */
export class EntityManager<T extends Entity> {
  private entities: T[] = []

  /**
   * Добавить сущность
   */
  add(entity: T): void {
    this.entities.push(entity)
  }

  /**
   * Удалить сущность
   */
  remove(entity: T): void {
    const index = this.entities.indexOf(entity)
    if (index !== -1) {
      this.entities.splice(index, 1)
    }
  }

  /**
   * Получить все сущности
   */
  getAll(): readonly T[] {
    return this.entities
  }

  /**
   * Получить количество сущностей
   */
  get count(): number {
    return this.entities.length
  }

  /**
   * Обновить и отрендерить все сущности
   * @param sim - симуляция
   * @param renderer - рендерер
   * @param drawFn - функция отрисовки для каждой сущности
   */
  updateAndRender(
    sim: Simulation,
    renderer: Renderer,
    drawFn: (entity: T, renderer: Renderer, sim: Simulation) => void
  ): void {
    // Обновляем и рендерим все сущности
    for (const entity of this.entities) {
      if (entity && !entity.markedForDeletion) {
        entity.update(sim)
        drawFn(entity, renderer, sim)
      }
    }

    // Удаляем помеченные для удаления и null/undefined за один проход
    this.entities = this.entities.filter(
      (entity) => entity && !entity.markedForDeletion
    )
  }

  /**
   * Только обновить сущности (без рендеринга)
   */
  updateOnly(sim: Simulation): void {
    for (const entity of this.entities) {
      if (entity && !entity.markedForDeletion) {
        entity.update(sim)
      }
    }

    // Удаляем помеченные для удаления
    this.entities = this.entities.filter(
      (entity) => entity && !entity.markedForDeletion
    )
  }

  /**
   * Только отрендерить сущности (без обновления)
   */
  renderOnly(
    renderer: Renderer,
    drawFn: (entity: T, renderer: Renderer, sim: Simulation) => void,
    sim: Simulation
  ): void {
    for (const entity of this.entities) {
      if (entity && !entity.markedForDeletion) {
        drawFn(entity, renderer, sim)
      }
    }
  }

  /**
   * Очистить все сущности
   */
  clear(): void {
    this.entities = []
  }

  /**
   * Фильтровать сущности по условию
   */
  filter(predicate: (entity: T) => boolean): T[] {
    return this.entities.filter(predicate)
  }

  /**
   * Найти сущность по условию
   */
  find(predicate: (entity: T) => boolean): T | undefined {
    return this.entities.find(predicate)
  }

  /**
   * Применить функцию к каждой сущности
   */
  forEach(callback: (entity: T, index: number) => void): void {
    this.entities.forEach(callback)
  }
}

