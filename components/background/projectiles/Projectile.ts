import { Entity } from '../entities/Entity'
import { MathUtils } from '../utils/math'
import type { Simulation } from '../simulation'
import type { Ship } from '../entities/Ship'
import type { VoidSerpent } from '../entities/VoidSerpent'
import type { BigMeteor } from '../entities/BigMeteor'
import { CollisionService } from '../services/CollisionService'

export abstract class Projectile extends Entity {
  damage: number
  size: number
  life: number
  maxLife: number

  constructor(x: number, y: number, vx: number, vy: number, color: string, damage: number, size: number, life: number) {
    super(x, y, color)
    this.vx = vx; this.vy = vy; this.damage = damage; this.size = size; this.life = life; this.maxLife = life
  }

  // Базовая логика коллизий
  checkCollisions(sim: Simulation) {
    // Большой метеорит
    if (sim.bigMeteor) {
      if (CollisionService.checkCircleCollision(this, sim.bigMeteor, this.size, sim.bigMeteor.size)) {
        this.onHitBigMeteor(sim, sim.bigMeteor)
        return
      }
    }

    // Корабли
    for (const s of sim.ships) {
       if (s.color === this.color) continue // Friendly fire off
       if (CollisionService.checkShipCollision(this, s, 12, this.size)) {
          this.onHitShip(sim, s)
          return
       }
    }
    // Змеи
    for (const s of sim.serpents) {
        if (s.segments.length > 0) {
            const headRadius = 20 * (s.sizeMult || 1.0)
            if (CollisionService.checkCircleCollision(this, s.segments[0], this.size, headRadius)) {
                this.onHitSerpent(sim, s)
                return
            }
        }
    }
  }

  onHitBigMeteor(sim: Simulation, bigMeteor: BigMeteor) {
    // Обычные пули наносят 0.1 урона большому метеориту (10 пуль = 1 HP)
    bigMeteor.hp -= 0.1
    sim.createExplosion(this.x, this.y, 8, this.color)
    this.markedForDeletion = true
  }

  onHitShip(sim: Simulation, ship: Ship) {
      ship.takeDamage(sim, this.damage)
      this.createHitEffect(sim)
      this.markedForDeletion = true
  }

  onHitSerpent(sim: Simulation, serpent: VoidSerpent) {
      serpent.takeDamage(sim, this.damage)
      this.createHitEffect(sim)
      this.markedForDeletion = true
  }

  createHitEffect(sim: Simulation) {
      sim.createExplosion(this.x, this.y, 5, this.color)
  }

  abstract drawSpecific(ctx: CanvasRenderingContext2D): void

  // Общий апдейт
  update(sim: Simulation) {
    this.life--
    if (this.life <= 0) {
       this.markedForDeletion = true
       return
    }
    this.applyPhysics(sim.warpFactor)
    this.checkCollisions(sim)
  }
}

