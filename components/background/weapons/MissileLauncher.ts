import { Weapon, type WeaponConfig } from './Weapon'
import type { Simulation } from '../simulation'
import type { Ship } from '../entities/Ship'
import { HomingMissile } from '../projectiles/HomingMissile'
import { graphicsCache } from '../utils/graphicsCache'
import type { CachedGraphics } from '../utils/graphicsCache'

export class MissileLauncher extends Weapon {
  readonly config: WeaponConfig = {
    cooldown: 120,
    damage: 4,
    speed: 5,
    spread: 0.2,
    color: '#ec4899',
    size: 3
  }
  readonly icon: string = '🚀'
  readonly duration: number = 700 // 11.7 секунд

  getRange(baseRange: number): number {
    return 1000 // Ракеты стреляют дальше
  }

  protected spawnProjectiles(sim: Simulation, owner: Ship, angle: number, damageMult: number) {
    const spread = (Math.random() - 0.5) * this.config.spread
    const vx = owner.vx + Math.cos(angle + spread) * this.config.speed
    const vy = owner.vy + Math.sin(angle + spread) * this.config.speed

    sim.projectiles.push(new HomingMissile(
      owner.x, owner.y, vx, vy,
      this.config.color!,
      this.config.damage * damageMult
    ))
  }

  generateVisual(width: number, height: number): CachedGraphics {
    const canvas = graphicsCache.createCanvas(width, height)
    const renderCtx = canvas.getContext('2d')! as CanvasRenderingContext2D
    
    // Ракетница - розовая ракета с хвостом
    renderCtx.save()
    const centerX = width / 2
    const centerY = height / 2
    renderCtx.fillStyle = '#ec4899'
    renderCtx.shadowColor = '#ec4899'
    renderCtx.shadowBlur = 20
    renderCtx.beginPath()
    renderCtx.moveTo(centerX + 6, centerY)
    renderCtx.lineTo(centerX - 4, centerY + 4)
    renderCtx.lineTo(centerX - 4, centerY - 4)
    renderCtx.fill()
    // Пламя
    renderCtx.strokeStyle = '#f59e0b'
    renderCtx.shadowColor = '#f59e0b'
    renderCtx.shadowBlur = 15
    renderCtx.lineWidth = 2
    renderCtx.beginPath()
    renderCtx.moveTo(centerX - 4, centerY)
    renderCtx.lineTo(centerX - 10, centerY)
    renderCtx.stroke()
    renderCtx.restore()

    return { canvas, width, height, key: 'missile' }
  }
}

