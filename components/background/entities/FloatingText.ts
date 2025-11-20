import { Entity } from './Entity'
import { MathUtils } from '../utils/math'
import type { Simulation } from '../simulation'

export class FloatingText extends Entity {
  text: string
  life: number = 1.0
  size: number = 20

  constructor(x: number, y: number, text: string, color: string) {
    super(x, y, color)
    this.text = text
    this.vy = -1.5 // Летит вверх
    this.vx = MathUtils.randomRange(-0.5, 0.5) // Немного вбок
  }

  update(sim: Simulation) {
    this.x += this.vx
    this.y += this.vy
    this.life -= 0.02 // Чуть быстрее исчезает
    if (this.life <= 0) this.markedForDeletion = true
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.globalAlpha = this.life
    ctx.fillStyle = this.color
    ctx.font = `bold ${this.size}px monospace`
    ctx.textAlign = 'center'
    // Тень для читаемости
    ctx.shadowColor = '#000'
    ctx.shadowBlur = 4
    ctx.fillText(this.text, this.x, this.y)
    ctx.restore()
  }
}

