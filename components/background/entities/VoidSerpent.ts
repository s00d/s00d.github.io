import { Entity } from './Entity'
import { CONFIG } from '../config'
import { BHState, type Effect } from '../types'
import { MathUtils } from '../utils/math'
import type { PowerUp } from './PowerUp'
import type { Ship } from './Ship'
import type { Simulation } from '../simulation'
import { TARGET_TYPE } from '../constants/states'
import { UpgradeFactory } from '../upgrades/UpgradeFactory'
import { GravityService } from '../services/GravityService'

export class VoidSerpent extends Entity {
  life: number = 1.0
  angle: number
  speed: number
  segments: {x: number, y: number}[] = []
  wobbleOffset: number = Math.random() * 100
  hp: number = 30
  maxHp: number = 30

  // Новые свойства для ИИ и бонусов
  activeEffects: Effect[] = []
  statusIcons: string[] = []
  sizeMult: number = 1.0
  navTarget: {x: number, y: number} | null = null // Для отрисовки линии
  targetType: typeof TARGET_TYPE.SHIP | typeof TARGET_TYPE.POWERUP | null = null

  // Модификаторы, управляемые апгрейдами
  damageMult: number = 1.0
  speedMult: number = 1.0

  constructor(x: number, y: number) {
    const hue = MathUtils.randomRange(250, 300)
    super(x, y, `hsla(${hue}, 100%, 70%, 1)`)
    this.angle = Math.random() * Math.PI * 2
    this.speed = MathUtils.randomRange(1.5, 2.5)
    this.segments.push({x, y})
  }

  // Применение бонусов - использует фабрику апгрейдов
  // Для змей оружие превращается в DAMAGE_BOOST
  applyPowerUp(p: PowerUp) {
    // Змеи не используют пушки, но получают статы
    // Оружие превращаем в урон
    if (p.type.startsWith('GET_') && p.type !== 'GET_SHIELD' && p.type !== 'GET_TELEPORT') {
      UpgradeFactory.apply('DAMAGE_BOOST', this)
      return
    }

    // Остальные апгрейды применяем через фабрику (включая HEAL с автоматической логикой)
    UpgradeFactory.apply(p.type, this)
  }

  // Расчет стоимости змеи
  get bounty() {
     let val = 50 // Базовая цена
     if (this.sizeMult > 1.2) val *= 2 // Большие дороже
     // За каждый бафф на змее доплачиваем
     if (this.activeEffects.length > 0) val += 25 * this.activeEffects.length
     return Math.floor(val)
  }

  takeDamage(sim: Simulation, damage: number = 1) {
    // Если маленький - сложнее попасть (можно добавить шанс уклонения), но меньше HP
    // Если большой - легче попасть, но урона проходит меньше (толстая шкура)
    const actualDamage = this.sizeMult > 1.5 ? damage * 0.7 : damage
    this.hp -= actualDamage

    // ПОКАЗЫВАЕМ УРОН (Критом считаем урон > 5, для примера)
    sim.spawnDamageText(this.x, this.y, actualDamage, actualDamage > 5)

    sim.createExplosion(this.x, this.y, 5, this.color)
    if (this.hp <= 0) {
      sim.createExplosion(this.x, this.y, 60, '#ffffff')

      // --- ВЫДАЧА НАГРАДЫ ---
      const reward = this.bounty
      sim.addCoins(reward, this.x, this.y)

      this.markedForDeletion = true
    }
  }

  private findTarget(sim: Simulation) {
      let closestDist = Infinity
      let target: Entity | null = null
      let type: typeof TARGET_TYPE.SHIP | typeof TARGET_TYPE.POWERUP | null = null
      // 1. Ищем Бонусы (Змеи тоже любят баффы)
      for (const p of sim.powerUps) {
          if (!p.isGood) continue
          const d = MathUtils.dist(this, p)
          if (d < closestDist && d < 400) { // Чует бонусы недалеко
              closestDist = d
              target = p
              type = TARGET_TYPE.POWERUP
          }
      }
      // 2. Ищем Корабли (Еда) - приоритет выше, если близко
      for (const s of sim.ships) {
          const d = MathUtils.dist(this, s)
          // Если корабль ближе текущего бонуса или бонуса нет - атакуем корабль
          if (d < closestDist && d < 800) {
              closestDist = d
              target = s
              type = TARGET_TYPE.SHIP
          }
      }
      if (target) {
          this.navTarget = {x: target.x, y: target.y}
          this.targetType = type
          return target
      }

      this.navTarget = null
      this.targetType = null
      return null
  }

  update(sim: Simulation) {
    const bh = sim.blackHole
    const distFromCenter = MathUtils.dist(this, bh)

    // --- НОВАЯ ЛОГИКА: УНИЧТОЖЕНИЕ ВЗРЫВОМ ---
    if (GravityService.shouldDieFromShockwave(this, bh)) {
        // Мгновенная смерть (наносим урона больше, чем макс. HP)
        this.takeDamage(sim, 9999)
        return
    }
    // ------------------------------------------

    // --- ОБРАБОТКА ЭФФЕКТОВ ---
    this.speedMult = 1.0
    this.sizeMult = 1.0
    this.damageMult = 1.0
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
        const eff = this.activeEffects[i]
        if (!eff) {
          this.activeEffects.splice(i, 1)
          continue
        }
        eff.timer--

        // Апгрейды напрямую изменяют свойства
        const upgrade = UpgradeFactory.create(eff.type)
        if (upgrade && upgrade.updateEffect) {
          upgrade.updateEffect(this, eff)
        }

        if (eff.timer <= 0) {
          this.activeEffects.splice(i, 1)
          // Удаляем иконку при истечении эффекта
          if (upgrade && upgrade.removeEffect) {
            upgrade.removeEffect(this)
          }
        }
    }
    // --- ИИ И ДВИЖЕНИЕ ---
    const target = this.findTarget(sim)

    if (target) {
        // Поворачиваем к цели
        const angleToTarget = MathUtils.angle(this, target)
        let diff = MathUtils.normalizeAngle(angleToTarget - this.angle)
        // Змея поворачивает медленнее кораблей
        this.angle += Math.sign(diff) * Math.min(Math.abs(diff), 0.05)

        // Ускоряемся к цели
        this.speed = 3.0 * this.speedMult

        // АТАКА (Укус)
        if (this.targetType === 'SHIP' && MathUtils.dist(this, target) < 30 * this.sizeMult) {
             // Кусаем корабль!
             (target as Ship).takeDamage(sim, 2 * this.damageMult)
             // Отталкиваемся
             this.angle += Math.PI
        }
        // ПОДБОР БОНУСА
        if (this.targetType === TARGET_TYPE.POWERUP && MathUtils.dist(this, target) < 30 * this.sizeMult) {
             this.applyPowerUp(target as PowerUp)
             ;(target as PowerUp).markedForDeletion = true
             sim.createExplosion(this.x, this.y, 10, target.color)
        }
    } else {
        // Если нет цели, просто плаваем вокруг дыры или от нее
        if (distFromCenter > 400) {
            // Возвращаемся к центру
             const angleToCenter = MathUtils.angle(this, bh)
             let diff = MathUtils.normalizeAngle(angleToCenter - this.angle)
             this.angle += Math.sign(diff) * Math.min(Math.abs(diff), 0.02)
        }
        this.speed = 2.0 * this.speedMult
    }

    // Движение головы
    this.x += Math.cos(this.angle) * this.speed
    this.y += Math.sin(this.angle) * this.speed
    // Добавляем сегменты (с учетом размера!)
    // Чем больше змея, тем "шире" волна
    const wobble = Math.sin(Date.now() * 0.005 + this.wobbleOffset) * (3 * this.sizeMult)
    const nextX = this.x + Math.cos(this.angle + Math.PI/2) * wobble
    const nextY = this.y + Math.sin(this.angle + Math.PI/2) * wobble
    this.segments.unshift({x: nextX, y: nextY})
    // Длина хвоста тоже зависит от размера
    const maxSegments = 40 * this.sizeMult
    if (this.segments.length > maxSegments) {
      this.segments.pop()
    }

    // Удаление, если улетел далеко (в обычном режиме)
    if (distFromCenter > 900) this.life -= 0.01
    if (this.life <= 0) this.markedForDeletion = true
  }
}

