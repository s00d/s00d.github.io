import { Weapon, type WeaponConfig } from './Weapon'
import type { Simulation } from '../simulation'
import type { Ship } from '../entities/Ship'
import { PatternProjectile } from '../projectiles/PatternProjectile'
import { graphicsCache } from '../utils/graphicsCache'
import type { CachedGraphics } from '../utils/graphicsCache'

export class FlakCannon extends Weapon {
  readonly config: WeaponConfig = {
    cooldown: 90,
    damage: 2,
    speed: 9,
    spread: 0.1,
    color: '#64748b',
    size: 3
  }
  readonly icon: string = '💥'
  readonly duration: number = 550 // 9.2 секунды

  protected spawnProjectiles(sim: Simulation, owner: Ship, angle: number, damageMult: number) {
    const spread = (Math.random() - 0.5) * this.config.spread
    const vx = owner.vx + Math.cos(angle + spread) * this.config.speed
    const vy = owner.vy + Math.sin(angle + spread) * this.config.speed

    sim.projectiles.push(new PatternProjectile(
      owner.x, owner.y, vx, vy,
      this.config.color!,
      this.config.damage * damageMult,
      this.config.size,
      'FLAK'
    ))
  }

  generateVisual(width: number, height: number): CachedGraphics {
    const canvas = graphicsCache.createCanvas(width, height)
    const renderCtx = canvas.getContext('2d')! as CanvasRenderingContext2D
    
    // Зенитка - серый шар с взрывным эффектом
    renderCtx.save()
    const centerX = width / 2
    const centerY = height / 2
    renderCtx.fillStyle = '#64748b'
    renderCtx.shadowColor = '#64748b'
    renderCtx.shadowBlur = 22
    renderCtx.beginPath()
    renderCtx.arc(centerX, centerY, 3, 0, Math.PI * 2)
    renderCtx.fill()
    // Взрывные линии
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6
      renderCtx.beginPath()
      renderCtx.moveTo(centerX, centerY)
      renderCtx.lineTo(centerX + Math.cos(angle) * 5, centerY + Math.sin(angle) * 5)
      renderCtx.stroke()
    }
    renderCtx.restore()

    return { canvas, width, height, key: 'flak' }
  }
}

