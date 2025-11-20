import { Entity } from './Entity'

export class Particle extends Entity {
  life: number = 1.0
  size: number
  constructor(x: number, y: number, color: string, size: number, vx: number, vy: number) {
    super(x, y, color)
    this.size = size; this.vx = vx; this.vy = vy
  }
  update() {
    this.x += this.vx; this.y += this.vy; this.life -= 0.02
    if (this.life <= 0) this.markedForDeletion = true
  }
}

