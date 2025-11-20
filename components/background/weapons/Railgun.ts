import { Weapon, type WeaponConfig } from './Weapon'
import type { Simulation } from '../simulation'
import type { Ship } from '../entities/Ship'
import { LinearProjectile } from '../projectiles/LinearProjectile'
import { graphicsCache } from '../utils/graphicsCache'
import type { CachedGraphics } from '../utils/graphicsCache'

export class Railgun extends Weapon {
  readonly config: WeaponConfig = {
    cooldown: 100,
    damage: 10,
    speed: 40,
    spread: 0,
    color: '#06b6d4',
    size: 4
  }
  readonly icon: string = '━'
  readonly duration: number = 800 // 13.3 секунды

  protected spawnProjectiles(sim: Simulation, owner: Ship, angle: number, damageMult: number) {
    const vx = owner.vx + Math.cos(angle) * this.config.speed
    const vy = owner.vy + Math.sin(angle) * this.config.speed

    sim.projectiles.push(new LinearProjectile(
      owner.x, owner.y, vx, vy,
      this.config.color!,
      this.config.damage * damageMult,
      this.config.size,
      30 // Очень быстро исчезает
    ))
  }

  generateVisual(width: number, height: number): CachedGraphics {
    const canvas = graphicsCache.createCanvas(width, height)
    const renderCtx = canvas.getContext('2d')! as CanvasRenderingContext2D

    // Рельсотрон - яркая синяя линия с сильным свечением
    renderCtx.save()
    renderCtx.strokeStyle = '#06b6d4'
    renderCtx.shadowColor = '#06b6d4'
    renderCtx.shadowBlur = 25
    renderCtx.lineWidth = 4
    renderCtx.beginPath()
    renderCtx.moveTo(width / 2, height / 2)
    renderCtx.lineTo(width / 2 - 30, height / 2)
    renderCtx.stroke()
    renderCtx.restore()

    return { canvas, width, height, key: 'railgun' }
  }
}

