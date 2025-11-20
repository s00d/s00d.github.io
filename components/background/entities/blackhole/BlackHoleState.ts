import type { BlackHole } from '../BlackHole'
import type { Simulation } from '../../simulation'

/**
 * Интерфейс состояния черной дыры
 */
export interface BlackHoleState {
  /**
   * Обновляет состояние черной дыры
   * @param blackHole - черная дыра
   * @param sim - симуляция
   */
  update(blackHole: BlackHole, sim: Simulation): void
}

