import { Projectile } from './Projectile'
import { applyGlow } from '../utils/glow'

export class LinearProjectile extends Projectile {
  drawSpecific(ctx: CanvasRenderingContext2D) {
    const angle = Math.atan2(this.vy, this.vx)
    ctx.rotate(angle)

    const len = this.size > 3 ? 30 : 10

    // Неоновое свечение
    ctx.save()
    applyGlow(ctx, {
      color: this.color,
      intensity: 1.0,
      blur: 15 + this.size * 5
    })

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(-len, 0)
    ctx.strokeStyle = this.color
    ctx.lineWidth = this.size
    ctx.stroke()
    ctx.restore()
  }
}

