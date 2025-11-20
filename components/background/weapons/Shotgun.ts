import { Weapon, type WeaponConfig } from './Weapon'
import type { Simulation } from '../simulation'
import type { Ship } from '../entities/Ship'
import { LinearProjectile } from '../projectiles/LinearProjectile'
import { graphicsCache } from '../utils/graphicsCache'
import type { CachedGraphics } from '../utils/graphicsCache'

export class Shotgun extends Weapon {
  readonly config: WeaponConfig = {
    cooldown: 60,
    damage: 0.8,
    speed: 10,
    spread: 0.4,
    color: '#ef4444',
    size: 2,
    count: 5
  }
  readonly icon: string = '⋗'
  readonly duration: number = 500 // 8.3 секунды

  protected spawnProjectiles(sim: Simulation, owner: Ship, angle: number, damageMult: number) {
    const count = this.config.count || 5
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * this.config.spread
      const vx = owner.vx + Math.cos(angle + spread) * this.config.speed
      const vy = owner.vy + Math.sin(angle + spread) * this.config.speed

      sim.projectiles.push(new LinearProjectile(
        owner.x, owner.y, vx, vy,
        this.config.color!,
        this.config.damage * damageMult,
        this.config.size,
        40 // Дробовик недалеко стреляет
      ))
    }
  }

  generateVisual(width: number, height: number): CachedGraphics {
    const canvas = graphicsCache.createCanvas(width, height)
    const renderCtx = canvas.getContext('2d')! as CanvasRenderingContext2D

    // Дробовик - веер красных линий
    renderCtx.save()
    renderCtx.strokeStyle = '#ef4444'
    renderCtx.shadowColor = '#ef4444'
    renderCtx.shadowBlur = 18
    renderCtx.lineWidth = 2
    const centerX = width / 2
    const centerY = height / 2
    for (let i = 0; i < 5; i++) {
      const angle = -0.4 + (i * 0.2)
      renderCtx.beginPath()
      renderCtx.moveTo(centerX, centerY)
      renderCtx.lineTo(centerX + Math.cos(angle) * 18, centerY + Math.sin(angle) * 18)
      renderCtx.stroke()
    }
    renderCtx.restore()

    return { canvas, width, height, key: 'shotgun' }
  }
}

