import { Entity } from './Entity'
import { BHState } from '../types'
import { MathUtils } from '../utils/math'
import type { Simulation } from '../simulation'

export class Star extends Entity {
  constructor(x: number, y: number) {
    super(x, y, 'rgba(139, 92, 246, 0.6)')
    this.vx = MathUtils.randomRange(-0.5, 0.5)
    this.vy = MathUtils.randomRange(-0.5, 0.5)
  }
  update(sim: Simulation) {
    if (sim.warpFactor > 1.1) {
       const dx = this.x - sim.width / 2
       const dy = this.y - sim.height / 2
       const dist = Math.sqrt(dx*dx + dy*dy) || 1
       this.x += (dx/dist) * 2 * sim.warpFactor
       this.y += (dy/dist) * 2 * sim.warpFactor
    } else if (sim.blackHole.state === BHState.EXPLODING) {
       const bh = sim.blackHole
       const dist = MathUtils.dist(this, bh)
       if (dist < bh.shockwaveRadius + 100 && dist > bh.shockwaveRadius - 50) {
          const angle = MathUtils.angle(bh, this)
          this.vx += Math.cos(angle) * 5
          this.vy += Math.sin(angle) * 5
       }
    }
    this.applyPhysics(1, 0.95)

    if (this.x < 0 || this.x > sim.width || this.y < 0 || this.y > sim.height) {
      if (sim.warpFactor > 1.1) {
         this.x = sim.width/2 + MathUtils.randomRange(-50, 50)
         this.y = sim.height/2 + MathUtils.randomRange(-50, 50)
      } else {
         this.vx *= -1; this.vy *= -1
      }
    }
  }
}

