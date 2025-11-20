import { Entity } from './Entity'
import { CONFIG } from '../config'
import { BHState } from '../types'
import { MathUtils } from '../utils/math'
import type { Simulation } from '../simulation'
import { economy } from '../economy'

export class Meteor extends Entity {
  size: number
  trail: {x: number, y: number}[] = []
  isDebris: boolean
  gravityFactor: number
  friction: number
  label?: string

  constructor(x: number, y: number, vx: number, vy: number, isDebris: boolean, label?: string) {
    const isRepelled = !isDebris && Math.random() > 0.85
    const color = isRepelled ? CONFIG.COLORS.repel : (Math.random() > 0.6 ? CONFIG.COLORS.secondary : CONFIG.COLORS.white)
    const debrisColor = MathUtils.randomChoice([CONFIG.COLORS.white, CONFIG.COLORS.primary, CONFIG.COLORS.secondary, CONFIG.COLORS.danger])

    super(x, y, isDebris ? debrisColor : color)
    this.vx = vx; this.vy = vy; this.isDebris = isDebris; this.label = label
    this.size = label ? 4 : MathUtils.randomRange(2, 5)

    // ИЗМЕНЕНИЕ: Увеличили притяжение (было 2.5, стало 4.0)
    this.gravityFactor = isDebris ? -1.5 : (isRepelled ? -2.0 : 4.0)
    this.friction = isDebris ? 0.98 : 1.0
  }

  update(sim: Simulation) {
    const bh = sim.blackHole
    const dist = MathUtils.dist(this, bh)
    const angle = MathUtils.angle(this, bh)

    // 1. Сначала применяем силы (Гравитация/Взрыв)
    if (bh.state === BHState.EXPLODING) {
      // Взрывная волна
      if (dist < bh.shockwaveRadius + 50 && dist > bh.shockwaveRadius - 100) {
        const force = 5.0
        this.vx -= Math.cos(angle) * force
        this.vy -= Math.sin(angle) * force
        if (this.isDebris) {
           this.vx -= Math.cos(angle) * 2; this.vy -= Math.sin(angle) * 2
        }
      }
    } else {
      // Поглощение
      if (bh.safetyTimer === 0 && dist < bh.visualRadius) {
         sim.createExplosion(this.x, this.y, 5, this.color)
         bh.mass += CONFIG.MASS_GAIN_METEOR
         // Добавляем черную материю за поглощение метеорита
         economy.darkMatter += 50 // Обычный метеорит дает 50 темной материи
         this.markedForDeletion = true
         return
      }

      // Гравитация
      const gravityPower = 0.4 + (bh.mass / CONFIG.CRITICAL_MASS) * 0.6
      const gRadius = CONFIG.GRAVITY_RADIUS_BASE * (0.5 + gravityPower * 0.5)

      if (dist < gRadius) {
         const distFactor = 1 - dist / gRadius
         const pullStrength = this.gravityFactor > 0 ? 2.5 * (distFactor * distFactor) : 0.5 * distFactor
         const finalForce = pullStrength * this.gravityFactor * sim.warpFactor * gravityPower
         const spinForce = (this.gravityFactor > 0 ? 0.05 : 0.1) * sim.warpFactor

         this.vx += Math.cos(angle) * finalForce + Math.cos(angle + Math.PI/2) * spinForce
         this.vy += Math.sin(angle) * finalForce + Math.sin(angle + Math.PI/2) * spinForce

         // ИЗМЕНЕНИЕ: Усиленное торможение, чтобы они падали в дыру, а не пролетали мимо
         // Радиус 350px, сила 0.96
         if (this.gravityFactor > 0 && dist < 350) {
             this.vx *= 0.96; this.vy *= 0.96
         }
      }
    }

    // 2. Применяем базовое трение (если есть)
    this.vx *= this.friction
    this.vy *= this.friction

    // 3. Обновляем позицию ПОСЛЕ изменения скорости (важно!)
    const warpMult = sim.warpFactor > 1.1 ? sim.warpFactor * 0.5 : 1
    this.x += this.vx * warpMult
    this.y += this.vy * warpMult

    // Трейл
    this.trail.push({x: this.x, y: this.y})
    const maxTrail = (this.isDebris ? 8 : 14) * sim.warpFactor
    if (this.trail.length > maxTrail) this.trail.shift()

    // Удаление за границами
    if (this.x < -500 || this.x > sim.width + 500 || this.y < -500 || this.y > sim.height + 500) {
      this.markedForDeletion = true
    }
  }
}

