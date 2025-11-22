import { Entity } from './Entity'
import { CONFIG } from '../config'
import { BHState, type Effect } from '../types'
import { MathUtils } from '../utils/math'
import { PowerUp } from './PowerUp'
import type { Ship } from './Ship'
import type { Simulation } from '../simulation'
import { TARGET_TYPE } from '../constants/states'
import { UpgradeFactory } from '../upgrades/UpgradeFactory'
import { GravityService } from '../services/GravityService'
import { EffectService } from '../services/EffectService'
import { TargetFinder, type TargetType } from '../services/TargetFinder'
import { CoinReward } from '../ui/CoinReward'
import { economy } from '../economy'
import { DamageApplicationService } from '../services/DamageApplicationService'
import { EffectSpawnService } from '../services/EffectSpawnService'
import { EntityAIService } from '../services/EntityAIService'
import { EntityMovementService } from '../services/EntityMovementService'
import { EntityCombatService } from '../services/EntityCombatService'

export class VoidSerpent extends Entity {
  /**
   * Проверяет, может ли змея атаковать цель данного типа
   * @param targetType - тип цели
   * @returns true, если змея может атаковать эту цель
   */
  static canAttack(targetType: TargetType): boolean {
    return targetType === TARGET_TYPE.SHIP
  }
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
  targetType: TargetType = null

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
  applyPowerUp(p: PowerUp, sim: Simulation) {
    // Змеи не используют пушки, но получают статы
    // Оружие превращаем в урон
    if (p.type.startsWith('GET_') && p.type !== 'GET_SHIELD' && p.type !== 'GET_TELEPORT') {
      UpgradeFactory.apply('DAMAGE_BOOST', this, sim)
      return
    }

    // Остальные апгрейды применяем через фабрику (включая HEAL с автоматической логикой)
    UpgradeFactory.apply(p.type, this, sim)
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
    // Делегируем обработку урона в сервис
    DamageApplicationService.applyDamageToSerpent(this, damage, sim)
  }

  private findTarget(sim: Simulation) {
      const result = TargetFinder.findForSerpent(this, sim)
      if (result.target) {
          this.navTarget = {x: result.target.x, y: result.target.y}
          // VoidSerpent может атаковать только SHIP или POWERUP
          this.targetType = (result.type === TARGET_TYPE.SHIP || result.type === TARGET_TYPE.POWERUP) ? result.type : null
          return result.target as Entity
      }

      this.navTarget = null
      this.targetType = null
      return null
  }

  update(sim: Simulation) {
    const bh = sim.blackHole
    // Оптимизация: используем distSq для сравнений
    const distFromCenterSq = MathUtils.distSq(this, bh)
    const distFromCenter = Math.sqrt(distFromCenterSq) // Вычисляем только если нужно

    // --- НОВАЯ ЛОГИКА: УНИЧТОЖЕНИЕ ВЗРЫВОМ ---
    if (GravityService.shouldDieFromShockwave(this, bh)) {
        // Мгновенная смерть (наносим урона больше, чем макс. HP)
        this.takeDamage(sim, 9999)
        return
    }
    // ------------------------------------------

    // --- ОБРАБОТКА ЭФФЕКТОВ ---
    EffectService.updateEffects(this)

    // --- ИИ И ДВИЖЕНИЕ - используем сервис ---
    const aiResult = EntityAIService.updateSerpentAI(this, sim)
    this.navTarget = aiResult.target
    this.targetType = aiResult.targetType

    // --- БОЕВАЯ ЛОГИКА - используем сервис ---
    if (aiResult.target) {
      const targetEntity = this.findTarget(sim)
      if (targetEntity) {
        // Пытаемся атаковать
        if (VoidSerpent.canAttack(aiResult.targetType)) {
          EntityCombatService.trySerpentAttack(this, targetEntity, aiResult.targetType, sim)
        }
        // Пытаемся подобрать бонус
        if (aiResult.targetType === TARGET_TYPE.POWERUP && targetEntity instanceof PowerUp) {
          EntityCombatService.trySerpentPowerUpPickup(this, targetEntity, sim)
        }
      }
    }

    // --- ДВИЖЕНИЕ - используем сервис ---
    EntityMovementService.applySerpentMovement(this, aiResult.angle, aiResult.speed, sim)
    EntityMovementService.updateSerpentSegments(this, sim)

    // Удаление, если улетел далеко (в обычном режиме)
    if (distFromCenterSq > (900 * 900)) this.life -= 0.01
    if (this.life <= 0) this.markedForDeletion = true
  }
}

