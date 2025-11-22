import { Projectile } from './Projectile'
import { CONFIG } from '../config'
import { MathUtils } from '../utils/math'
import type { Simulation } from '../simulation'
import { Entity } from '../entities/Entity'
import { VoidSerpent } from '../entities/VoidSerpent'
import { Ship } from '../entities/Ship'
import { Particle } from '../entities/Particle'
import { EffectSpawnService } from '../services/EffectSpawnService'

export class HomingMissile extends Projectile {
  target?: Entity | null
  trail: {x: number, y: number}[] = []
  fuel: number = 100

  constructor(x: number, y: number, vx: number, vy: number, color: string, damage: number) {
     super(x, y, vx, vy, color, damage, 4, 200)
  }

  override update(sim: Simulation) {
     // Поиск цели (оптимизировано через SpatialGrid)
     if (!this.target || (this.target instanceof Entity && this.target.markedForDeletion)) {
        let closest = Infinity
        const nearbyEntities = sim.spatialGrid.query(this.x, this.y, 800)

        const maxDistSq = 800 * 800
        for (const entity of nearbyEntities) {
          if (entity instanceof Ship) {
            const s = entity as Ship
            if (s.color === this.color) continue
            const dSq = MathUtils.distSq(this, s)
            if (dSq < closest * closest && dSq < maxDistSq) {
              closest = Math.sqrt(dSq)
              this.target = s
            }
          } else if (entity instanceof VoidSerpent && !this.target) {
            // Если нет кораблей, ищем змей
            const s = entity as VoidSerpent
            const dSq = MathUtils.distSq(this, s)
            if (dSq < closest * closest && dSq < maxDistSq) {
              closest = Math.sqrt(dSq)
              this.target = s
            }
          }
        }
     }

     // Наведение
     if (this.target && this.fuel > 0) {
         const tx = (this.target instanceof VoidSerpent && this.target.segments.length > 0 && this.target.segments[0]) ? this.target.segments[0].x : this.target.x
         const ty = (this.target instanceof VoidSerpent && this.target.segments.length > 0 && this.target.segments[0]) ? this.target.segments[0].y : this.target.y

         const angleToTarget = Math.atan2(ty - this.y, tx - this.x)
         const currentAngle = Math.atan2(this.vy, this.vx)
         let diff = MathUtils.normalizeAngle(angleToTarget - currentAngle)

         const turnSpeed = 0.08 * sim.warpFactor
         const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed)

         const speed = Math.hypot(this.vx, this.vy)
         this.vx = Math.cos(newAngle) * speed * 1.02 // Ракета ускоряется
         this.vy = Math.sin(newAngle) * speed * 1.02

         // Cap speed
         const maxSpeed = 12
         const curSpeed = Math.hypot(this.vx, this.vy)
         if (curSpeed > maxSpeed) {
             this.vx = (this.vx/curSpeed)*maxSpeed
             this.vy = (this.vy/curSpeed)*maxSpeed
         }

         this.fuel--

         // Дым
         if (Math.random() < 0.4) {
             const particle = sim.particlePool.acquire(this.x, this.y, '#555', MathUtils.randomRange(1, 3), 0, 0)
             sim.particles.add(particle)
         }
     }

     // Trail
     this.trail.push({x: this.x, y: this.y})
     if (this.trail.length > CONFIG.MAX_MISSILE_TRAIL) this.trail.shift()

     super.update(sim)
  }

  override createHitEffect(sim: Simulation, createDefaultEffect?: (x: number, y: number, color: string) => void): void {
      EffectSpawnService.createExplosion(this.x, this.y, 20, '#fbbf24', sim) // Взрыв
      EffectSpawnService.spawnShockwave(this.x, this.y, sim)
      this.markedForDeletion = true
      // Не вызываем createDefaultEffect, так как создаем свой эффект
  }

  drawSpecific(ctx: CanvasRenderingContext2D) {
     // Рисуем хвост отдельно в мировых координатах
     ctx.rotate(-Math.atan2(this.vy, this.vx)) // Hacky undo rotation for trail

     if (this.trail.length > 1 && this.trail[0]) {
         ctx.save()
         ctx.strokeStyle = '#9ca3af'
         ctx.shadowColor = '#9ca3af'
         ctx.shadowBlur = 8
         ctx.lineWidth = 1
         ctx.beginPath()
         ctx.moveTo(this.trail[0].x - this.x, this.trail[0].y - this.y) // Local coords
         for (const t of this.trail) {
             if (t) ctx.lineTo(t.x - this.x, t.y - this.y)
         }
         ctx.stroke()
         ctx.restore()
     }

     // Restore rotation for body
     ctx.rotate(Math.atan2(this.vy, this.vx))

     // Rocket Body с неоновым свечением
     ctx.save()
     ctx.fillStyle = this.color
     ctx.shadowColor = this.color
     ctx.shadowBlur = 20
     ctx.beginPath()
     ctx.moveTo(6, 0)
     ctx.lineTo(-4, 4)
     ctx.lineTo(-4, -4)
     ctx.fill()
     ctx.restore()

     // Flame с неоновым свечением
     ctx.save()
     ctx.strokeStyle = '#f59e0b'
     ctx.shadowColor = '#f59e0b'
     ctx.shadowBlur = 15
     ctx.lineWidth = 2
     ctx.beginPath()
     ctx.moveTo(-4, 0)
     ctx.lineTo(-8, 0)
     ctx.stroke()
     ctx.restore()
  }
}

