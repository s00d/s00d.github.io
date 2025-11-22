import { CONFIG } from '../config'
import { BHState } from '../types'
import { MathUtils } from '../utils/math'
import type { BlackHole } from '../entities/BlackHole'
import type { Meteor } from '../entities/Meteor'
import type { BigMeteor } from '../entities/BigMeteor'
import type { Ship } from '../entities/Ship'
import type { PowerUp } from '../entities/PowerUp'
import type { Projectile } from '../projectiles/Projectile'
import { HomingMissile } from '../projectiles/HomingMissile'
import type { Particle } from '../entities/Particle'
import type { Star } from '../entities/Star'
import type { VoidSerpent } from '../entities/VoidSerpent'
import { applyGlow } from '../utils/glow'
import { SHIP_STATE } from '../constants/states'
import { UpgradeFactory } from '../upgrades/UpgradeFactory'
import { HealthBar } from '../ui/HealthBar'
import { NebulaBackground } from './NebulaBackground'

export class Renderer {
  ctx: CanvasRenderingContext2D
  nebulaBackground: NebulaBackground

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
    this.nebulaBackground = new NebulaBackground()
  }

  /**
   * Отрисовывает туманность на фоне
   * @param width - ширина экрана
   * @param height - высота экрана
   * @param time - текущее время в миллисекундах
   * @param isExploding - происходит ли взрыв черной дыры
   * @param shockRadius - радиус ударной волны
   */
  drawNebula(width: number, height: number, time: number, isExploding: boolean, shockRadius: number): void {
    // Не рендерим туманность во время белой вспышки взрыва
    if (isExploding && shockRadius < 100) {
      return
    }

    // Рисуем туманность (без ускорения)
    this.nebulaBackground.draw(this.ctx, width, height, time)
  }

  clear(width: number, height: number, warpFactor: number, isExploding: boolean, shockRadius: number) {
    // Полная очистка экрана
    if (isExploding) {
       // Просто белая вспышка, если радиус маленький, иначе черный
       if (shockRadius < 100) {
         this.ctx.fillStyle = '#ffffff'
         this.ctx.fillRect(0, 0, width, height)
         return
       }
       // Обычный фон, без сложного смешивания цветов
       this.ctx.fillStyle = CONFIG.COLORS.bg
       this.ctx.fillRect(0, 0, width, height)
    } else {
       // Полностью очищаем экран черным (туманность будет нарисована после)
       this.ctx.fillStyle = '#000000'
       this.ctx.fillRect(0, 0, width, height)
    }
  }

  /**
   * Накладывает трейл-эффект поверх туманности
   * Использует более прозрачный эффект, чтобы туманность оставалась видимой
   */
  applyTrailEffect(width: number, height: number, warpFactor: number): void {
    // Уменьшаем непрозрачность трейл-эффекта, чтобы туманность была видна даже при нормальной скорости
    const trailAlpha = 0.15 + (1 / warpFactor) * 0.25 // Более прозрачный эффект
    this.ctx.fillStyle = `rgba(10, 10, 10, ${trailAlpha})`
    this.ctx.fillRect(0, 0, width, height)
  }

  drawBlackHole(bh: BlackHole) {
    if (bh.state === BHState.EXPLODING) {
      this.ctx.beginPath()
      this.ctx.arc(bh.x, bh.y, bh.shockwaveRadius, 0, Math.PI * 2)
      this.ctx.strokeStyle = '#ffffff'
      this.ctx.lineWidth = 15
      this.ctx.globalAlpha = Math.max(0, 1 - bh.shockwaveRadius / 2000)
      this.ctx.stroke()
      this.ctx.globalAlpha = 1
      return
    }

    const opacity = bh.safetyTimer > 0 ? 0.5 : 1.0

    // 1. Внешнее свечение (Glow)
    const gradient = this.ctx.createRadialGradient(bh.x, bh.y, bh.visualRadius * 0.8, bh.x, bh.y, bh.visualRadius * 2.5)
    const glowColor = bh.state === BHState.UNSTABLE ? CONFIG.COLORS.danger : CONFIG.COLORS.primary
    gradient.addColorStop(0, glowColor)
    gradient.addColorStop(1, 'rgba(0,0,0,0)')

    this.ctx.globalAlpha = opacity * 0.6
    this.ctx.fillStyle = gradient
    this.ctx.beginPath()
    this.ctx.arc(bh.x, bh.y, bh.visualRadius * 3, 0, Math.PI * 2)
    this.ctx.fill()

    // 2. Аккреционный диск (задний план)
    this.ctx.globalAlpha = 1 * opacity
    this.drawAccretionDisk(bh)

    // 3. Ядро дыры (красивая анимация)
    this.drawBlackHoleCore(bh)

  }

  private drawBlackHoleCore(bh: BlackHole) {
    this.ctx.save()
    this.ctx.translate(bh.x, bh.y)

    // Тряска
    if (bh.shake > 0) {
       const offset = bh.shake * 0.5
       this.ctx.translate(MathUtils.randomRange(-offset, offset), MathUtils.randomRange(-offset, offset))
    }

    const r = bh.visualRadius
    const coreColor = bh.state === BHState.UNSTABLE ? '#ef4444' : '#8b5cf6' // Red or Violet

    // A. Абсолютно черный горизонт событий
    this.ctx.beginPath()
    this.ctx.arc(0, 0, r, 0, Math.PI * 2)
    this.ctx.fillStyle = '#000000'
    this.ctx.fill()

    // B. Photon ring (thin bright ring inside)
    this.ctx.beginPath()
    this.ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2)
    this.ctx.strokeStyle = '#ffffff' // Pure white light
    this.ctx.lineWidth = 2
    this.ctx.shadowBlur = 10
    this.ctx.shadowColor = coreColor
    this.ctx.stroke()
    this.ctx.shadowBlur = 0

    // C. Lensing effect (inner distortion)
    // Create "funnel" inside
    const innerG = this.ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.9)
    innerG.addColorStop(0, '#000000')
    innerG.addColorStop(0.6, 'rgba(0,0,0,0.8)')
    innerG.addColorStop(1, coreColor) // Color at edges

    this.ctx.globalAlpha = 0.3
    this.ctx.fillStyle = innerG
    this.ctx.fill()
    this.ctx.globalAlpha = 1

    this.ctx.restore()
  }

  private drawAccretionDisk(bh: BlackHole) {
    this.ctx.save()
    this.ctx.translate(bh.x, bh.y)
    if (bh.shake > 0) {
       const offset = bh.shake * 0.5
       this.ctx.translate(MathUtils.randomRange(-offset, offset), MathUtils.randomRange(-offset, offset))
    }
    this.ctx.rotate(Date.now() * 0.0002)

    // Calculate total upgrades and create upgrade points
    const upgrades = bh.upgrades
    const upgradePoints: Array<{ type: string; color: string }> = []

    // Add upgrade points based on levels (приглушенные цвета)
    for (let i = 0; i < upgrades.serpentBaseCost; i++) {
      upgradePoints.push({ type: 'serpentBaseCost', color: '#d4a017' }) // Приглушенное золото
    }
    for (let i = 0; i < upgrades.serpentHealth; i++) {
      upgradePoints.push({ type: 'serpentHealth', color: '#0d8f5e' }) // Приглушенный зеленый
    }
    for (let i = 0; i < upgrades.serpentSpeed; i++) {
      upgradePoints.push({ type: 'serpentSpeed', color: '#2d5aa0' }) // Приглушенный синий
    }
    for (let i = 0; i < upgrades.serpentDamage; i++) {
      upgradePoints.push({ type: 'serpentDamage', color: '#c53030' }) // Приглушенный красный
    }
    for (let i = 0; i < upgrades.balanceRate; i++) {
      upgradePoints.push({ type: 'balanceRate', color: '#6d28d9' }) // Приглушенный фиолетовый
    }

    // Draw upgrade points on accretion disk
    if (upgradePoints.length > 0) {
      const baseRadius = bh.visualRadius + 25
      const timeOffset = Date.now() * 0.001
      const orbitCount = 3
      const orbitSpacing = 15

      // Рисуем максимум 3 круга-орбиты
      for (let i = 0; i < orbitCount; i++) {
        const orbitRadius = baseRadius + i * orbitSpacing
        this.ctx.beginPath()
        this.ctx.arc(0, 0, orbitRadius, 0, Math.PI * 2)
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)' // Полупрозрачные белые орбиты
        this.ctx.lineWidth = 1
        this.ctx.stroke()
      }

      // Рисуем точки улучшений
      upgradePoints.forEach((point, index) => {
        const angle = (Math.PI * 2 * index) / upgradePoints.length + timeOffset * 0.3
        const radius = baseRadius + (index % orbitCount) * orbitSpacing

        this.ctx.beginPath()
        this.ctx.arc(Math.cos(angle) * radius, Math.sin(angle) * radius, 5, 0, Math.PI * 2)
        this.ctx.fillStyle = point.color
        this.ctx.globalAlpha = 0.7 // Немного уменьшили прозрачность
        this.ctx.shadowBlur = 6 // Уменьшили свечение
        this.ctx.shadowColor = point.color
        this.ctx.fill()
        this.ctx.shadowBlur = 0
        this.ctx.globalAlpha = 1
      })
    }

    this.ctx.restore()
  }

  drawMeteor(m: Meteor, warpFactor: number) {
    // Trail
    if (m.trail.length > 1) {
      const first = m.trail[0]
      if (first) {
        this.ctx.beginPath()
        this.ctx.moveTo(first.x, first.y)
        for (const t of m.trail) {
          if (t) this.ctx.lineTo(t.x, t.y)
        }
        this.ctx.strokeStyle = m.color
        this.ctx.lineWidth = m.isDebris ? 2 : 1.5
        this.ctx.globalAlpha = m.isDebris ? 0.8 : 0.4
        this.ctx.stroke(); this.ctx.globalAlpha = 1
      }
    }
    // Body
    this.ctx.beginPath(); this.ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2); this.ctx.fillStyle = m.color
    if (m.gravityFactor < 0) { this.ctx.shadowBlur = 8; this.ctx.shadowColor = m.color }
    this.ctx.fill(); this.ctx.shadowBlur = 0
  }

  /**
   * Батчинг рендеринга метеоритов (группировка по цвету и типу)
   */
  drawMeteorsBatch(meteors: readonly Meteor[], warpFactor: number): void {
    if (meteors.length === 0) return

    // Группируем метеориты по цвету и типу (debris/normal)
    const batches = new Map<string, Meteor[]>()
    for (const m of meteors) {
      if (m.markedForDeletion) continue
      const key = `${m.color}|${m.isDebris ? 'debris' : 'normal'}`
      if (!batches.has(key)) {
        batches.set(key, [])
      }
      batches.get(key)!.push(m)
    }

    // Рендерим каждый батч
    for (const [key, batch] of batches) {
      if (batch.length === 0) continue

      const parts = key.split('|')
      const color = parts[0] || '#ffffff'
      const isDebris = parts[1] === 'debris'

      // Рендерим трейлы
      this.ctx.strokeStyle = color
      this.ctx.lineWidth = isDebris ? 2 : 1.5
      this.ctx.globalAlpha = isDebris ? 0.8 : 0.4

      for (const m of batch) {
        if (m.trail.length > 1) {
          const first = m.trail[0]
          if (first) {
            this.ctx.beginPath()
            this.ctx.moveTo(first.x, first.y)
            for (const t of m.trail) {
              if (t) this.ctx.lineTo(t.x, t.y)
            }
            this.ctx.stroke()
          }
        }
      }

      this.ctx.globalAlpha = 1

      // Рендерим тела метеоритов
      this.ctx.fillStyle = color
      this.ctx.beginPath()

      for (const m of batch) {
        this.ctx.moveTo(m.x + m.size, m.y)
        this.ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2)
      }

      this.ctx.fill()

      // Применяем свечение для отталкивающихся метеоритов
      for (const m of batch) {
        if (m.gravityFactor < 0) {
          this.ctx.shadowBlur = 8
          this.ctx.shadowColor = m.color
          this.ctx.beginPath()
          this.ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2)
          this.ctx.fill()
          this.ctx.shadowBlur = 0
        }
      }
    }
  }

  drawBigMeteor(bm: BigMeteor, warpFactor: number) {
    this.ctx.save()

    // Trail с эффектом свечения
    if (bm.trail.length > 1) {
      const first = bm.trail[0]
      if (first) {
        // Градиент для trail
        const gradient = this.ctx.createLinearGradient(first.x, first.y, bm.x, bm.y)
        gradient.addColorStop(0, 'transparent')
        gradient.addColorStop(0.5, `${bm.color}80`)
        gradient.addColorStop(1, bm.color)

        this.ctx.beginPath()
        this.ctx.moveTo(first.x, first.y)
        for (let i = 1; i < bm.trail.length; i++) {
          const t = bm.trail[i]
          if (t) this.ctx.lineTo(t.x, t.y)
        }

        applyGlow(this.ctx, { color: bm.color, blur: 15, intensity: 0.6 })
        this.ctx.strokeStyle = gradient
        this.ctx.lineWidth = 3
        this.ctx.globalAlpha = 0.6
        this.ctx.stroke()
        this.ctx.globalAlpha = 1
      }
    }

    // Тело метеорита с вращением
    this.ctx.translate(bm.x, bm.y)
    this.ctx.rotate(bm.rotation)

    // Неоновое свечение
    applyGlow(this.ctx, { color: bm.color, blur: 20, intensity: 0.8 })

    // Отрисовка формы из visualConfig
    if (bm.visualConfig && bm.visualConfig.points.length > 0) {
      this.ctx.beginPath()
      const firstPoint = bm.visualConfig.points[0]
      if (firstPoint) {
        this.ctx.moveTo(firstPoint.x, firstPoint.y)
        for (const point of bm.visualConfig.points) {
          this.ctx.lineTo(point.x, point.y)
        }
        this.ctx.closePath()
        this.ctx.fillStyle = bm.color
        this.ctx.fill()
      }
    } else {
      // Fallback на круг, если нет visualConfig
      this.ctx.beginPath()
      this.ctx.arc(0, 0, bm.size, 0, Math.PI * 2)
      this.ctx.fillStyle = bm.color
      this.ctx.fill()
    }

    this.ctx.restore()

    // Отображение здоровья над большим метеоритом
    if (bm.hp < bm.maxHp) {
      const barWidth = bm.size * 3
      const barHeight = 4
      const uiOffset = bm.size + 15

      // Фон бара
      this.ctx.fillStyle = 'rgba(0,0,0,0.6)'
      this.ctx.fillRect(bm.x - barWidth / 2, bm.y - uiOffset, barWidth, barHeight)

      // Полоса здоровья
      const hpRatio = Math.max(0, Math.min(1, bm.hp / bm.maxHp))
      this.ctx.fillStyle = '#00ff00'
      this.ctx.fillRect(bm.x - barWidth / 2, bm.y - uiOffset, barWidth * hpRatio, barHeight)
    }
  }

  drawShip(s: Ship) {
     // 1. ЛИНИЯ МАРШРУТА (Глобальные координаты)
     if (s.navTarget && s.state !== SHIP_STATE.PANIC) {
         this.ctx.beginPath(); this.ctx.moveTo(s.x, s.y); this.ctx.lineTo(s.navTarget.x, s.navTarget.y)
         this.ctx.strokeStyle = 'rgba(255,255,255,0.1)'; this.ctx.setLineDash([3,3]); this.ctx.stroke(); this.ctx.setLineDash([])
     }

     // 2. КОРПУС КОРАБЛЯ (С ВРАЩЕНИЕМ)
     this.ctx.save()
     this.ctx.translate(s.x, s.y)
     this.ctx.rotate(s.angle)
     this.ctx.scale(s.sizeMult, s.sizeMult)

     // Щит
     if (s.shield > 0) {
         this.ctx.beginPath(); this.ctx.arc(0, 0, 14, 0, Math.PI*2)
         this.ctx.strokeStyle = `rgba(59, 130, 246, ${s.shield/s.maxShield})`; this.ctx.lineWidth = 1; this.ctx.stroke()
     }

     // Пламя
     if (s.thrustPower > 0.1) {
        const flicker = Math.random() * 0.4 + 0.8
        const flameScale = s.state === SHIP_STATE.PANIC ? 180 : 80
        const flameLen = s.thrustPower * flameScale * flicker * 0.02

        this.ctx.beginPath(); this.ctx.moveTo(-6, -2); this.ctx.lineTo(-6 - flameLen * 20, 0); this.ctx.lineTo(-6, 2)
        this.ctx.fillStyle = s.state === SHIP_STATE.PANIC ? '#ef4444' : CONFIG.COLORS.shipEngines; this.ctx.fill()
     }

     // Тело с неоновым свечением (используем сгенерированный визуал)
     this.ctx.save()
     applyGlow(this.ctx, {
       color: s.color,
       intensity: 1.0,
       blur: 20
     })
     this.ctx.fillStyle = s.color
     this.ctx.beginPath()

     // Рисуем корпус по точкам из конфигурации
     const points = s.visualConfig.points
     if (points && points.length > 0) {
       const firstPoint = points[0]
       if (firstPoint) {
         this.ctx.moveTo(firstPoint.x, firstPoint.y)
         for (let i = 1; i < points.length; i++) {
           const point = points[i]
           if (point) {
             this.ctx.lineTo(point.x, point.y)
           }
         }
         this.ctx.closePath()
       }
     } else {
       // Fallback на старую форму
       this.ctx.moveTo(10,0); this.ctx.lineTo(-6,6); this.ctx.lineTo(-4,0); this.ctx.lineTo(-6,-6)
     }

     this.ctx.fill()
     this.ctx.strokeStyle = '#fff'; this.ctx.lineWidth = 1; this.ctx.stroke()

     // Дополнительные детали
     const config = s.visualConfig

     // Кабина
     if (config.hasCockpit) {
       this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
       this.ctx.beginPath()
       this.ctx.arc(config.length * 0.3, 0, 2, 0, Math.PI * 2)
       this.ctx.fill()
     }

     // Крылья (если есть)
     if (config.hasWings) {
       const wingOffset = config.width * config.wingSize
       this.ctx.strokeStyle = s.color
       this.ctx.lineWidth = 1.5
       this.ctx.beginPath()
       // Левое крыло
       this.ctx.moveTo(-config.length * 0.2, config.width * 0.5)
       this.ctx.lineTo(-config.length * 0.4, config.width * 0.5 + wingOffset)
       this.ctx.lineTo(-config.length * 0.3, config.width * 0.5)
       // Правое крыло
       this.ctx.moveTo(-config.length * 0.2, -config.width * 0.5)
       this.ctx.lineTo(-config.length * 0.4, -config.width * 0.5 - wingOffset)
       this.ctx.lineTo(-config.length * 0.3, -config.width * 0.5)
       this.ctx.stroke()
     }

     // Антенна
     if (config.hasAntenna) {
       this.ctx.strokeStyle = s.color
       this.ctx.lineWidth = 1
       this.ctx.beginPath()
       this.ctx.moveTo(config.length * 0.8, 0)
       this.ctx.lineTo(config.length * 0.9, -1)
       this.ctx.stroke()
     }

     this.ctx.restore()

     this.ctx.restore() // <--- СБРОС ВРАЩЕНИЯ И МАСШТАБА

     // 3. ИНТЕРФЕЙС (БЕЗ ВРАЩЕНИЯ, ВСЕГДА ГОРИЗОНТАЛЬНО)
     this.ctx.save()
     this.ctx.translate(s.x, s.y)

     // Смещаем интерфейс вверх над кораблем (учитываем размер корабля)
     const uiOffset = -18 * s.sizeMult
     const barWidth = 20

     // HP Bar (Зеленая)
     if (s.hp < s.maxHp) {
         this.ctx.fillStyle = 'rgba(0,0,0,0.6)'; this.ctx.fillRect(-barWidth/2, uiOffset - 3, barWidth, 3)
         this.ctx.fillStyle = '#00ff00'; this.ctx.fillRect(-barWidth/2, uiOffset - 3, barWidth * (s.hp/s.maxHp), 3)
     }

     // Reload / Charge Bar (Желтая)
     // Показываем, если оружие перезаряжается
     if (s.weapon && s.weapon.cooldownTimer > 0) {
         const maxCd = s.weapon.config.cooldown
         // Процент готовности (0..1)
         const pct = Math.max(0, 1 - (s.weapon.cooldownTimer / maxCd))

         this.ctx.fillStyle = 'rgba(0,0,0,0.6)'; this.ctx.fillRect(-barWidth/2, uiOffset + 1, barWidth, 2)
         this.ctx.fillStyle = '#fbbf24'; this.ctx.fillRect(-barWidth/2, uiOffset + 1, barWidth * pct, 2)
     }

     // Иконки (Оружие и Эффекты)
     const iconOffset = uiOffset - 10
     this.ctx.font = '10px monospace'; this.ctx.textAlign = 'center'; this.ctx.fillStyle = '#ffffff'

     let statusStr = ''

     // Иконка оружия
     if (s.weapon.icon) {
         statusStr += s.weapon.icon
     }

     // Иконки эффектов из statusIcons
     statusStr += s.statusIcons.join('')

     if (statusStr) {
         this.ctx.fillText(statusStr, 0, iconOffset)
     }
     this.ctx.restore()
  }

  drawPowerUp(p: PowerUp) {
    this.ctx.save()
    this.ctx.translate(p.x, p.y)

    // Пульсация размера
    const scale = 1 + Math.sin(p.pulse) * 0.2
    this.ctx.scale(scale, scale)

    // Свечение
    this.ctx.shadowBlur = 15
    this.ctx.shadowColor = p.color

    // Внешнее кольцо
    this.ctx.beginPath()
    this.ctx.arc(0, 0, 8, 0, Math.PI * 2)
    this.ctx.strokeStyle = p.color
    this.ctx.lineWidth = 2
    this.ctx.stroke()

    // Иконка внутри
    this.ctx.fillStyle = p.color
    this.ctx.font = '12px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.shadowBlur = 0

    // Получаем иконку из апгрейда
    const upgrade = UpgradeFactory.create(p.type)
    const symbol = upgrade ? upgrade.getIcon() : '?'
    this.ctx.fillText(symbol, 0, 1)

    this.ctx.restore()
  }

  drawProjectile(p: Projectile) {
    this.ctx.save()
    this.ctx.translate(p.x, p.y)
    p.drawSpecific(this.ctx)

    // HP / Fuel bar for Missiles
    if (p instanceof HomingMissile && p.fuel > 0) {
        this.ctx.rotate(0) // Reset rot
        this.ctx.fillStyle = '#555'; this.ctx.fillRect(-5, -10, 10, 2)
        this.ctx.fillStyle = '#f59e0b'; this.ctx.fillRect(-5, -10, 10 * (p.fuel/100), 2)
    }
    this.ctx.restore()
  }

  drawParticle(p: Particle) {
    const r = Math.max(0, p.size * p.life)
    this.ctx.beginPath(); this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
    this.ctx.fillStyle = p.color; this.ctx.globalAlpha = p.life; this.ctx.fill(); this.ctx.globalAlpha = 1
  }

  /**
   * Батчинг рендеринга частиц (группировка по цвету и альфе)
   */
  drawParticlesBatch(particles: readonly Particle[]): void {
    if (particles.length === 0) return

    // Группируем частицы по цвету и альфе для батчинга
    const batches = new Map<string, Particle[]>()
    for (const p of particles) {
      if (p.markedForDeletion || p.life <= 0) continue
      const r = Math.max(0, p.size * p.life)
      if (r <= 0) continue

      // Группируем по цвету и округленной альфе для лучшего батчинга
      const alphaKey = Math.floor(p.life * 10) / 10
      const key = `${p.color}|${alphaKey}`
      if (!batches.has(key)) {
        batches.set(key, [])
      }
      batches.get(key)!.push(p)
    }

    // Рендерим каждый батч
    for (const [key, batch] of batches) {
      if (batch.length === 0) continue

      const parts = key.split('|')
      const color = parts[0] || '#ffffff'
      const alphaStr = parts[1] || '1'
      const alpha = parseFloat(alphaStr)

      this.ctx.fillStyle = color
      this.ctx.globalAlpha = alpha
      this.ctx.beginPath()

      for (const p of batch) {
        const r = Math.max(0, p.size * p.life)
        if (r > 0) {
          this.ctx.moveTo(p.x + r, p.y)
          this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        }
      }

      this.ctx.fill()
    }

    this.ctx.globalAlpha = 1
  }

  drawStars(stars: Star[], warpFactor: number) {
     for (let i = 0; i < stars.length; i++) {
        const s = stars[i]
        if (!s) continue
        // Draw Star Dot
        this.ctx.beginPath(); this.ctx.arc(s.x, s.y, 2, 0, Math.PI * 2); this.ctx.fillStyle = s.color; this.ctx.fill()

        // Draw Warp Line
        if (warpFactor > 1.1) {
           const dx = s.x - window.innerWidth/2
           const dy = s.y - window.innerHeight/2
           const dist = Math.sqrt(dx*dx+dy*dy) || 1
           this.ctx.beginPath(); this.ctx.moveTo(s.x, s.y); this.ctx.lineTo(s.x - (dx/dist)*20*(warpFactor-1), s.y - (dy/dist)*20*(warpFactor-1))
           this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)'; this.ctx.lineWidth = 2; this.ctx.stroke()
        }
        // Draw Constellations
        else if (warpFactor < 1.2) {
           for (let j = i + 1; j < stars.length; j++) {
              const other = stars[j]
              if (!other) continue
              const d = MathUtils.dist(s, other)
              if (d < 150) {
                 this.ctx.beginPath(); this.ctx.moveTo(s.x, s.y); this.ctx.lineTo(other.x, other.y)
                 this.ctx.strokeStyle = `rgba(139, 92, 246, ${(1 - d/150) * 0.25})`; this.ctx.lineWidth = 1; this.ctx.stroke()
              }
           }
        }
     }
  }

  drawVoidSerpent(s: VoidSerpent) {
    // --- РИСУЕМ ЛИНИЮ МАРШРУТА (КАРТУ) ---
    if (s.navTarget) {
       this.ctx.beginPath()
       this.ctx.moveTo(s.x, s.y)
       this.ctx.lineTo(s.navTarget.x, s.navTarget.y)
       // Фиолетовая линия для змей
       this.ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)'
       this.ctx.lineWidth = 1
       this.ctx.setLineDash([2, 2]) // Мелкий пунктир
       this.ctx.stroke()
       this.ctx.setLineDash([])
    }
    // --------------------------------------
    if (s.segments.length < 2) return

    const first = s.segments[0]
    if (!first) return

    this.ctx.beginPath()
    this.ctx.moveTo(first.x, first.y)

    // Рисуем плавную кривую по сегментам
    for (let i = 1; i < s.segments.length - 1; i++) {
      const seg = s.segments[i]
      const next = s.segments[i + 1]
      if (!seg || !next) continue
      const xc = (seg.x + next.x) / 2
      const yc = (seg.y + next.y) / 2
      this.ctx.quadraticCurveTo(seg.x, seg.y, xc, yc)
    }

    // Свечение с неоновым эффектом
    this.ctx.save()
    applyGlow(this.ctx, {
      color: s.color,
      intensity: s.life,
      blur: 25
    })
    this.ctx.strokeStyle = s.color

    // УЧИТЫВАЕМ РАЗМЕР (sizeMult)
    const lineWidth = Math.max(0, (3 * s.life) * s.sizeMult)
    this.ctx.lineWidth = lineWidth

    this.ctx.lineCap = 'round'

    this.ctx.globalAlpha = Math.max(0, Math.min(1, s.life))
    if (lineWidth > 0) {
      this.ctx.stroke()
    }
    this.ctx.restore()

    // Голова (яркая точка) с неоновым свечением
    const headRadius = Math.max(0, (4 * s.life) * s.sizeMult)
    if (headRadius > 0) {
      this.ctx.save()
      applyGlow(this.ctx, {
        color: '#ffffff',
        intensity: s.life,
        blur: 20
      })
      this.ctx.beginPath()
      this.ctx.arc(first.x, first.y, headRadius, 0, Math.PI * 2)
      this.ctx.fillStyle = '#ffffff'
      this.ctx.fill()
      this.ctx.restore()
    }

    // HP Bar
    this.ctx.save()
    this.ctx.translate(first.x, first.y)
    this.ctx.fillStyle = 'rgba(255,0,0,0.5)'; this.ctx.fillRect(-15, -20, 30, 3)
    this.ctx.fillStyle = '#00ff00'; this.ctx.fillRect(-15, -20, 30 * (s.hp/s.maxHp), 3)
    this.ctx.restore()

    this.ctx.globalAlpha = 1
    this.ctx.shadowBlur = 0
  }
}

