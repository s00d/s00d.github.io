import { Entity } from './Entity'
import type { Simulation } from '../simulation'

export class Shockwave extends Entity {
  radius: number = 1
  maxRadius: number = 250 // Радиус поражения
  life: number = 1.0

  constructor(x: number, y: number) {
    super(x, y, '#ffffff') // Цвет волны
  }

  update(sim: Simulation) {
    // Волна расширяется быстро
    this.radius += 8 * sim.warpFactor
    this.life -= 0.03

    if (this.life <= 0) {
      this.markedForDeletion = true
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(255, 200, 200, ${this.life})`
    ctx.lineWidth = 20 * this.life // Толщина уменьшается
    ctx.stroke()
    ctx.restore()
  }
}

