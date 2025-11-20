import { Projectile } from './Projectile'
import { CONFIG } from '../config'
import { BHState } from '../types'
import { MathUtils } from '../utils/math'
import type { Simulation } from '../simulation'
import { applyGlow } from '../utils/glow'
import { GravityService } from '../services/GravityService'
import { CollisionService } from '../services/CollisionService'

export class BombProjectile extends Projectile {
  constructor(x: number, y: number, vx: number, vy: number, damage: number) {
      super(x, y, vx, vy, CONFIG.COLORS.bomb, damage, 4, 300)
  }

  override update(sim: Simulation) {
      const bh = sim.blackHole

      // Используем GravityService для расчета гравитации
      if (bh.state !== BHState.EXPLODING) {
          const gravityPull = GravityService.calculateGravityPull(this, bh)
          if (gravityPull) {
              // Бомбы притягиваются сильнее (множитель 2.67 для соответствия старой логике)
              this.vx += gravityPull.vx * 2.67
              this.vy += gravityPull.vy * 2.67
          }
      }

      this.x += this.vx * sim.warpFactor
      this.y += this.vy * sim.warpFactor
      this.life--

      const dist = MathUtils.dist(this, bh)

      // Hit Black Hole
      if (dist < bh.visualRadius && bh.state !== BHState.EXPLODING) {
          sim.createExplosion(this.x, this.y, 30, this.color)
          bh.mass = Math.max(0, bh.mass - this.damage)
          bh.shake = 10
          sim.spawnShockwave(this.x, this.y)
          this.markedForDeletion = true
          return
      }

      // Hit Big Meteor
      if (sim.bigMeteor) {
          if (CollisionService.checkCircleCollision(this, sim.bigMeteor, 4, sim.bigMeteor.size)) {
              sim.bigMeteor.hp -= 1
              sim.createExplosion(this.x, this.y, 25, this.color)
              this.markedForDeletion = true
              return
          }
      }

      // Hit Serpent (Instakill logic)
      for (const s of sim.serpents) {
          if (CollisionService.checkSegmentCollision(this, s.segments, 30, 0)) {
              s.takeDamage(sim, 100)
              sim.createExplosion(this.x, this.y, 40, this.color)
              sim.spawnShockwave(this.x, this.y)
              this.markedForDeletion = true
              return
          }
      }

      if (this.life <= 0) this.markedForDeletion = true
  }

  drawSpecific(ctx: CanvasRenderingContext2D) {
     ctx.save()
     applyGlow(ctx, {
       color: this.color,
       intensity: 1.0,
       blur: 25
     })
     ctx.beginPath()
     ctx.arc(0, 0, 4, 0, Math.PI * 2)
     ctx.fillStyle = this.color
     ctx.fill()
     ctx.restore()
  }
}

