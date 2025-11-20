import { Weapon, type WeaponConfig } from './Weapon'
import type { Simulation } from '../simulation'
import type { Ship } from '../entities/Ship'
import { PatternProjectile } from '../projectiles/PatternProjectile'
import { graphicsCache } from '../utils/graphicsCache'
import type { CachedGraphics } from '../utils/graphicsCache'

export class WaveGun extends Weapon {
  readonly config: WeaponConfig = {
    cooldown: 25,
    damage: 1.5,
    speed: 7,
    spread: 0,
    color: '#14b8a6',
    size: 2
  }
  readonly icon: string = '〰️'
  readonly duration: number = 450 // 7.5 секунд

  protected spawnProjectiles(sim: Simulation, owner: Ship, angle: number, damageMult: number) {
    const vx = owner.vx + Math.cos(angle) * this.config.speed
    const vy = owner.vy + Math.sin(angle) * this.config.speed

    sim.projectiles.push(new PatternProjectile(
      owner.x, owner.y, vx, vy,
      this.config.color!,
      this.config.damage * damageMult,
      this.config.size,
      'WAVE'
    ))
  }

  generateVisual(width: number, height: number): CachedGraphics {
    const canvas = graphicsCache.createCanvas(width, height)
    const renderCtx = canvas.getContext('2d')! as CanvasRenderingContext2D
    
    // Волновая пушка - синусоидальная волна
    renderCtx.save()
    renderCtx.strokeStyle = '#14b8a6'
    renderCtx.shadowColor = '#14b8a6'
    renderCtx.shadowBlur = 18
    renderCtx.lineWidth = 2
    renderCtx.beginPath()
    const centerX = width / 2
    const centerY = height / 2
    for (let x = 0; x < 20; x++) {
      const y = centerY + Math.sin(x * 0.5) * 3
      if (x === 0) {
        renderCtx.moveTo(centerX + x, y)
      } else {
        renderCtx.lineTo(centerX + x, y)
      }
    }
    renderCtx.stroke()
    renderCtx.restore()

    return { canvas, width, height, key: 'wave' }
  }
}

