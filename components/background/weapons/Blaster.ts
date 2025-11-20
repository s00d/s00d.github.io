import { Weapon, type WeaponConfig } from './Weapon'
import type { Simulation } from '../simulation'
import type { Ship } from '../entities/Ship'
import { LinearProjectile } from '../projectiles/LinearProjectile'
import { graphicsCache } from '../utils/graphicsCache'
import type { CachedGraphics } from '../utils/graphicsCache'

export class Blaster extends Weapon {
  readonly config: WeaponConfig = {
    cooldown: 40,
    damage: 1,
    speed: 12,
    spread: 0.05,
    color: null, // Берет цвет корабля
    size: 2
  }
  readonly icon: string = '' // Бластер не показывает иконку
  readonly duration: number = 600 // 10 секунд при 60fps

  protected spawnProjectiles(sim: Simulation, owner: Ship, angle: number, damageMult: number) {
    const spread = (Math.random() - 0.5) * this.config.spread
    const vx = owner.vx + Math.cos(angle + spread) * this.config.speed
    const vy = owner.vy + Math.sin(angle + spread) * this.config.speed

    sim.projectiles.push(new LinearProjectile(
      owner.x, owner.y, vx, vy,
      owner.color, // Бластер берет цвет корабля
      this.config.damage * damageMult,
      this.config.size,
      60 // Life
    ))
  }

  generateVisual(width: number, height: number): CachedGraphics {
    const canvas = graphicsCache.createCanvas(width, height)
    const renderCtx = canvas.getContext('2d')! as CanvasRenderingContext2D
    
    // Базовый визуал бластера - простая линия с неоновым свечением
    renderCtx.save()
    renderCtx.strokeStyle = '#8b5cf6'
    renderCtx.shadowColor = '#8b5cf6'
    renderCtx.shadowBlur = 15
    renderCtx.lineWidth = 2
    renderCtx.beginPath()
    renderCtx.moveTo(width / 2, height / 2)
    renderCtx.lineTo(width / 2 - 20, height / 2)
    renderCtx.stroke()
    renderCtx.restore()

    return { canvas, width, height, key: 'blaster' }
  }
}

