import type { Simulation } from '../simulation'
import type { Renderer } from '../renderer/Renderer'

/**
 * Базовый интерфейс для систем управления сущностями
 */
export interface EntitySystem {
  /**
   * Обновить логику системы
   */
  update(sim: Simulation): void

  /**
   * Отрендерить сущности системы
   */
  render(sim: Simulation, renderer: Renderer): void

  /**
   * Спавн новых сущностей (если необходимо)
   */
  spawn?(sim: Simulation): void
}

