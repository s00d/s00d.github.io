import { Weapon, type WeaponConfig } from './Weapon'
import type { Simulation } from '../simulation'
import type { Ship } from '../entities/Ship'
import { PatternProjectile } from '../projectiles/PatternProjectile'
import { graphicsCache } from '../utils/graphicsCache'
import type { CachedGraphics } from '../utils/graphicsCache'

export class PlasmaGun extends Weapon {
  readonly config: WeaponConfig = {
    cooldown: 150,
    damage: 0.5,
    speed: 3,
    spread: 0,
    color: '#8b5cf6',
    size: 8
  }
  readonly icon: string = '🟣'
  readonly duration: number = 900 // 15 секунд

  protected spawnProjectiles(sim: Simulation, owner: Ship, angle: number, damageMult: number) {
    const vx = owner.vx + Math.cos(angle) * this.config.speed
    const vy = owner.vy + Math.sin(angle) * this.config.speed

    const projectile = new PatternProjectile(
      owner.x, owner.y, vx, vy,
      this.config.color!,
      this.config.damage * damageMult,
      this.config.size,
      'PLASMA'
    )
    sim.projectiles.add(projectile)
  }

  generateVisual(width: number, height: number): CachedGraphics {
    const canvas = graphicsCache.createCanvas(width, height)
    const renderCtx = canvas.getContext('2d')! as CanvasRenderingContext2D
    
    // Плазма - большой пульсирующий фиолетовый шар
    renderCtx.save()
    const centerX = width / 2
    const centerY = height / 2
    const radius = 8
    const gradient = renderCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.5, '#8b5cf6')
    gradient.addColorStop(1, 'transparent')
    renderCtx.fillStyle = gradient
    renderCtx.shadowColor = '#8b5cf6'
    renderCtx.shadowBlur = 30
    renderCtx.beginPath()
    renderCtx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    renderCtx.fill()
    renderCtx.restore()

    return { canvas, width, height, key: 'plasma' }
  }
}

