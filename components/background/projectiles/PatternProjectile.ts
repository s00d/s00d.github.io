import { Projectile } from './Projectile'
import type { Simulation } from '../simulation'
import type { Ship } from '../entities/Ship'
import type { VoidSerpent } from '../entities/VoidSerpent'
import { LinearProjectile } from './LinearProjectile'
import { applyGlow, getPulsingGlow } from '../utils/glow'

export class PatternProjectile extends Projectile {
    pattern: 'WAVE' | 'PLASMA' | 'FLAK'
    initialV: {x: number, y: number}
    spawnTime: number

    constructor(x: number, y: number, vx: number, vy: number, color: string, damage: number, size: number, pattern: 'WAVE' | 'PLASMA' | 'FLAK') {
        super(x, y, vx, vy, color, damage, size, 60)
        this.pattern = pattern
        this.initialV = {x: vx, y: vy}
        this.spawnTime = Date.now()
        if (pattern === 'PLASMA') this.life = 100
    }

    override update(sim: Simulation) {
        if (this.pattern === 'WAVE') {
             const age = (Date.now() - this.spawnTime) * 0.015
             const perpX = -this.initialV.y; const perpY = this.initialV.x
             const len = Math.sqrt(perpX*perpX + perpY*perpY) || 1
             const offset = Math.sin(age) * 4
             this.x += (perpX/len) * offset * 0.2
             this.y += (perpY/len) * offset * 0.2
        } else if (this.pattern === 'FLAK' && this.life < 10) {
             for(let i=0; i<6; i++) {
                 const a = Math.random()*Math.PI*2
                 const s = 6
                 sim.projectiles.push(new LinearProjectile(this.x, this.y, Math.cos(a)*s, Math.sin(a)*s, this.color, 1, 1.5, 20))
             }
             this.markedForDeletion = true
             return
        }

        super.update(sim)
    }

    // Plasma Piercing override
    override onHitShip(sim: Simulation, ship: Ship) {
        ship.takeDamage(sim, this.damage)
        if (this.pattern !== 'PLASMA') this.markedForDeletion = true
        else sim.createExplosion(this.x, this.y, 2, this.color)
    }

    override onHitSerpent(sim: Simulation, s: VoidSerpent) {
        s.takeDamage(sim, this.damage)
        if (this.pattern !== 'PLASMA') this.markedForDeletion = true
    }

    drawSpecific(ctx: CanvasRenderingContext2D) {
        ctx.save()
        if (this.pattern === 'PLASMA') {
            const p = Math.sin(Date.now() * 0.02) * 2
            const intensity = getPulsingGlow(1.0, Date.now() * 0.01, 2.0)
            applyGlow(ctx, {
              color: this.color,
              intensity: intensity,
              blur: 30
            })
            ctx.beginPath()
            ctx.arc(0, 0, this.size + p, 0, Math.PI*2)
            ctx.fillStyle = this.color
            ctx.fill()
        } else if (this.pattern === 'FLAK') {
            applyGlow(ctx, {
              color: this.color,
              intensity: 1.0,
              blur: 20
            })
            ctx.beginPath()
            ctx.arc(0, 0, this.size, 0, Math.PI*2)
            ctx.fillStyle = this.color
            ctx.fill()
        } else { // WAVE
            applyGlow(ctx, {
              color: this.color,
              intensity: 0.8,
              blur: 15
            })
            ctx.beginPath()
            ctx.arc(0, 0, this.size, 0, Math.PI*2)
            ctx.fillStyle = this.color
            ctx.fill()
        }
        ctx.restore()
    }
}

