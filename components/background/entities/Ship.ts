import { Entity } from './Entity'
import { CONFIG } from '../config'
import { BHState, type ShipState, type Effect } from '../types'
import { MathUtils } from '../utils/math'
import { Navigator } from '../utils/navigator'
import type { Simulation } from '../simulation'
import type { PowerUp } from './PowerUp'
import type { VoidSerpent } from './VoidSerpent'
import type { Weapon } from '../weapons/Weapon'
import { Blaster } from '../weapons/Blaster'
import { UpgradeFactory } from '../upgrades/UpgradeFactory'
import { RegenUpgrade } from '../upgrades/RegenUpgrade'
import { CritService } from '../services/CritService'
import { EconomyService } from '../services/EconomyService'
import { GravityService } from '../services/GravityService'
import { EffectService } from '../services/EffectService'
import { TargetFinder } from '../services/TargetFinder'
import { SHIP_STATE, TARGET_TYPE, COMBAT_MANEUVERS } from '../constants/states'
import { ShipVisualGenerator, type ShipVisualConfig } from '../generators/ShipVisualGenerator'
import type { TargetType } from '../services/TargetFinder'
import { DamageApplicationService } from '../services/DamageApplicationService'
import { DeathService } from '../services/DeathService'
import { EffectSpawnService } from '../services/EffectSpawnService'
import { EntityAIService } from '../services/EntityAIService'
import { EntityMovementService } from '../services/EntityMovementService'
import { EntityCombatService } from '../services/EntityCombatService'

export class Ship extends Entity {
  /**
   * Проверяет, может ли корабль атаковать цель данного типа
   * @param targetType - тип цели
   * @returns true, если корабль может атаковать эту цель
   */
  static canAttack(targetType: TargetType): boolean {
    return targetType === TARGET_TYPE.SERPENT ||
           targetType === TARGET_TYPE.SHIP ||
           targetType === TARGET_TYPE.BIG_METEOR
  }
  // Визуальная конфигурация корабля
  visualConfig: ShipVisualConfig
  angle: number
  cooldown: number = 0
  bombCooldown: number = 0
  thrustPower: number = 0
  hp: number = 5
  maxHp: number = 5
  state: ShipState = SHIP_STATE.ROAM

  // Текущая цель навигации
  navTarget: {x: number, y: number} | null = null
  // Тип цели для отрисовки интерфейса
  targetType: TargetType = null

  wanderTarget: {x: number, y: number} | null = null
  combatTimer: number = 0
  combatManeuver: typeof COMBAT_MANEUVERS.CHARGE | typeof COMBAT_MANEUVERS.FLANK | typeof COMBAT_MANEUVERS.RETREAT = COMBAT_MANEUVERS.FLANK

  // Добавляем хранилище эффектов
  activeEffects: Effect[] = []
  statusIcons: string[] = []

  // НОВЫЕ ПОЛЯ
  weapon: Weapon
  weaponTimer: number = 0 // Таймер действия спец. оружия

  // Новые статы
  shield: number = 0        // Текущий щит
  maxShield: number = 5     // Макс щит
  hasTeleport: boolean = false
  bombLevel: number = 1     // 1 = обычная, 2 = мега
  rangeMult: number = 1.0   // Множитель дальности
  sizeMult: number = 1.0    // Множитель размера
  regenTimer: number = 0    // Таймер для наноботов

  // Модификаторы, управляемые апгрейдами
  speedMult: number = 1.0
  damageMult: number = 1.0
  reloadMult: number = 1.0
  isJammed: boolean = false

  constructor(x: number, y: number, angle: number) {
    super(x, y, MathUtils.randomColor()) // Unique color
    this.angle = angle
    this.weapon = new Blaster() // Оружие по умолчанию

    // Генерируем уникальный визуал для корабля
    this.visualConfig = ShipVisualGenerator.generate()

    // 1. HULL UPGRADE
    this.maxHp = 5 + (EconomyService.getHullLevel() - 1) * 3
    this.hp = this.maxHp

    // 2. SHIELD UPGRADE (Новое)
    // База 0. Каждый уровень дает +5 щита.
    this.maxShield = EconomyService.getShieldLevel() * 5
    this.shield = this.maxShield // Спавнимся с полным щитом

    this.cooldown = MathUtils.randomRange(0, 100)
    this.bombCooldown = MathUtils.randomRange(0, 500)
  }

  // Метод применения бонуса - использует фабрику апгрейдов
  applyPowerUp(p: PowerUp, sim: Simulation) {
    UpgradeFactory.apply(p.type, this, sim)
  }


  // --- ГЛАВНЫЙ МЕТОД ПОИСКА ЦЕЛИ ---
  private findBestTarget(sim: Simulation): { target: {x: number, y: number, vx?: number, vy?: number} | null, type: TargetType } {
    return TargetFinder.findForShip(this, sim)
  }

  update(sim: Simulation) {
    // --- 0. ОБРАБОТКА ЭФФЕКТОВ ---
    // Сбрасываем множители к дефолту
    this.speedMult = 1.0
    // Применяем глобальные улучшения урона и скорости
    this.damageMult = EconomyService.getDamageMultiplier()
    this.reloadMult = EconomyService.getReloadMultiplier()
    this.isJammed = false

    // Обработка эффектов через сервис
    EffectService.updateEffects(this)

    // Если мы маленькие - мы быстрее!
    if (this.sizeMult < 1.0) this.speedMult *= 1.3
    // Если большие - медленнее, но больше HP (визуально)
    if (this.sizeMult > 1.0) this.speedMult *= 0.8

    // Обновляем таймер оружия самого корабля (возврат к бластеру)
    if (this.weaponTimer > 0) {
        this.weaponTimer--
        if (this.weaponTimer <= 0) this.weapon = new Blaster()
    }

    // ОБНОВЛЯЕМ САМО ОРУЖИЕ (для кулдауна)
    this.weapon.update()

    // ЛОГИКА ТЕЛЕПОРТА (В бою)
    if (this.hasTeleport) {
      const teleportUpgrade = UpgradeFactory.create('GET_TELEPORT')
      if (teleportUpgrade) {
        teleportUpgrade.tryTeleport(this, sim)
      }
    }

    const bh = sim.blackHole
    const distToBHSq = MathUtils.distSq(this, bh)
    const distToBH = Math.sqrt(distToBHSq) // Вычисляем только если нужно
    const angleToBH = MathUtils.angle(this, bh)

    // 1. СМЕРТЬ
    if (GravityService.shouldDieFromShockwave(this, bh)) {
      DeathService.handleShipDeath(this, sim)
      return
    }
    if (GravityService.shouldDieFromGravity(this, bh)) {
      bh.mass += CONFIG.MASS_GAIN_SHIP
      DeathService.handleShipDeath(this, sim)
      return
    }

    // 2. ГРАВИТАЦИЯ
    const gravityPull = GravityService.calculateGravityPull(this, bh)
    if (gravityPull) {
      this.vx += gravityPull.vx
      this.vy += gravityPull.vy
    }

    // 3. ПРИНЯТИЕ РЕШЕНИЙ (BRAIN) - используем сервис
    const aiResult = EntityAIService.updateShipAI(this, sim)
    this.state = aiResult.state
    this.navTarget = aiResult.target
    this.targetType = aiResult.targetType
    const desiredAngle = aiResult.desiredAngle
    const engineThrust = aiResult.engineThrust

    // 4. БОЕВАЯ ЛОГИКА - используем сервис
    if (aiResult.target && (Ship.canAttack(aiResult.targetType) || (sim.bigMeteor && aiResult.target.x === sim.bigMeteor.x && aiResult.target.y === sim.bigMeteor.y))) {
      const distToTarget = MathUtils.dist(this, aiResult.target)
      const isSerpent = aiResult.targetType === TARGET_TYPE.SERPENT
      EntityCombatService.updateShipCombat(this, aiResult.target, distToTarget, isSerpent, sim)
    }

    // 5. ИЗБЕГАНИЕ СОЮЗНИКОВ - используем сервис
    EntityMovementService.applyShipAvoidance(this, sim)

    // 6. ИЗБЕГАНИЕ БОЛЬШОГО МЕТЕОРИТА - используем сервис
    EntityMovementService.applyShipBigMeteorAvoidance(this, sim)

    // 7. REGEN UPGRADE (Наноботы)
    const regenUpgrade = RegenUpgrade.getInstance()
    const regenTimer = { value: this.regenTimer }
    if (regenUpgrade.updateRegen(this, regenTimer)) {
      // Эффект починки (маленькие зеленые плюсики/частицы)
      EffectSpawnService.createExplosion(this.x, this.y, 2, '#10b981', sim)
    }
    this.regenTimer = regenTimer.value

    // Не забываем обновлять макс щит, если купили улучшение во время жизни корабля
    const currentMaxShield = EconomyService.getShieldLevel() * 5
    if (this.maxShield < currentMaxShield) {
        this.shield += (currentMaxShield - this.maxShield) // Добавляем разницу
        this.maxShield = currentMaxShield
    }

    // 8. ДВИЖЕНИЕ - используем сервис
    EntityMovementService.applyShipMovement(this, desiredAngle, engineThrust, sim)
  }

  // --- ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ БОЯ ---

  public combatManeuverAngle(target: {x: number, y: number}, dist: number): number {
      const angleToEnemy = MathUtils.angle(this, target)

      // Таймер смены тактики
      this.combatTimer--
      if (this.combatTimer <= 0) {
          this.combatTimer = MathUtils.randomRange(60, 120)
          const r = Math.random()
          this.combatManeuver = r < 0.4 ? COMBAT_MANEUVERS.CHARGE : (r < 0.8 ? COMBAT_MANEUVERS.FLANK : COMBAT_MANEUVERS.RETREAT)
      }

      if (this.combatManeuver === COMBAT_MANEUVERS.CHARGE) return angleToEnemy
      if (this.combatManeuver === COMBAT_MANEUVERS.RETREAT) return angleToEnemy + Math.PI
      // FLANK: Летим перпендикулярно (окружаем)
      return angleToEnemy + Math.PI / 2
  }

  private handleCombat(sim: Simulation, target: any, dist: number, isSerpent: boolean) {
      // Оптимизация: используем distSq для сравнений
      const distSq = dist * dist

      // Проверка на большой метеорит - атакуем обычным оружием и бомбами
      const isBigMeteor = sim.bigMeteor && target === sim.bigMeteor

      if (isBigMeteor) {
        // Рассчитываем упреждение для большого метеорита
        const tvx = target.vx || 0
        const tvy = target.vy || 0
        const leadX = target.x + tvx * 15
        const leadY = target.y + tvy * 15
        const leadAngle = MathUtils.angle(this, {x: leadX, y: leadY})
        const aimDiff = Math.abs(MathUtils.normalizeAngle(leadAngle - this.angle))

        // Стрельба обычным оружием
        if (this.weapon.isReady && !this.isJammed) {
          const allowedAngle = this.weapon.getAllowedAngle()
          const range = this.weapon.getRange(CONFIG.SHIP_ENGAGEMENT_DIST)
          const rangeSq = range * range

          if (distSq < rangeSq && aimDiff < allowedAngle) {
            const critResult = CritService.calculateCritDamage(this.damageMult)
            this.weapon.fire(sim, this, leadAngle, critResult.damage, this.reloadMult)
          }
        }

        // Атака большого метеорита бомбами
        if (this.bombLevel > 0 && this.bombCooldown <= 0) {
          const angleToTarget = MathUtils.angle(this, target)
          const aimDiffBomb = Math.abs(MathUtils.normalizeAngle(angleToTarget - this.angle))

          // Стреляем бомбой, если смотрим на большой метеорит
          if (distSq < (600 * 600) && aimDiffBomb < 0.8) {
            const damage = this.bombLevel === 2 ? CONFIG.BOMB_DAMAGE * 2 : CONFIG.BOMB_DAMAGE
            EffectSpawnService.spawnBomb(this.x, this.y, this.vx, this.vy, angleToTarget, this.bombLevel, sim)
            this.bombCooldown = 400
          }
        }
        return
      }

      // Рассчитываем упреждение
      // Если у цели есть скорость (корабль), используем её. Если нет (сегмент змеи), считаем 0
      const tvx = target.vx || 0
      const tvy = target.vy || 0

      const leadX = target.x + tvx * 15
      const leadY = target.y + tvy * 15
      const leadAngle = MathUtils.angle(this, {x: leadX, y: leadY})

      const aimDiff = Math.abs(MathUtils.normalizeAngle(leadAngle - this.angle))

      // Стрельба
      if (this.weapon.isReady && !this.isJammed) {
          // Угол стрельбы зависит от типа оружия
          const allowedAngle = this.weapon.getAllowedAngle()

          // Дальность стрельбы
          const range = this.weapon.getRange(CONFIG.SHIP_ENGAGEMENT_DIST)
          const rangeSq = range * range

          if (distSq < rangeSq && aimDiff < allowedAngle) {
              // 4. CRIT UPGRADE
              const critResult = CritService.calculateCritDamage(this.damageMult)
              this.weapon.fire(sim, this, leadAngle, critResult.damage, this.reloadMult)
          }
      }

      // Кидаем бомбу в дыру (попутно), если смотрим на неё
      if (this.bombLevel > 0 && this.bombCooldown <= 0) {
        const bombUpgrade = UpgradeFactory.create('UPGRADE_BOMB')
        if (bombUpgrade) {
          bombUpgrade.tryFireBomb(this, sim)
        }
      }
  }

  takeDamage(sim: Simulation, damage: number = 1) {
    // Делегируем обработку урона в сервис
    DamageApplicationService.applyDamageToShip(this, damage, sim)
  }
}

