import type { Simulation } from '../simulation'

export abstract class Entity {
  x: number
  y: number
  vx: number = 0
  vy: number = 0
  color: string
  markedForDeletion: boolean = false

  constructor(x: number, y: number, color: string) {
    this.x = x
    this.y = y
    this.color = color
  }

  /**
   * Получить позицию X
   */
  get posX(): number {
    return this.x
  }

  /**
   * Получить позицию Y
   */
  get posY(): number {
    return this.y
  }

  /**
   * Получить цвет
   */
  get entityColor(): string {
    return this.color
  }

  abstract update(sim: Simulation): void

  applyPhysics(warpFactor: number = 1, friction: number = 1) {
    this.x += this.vx * warpFactor
    this.y += this.vy * warpFactor
    this.vx *= friction
    this.vy *= friction
  }
}

