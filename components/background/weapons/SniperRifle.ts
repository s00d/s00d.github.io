import { Weapon, type WeaponConfig } from './Weapon'
import type { Simulation } from '../simulation'
import type { Ship } from '../entities/Ship'
import { LinearProjectile } from '../projectiles/LinearProjectile'
import { graphicsCache } from '../utils/graphicsCache'
import type { CachedGraphics } from '../utils/graphicsCache'

export class SniperRifle extends Weapon {
  readonly config: WeaponConfig = {
    cooldown: 180,
    damage: 15,
    speed: 60,
    spread: 0,
    color: '#ffffff',
    size: 2
  }
  readonly icon: string = '🎯'
  readonly duration: number = 1000 // 16.7 секунд

  getRange(baseRange: number): number {
    return 1000 // Снайперка стреляет дальше
  }

  protected spawnProjectiles(sim: Simulation, owner: Ship, angle: number, damageMult: number) {
    const vx = owner.vx + Math.cos(angle) * this.config.speed
    const vy = owner.vy + Math.sin(angle) * this.config.speed

    const projectile = sim.projectilePool.acquireLinear(
      owner.x, owner.y, vx, vy,
      this.config.color!,
      this.config.damage * damageMult,
      this.config.size,
      30
    )
    sim.projectiles.add(projectile)
  }

  generateVisual(width: number, height: number): CachedGraphics {
    const canvas = graphicsCache.createCanvas(width, height)
    const renderCtx = canvas.getContext('2d')! as CanvasRenderingContext2D
    
    // Снайперка - очень длинная белая линия с сильным свечением
    renderCtx.save()
    renderCtx.strokeStyle = '#ffffff'
    renderCtx.shadowColor = '#ffffff'
    renderCtx.shadowBlur = 30
    renderCtx.lineWidth = 2
    renderCtx.beginPath()
    renderCtx.moveTo(width / 2, height / 2)
    renderCtx.lineTo(width / 2 - 40, height / 2)
    renderCtx.stroke()
    // Прицел
    renderCtx.beginPath()
    renderCtx.arc(width / 2 - 20, height / 2, 2, 0, Math.PI * 2)
    renderCtx.fill()
    renderCtx.restore()

    return { canvas, width, height, key: 'sniper' }
  }
}

