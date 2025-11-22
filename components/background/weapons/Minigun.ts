import { Weapon, type WeaponConfig } from './Weapon'
import type { Simulation } from '../simulation'
import type { Ship } from '../entities/Ship'
import { LinearProjectile } from '../projectiles/LinearProjectile'
import { graphicsCache } from '../utils/graphicsCache'
import type { CachedGraphics } from '../utils/graphicsCache'

export class Minigun extends Weapon {
  readonly config: WeaponConfig = {
    cooldown: 5,
    damage: 0.3,
    speed: 14,
    spread: 0.3,
    color: '#f59e0b',
    size: 1.5
  }
  readonly icon: string = '∴'
  readonly duration: number = 400 // 6.7 секунд

  getAllowedAngle(): number {
    return 0.8 // Миниган имеет больший угол
  }

  protected spawnProjectiles(sim: Simulation, owner: Ship, angle: number, damageMult: number) {
    const spread = (Math.random() - 0.5) * this.config.spread
    const vx = owner.vx + Math.cos(angle + spread) * this.config.speed
    const vy = owner.vy + Math.sin(angle + spread) * this.config.speed

    const projectile = sim.projectilePool.acquireLinear(
      owner.x, owner.y, vx, vy,
      this.config.color!,
      this.config.damage * damageMult,
      this.config.size,
      50
    )
    sim.projectiles.add(projectile)
  }

  generateVisual(width: number, height: number): CachedGraphics {
    const canvas = graphicsCache.createCanvas(width, height)
    const renderCtx = canvas.getContext('2d')! as CanvasRenderingContext2D
    
    // Миниган - оранжевые быстрые линии
    renderCtx.save()
    renderCtx.strokeStyle = '#f59e0b'
    renderCtx.shadowColor = '#f59e0b'
    renderCtx.shadowBlur = 20
    renderCtx.lineWidth = 1.5
    for (let i = 0; i < 3; i++) {
      renderCtx.beginPath()
      renderCtx.moveTo(width / 2, height / 2)
      renderCtx.lineTo(width / 2 - 15 - i * 2, height / 2 + (Math.random() - 0.5) * 4)
      renderCtx.stroke()
    }
    renderCtx.restore()

    return { canvas, width, height, key: 'minigun' }
  }
}

