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
import { SHIP_STATE, TARGET_TYPE, COMBAT_MANEUVERS } from '../constants/states'
import { ShipVisualGenerator, type ShipVisualConfig } from '../generators/ShipVisualGenerator'

export class Ship extends Entity {
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
  targetType: typeof TARGET_TYPE.SERPENT | typeof TARGET_TYPE.SHIP | typeof TARGET_TYPE.POINT | typeof TARGET_TYPE.POWERUP | null = null

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
  applyPowerUp(p: PowerUp) {
    UpgradeFactory.apply(p.type, this)
  }


  // --- ГЛАВНЫЙ МЕТОД ПОИСКА ЦЕЛИ ---
  private findBestTarget(sim: Simulation): { target: {x: number, y: number, vx?: number, vy?: number} | null, type: typeof TARGET_TYPE.SERPENT | typeof TARGET_TYPE.SHIP | typeof TARGET_TYPE.POINT | typeof TARGET_TYPE.POWERUP | null } {
    // 0. Приоритет: БОНУСЫ (Жадность!)
    // Ищем ближайший ХОРОШИЙ бонус
    let closestBuff: PowerUp | null = null
    let minBuffDist = Infinity

    for (const p of sim.powerUps) {
        if (!p.isGood) continue // Игнорируем плохие
        const d = MathUtils.dist(this, p)
        // Летим за бонусом, если он не на другом конце карты
        if (d < minBuffDist && d < 500) {
            minBuffDist = d
            closestBuff = p
        }
    }
    if (closestBuff) return { target: closestBuff, type: TARGET_TYPE.POWERUP }

    // 1. Приоритет: ЗМЕИ (PvE)
    // Ищем ближайшую змею
    let closestSerpent: VoidSerpent | null = null
    let minSerpentDist = Infinity

    for (const serpent of sim.serpents) {
      const d = MathUtils.dist(this, serpent)
      if (d < minSerpentDist) {
        minSerpentDist = d
        closestSerpent = serpent
      }
    }

    // Если змея найдена - это наша цель
    if (closestSerpent && closestSerpent.segments.length > 0) {
       // Целимся в голову
       const head = closestSerpent.segments[0]
       if (head) {
         return { target: head, type: TARGET_TYPE.SERPENT }
       }
    }

    // 2. Приоритет: ВРАЖЕСКИЕ КОРАБЛИ (PvP)
    let closestShip: Ship | null = null
    let minShipDist = Infinity

    for (const other of sim.ships) {
      if (other === this) continue
      const d = MathUtils.dist(this, other)
      if (d < minShipDist) {
        minShipDist = d
        closestShip = other
      }
    }

    // Атакуем корабль, если он в радиусе радара (довольно далеко)
    if (closestShip && minShipDist < 1000) {
      return { target: closestShip, type: TARGET_TYPE.SHIP }
    }

    // 3. Приоритет: ПАТРУЛЬ (Waypoints)
    if (!this.wanderTarget || MathUtils.dist(this, this.wanderTarget) < 100) {
      const margin = 100
      this.wanderTarget = {
        x: MathUtils.randomRange(margin, sim.width - margin),
        y: MathUtils.randomRange(margin, sim.height - margin)
      }
    }
    return { target: this.wanderTarget, type: TARGET_TYPE.POINT }
  }

  update(sim: Simulation) {
    // --- 0. ОБРАБОТКА ЭФФЕКТОВ ---
    // Сбрасываем множители к дефолту
    this.speedMult = 1.0
    // Применяем глобальные улучшения урона и скорости
    this.damageMult = EconomyService.getDamageMultiplier()
    this.reloadMult = EconomyService.getReloadMultiplier()
    this.isJammed = false

    // Перебираем активные эффекты
    this.sizeMult = 1.0 // Сброс перед пересчетом
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
      if (teleportUpgrade && 'tryTeleport' in teleportUpgrade) {
        (teleportUpgrade as any).tryTeleport(this, sim)
      }
    }

    const bh = sim.blackHole
    const distToBH = MathUtils.dist(this, bh)
    const angleToBH = MathUtils.angle(this, bh)

    // 1. СМЕРТЬ
    if (GravityService.shouldDieFromShockwave(this, bh)) {
      this.die(sim)
      return
    }
    if (GravityService.shouldDieFromGravity(this, bh)) {
      bh.mass += CONFIG.MASS_GAIN_SHIP
      this.die(sim)
      return
    }

    // 2. ГРАВИТАЦИЯ
    const gravityPull = GravityService.calculateGravityPull(this, bh)
    if (gravityPull) {
      this.vx += gravityPull.vx
      this.vy += gravityPull.vy
    }

    // 3. ПРИНЯТИЕ РЕШЕНИЙ (BRAIN)
    const { target, type } = this.findBestTarget(sim)
    this.navTarget = target
    this.targetType = type

    let desiredAngle = this.angle
    let engineThrust = 0.4

    const panicDist = 180 + (bh.mass / CONFIG.CRITICAL_MASS) * 200

    // A. ПАНИКА (Override всего)
    if (bh.state !== BHState.EXPLODING && distToBH < panicDist) {
      this.state = SHIP_STATE.PANIC
      desiredAngle = MathUtils.angle(bh, this) // Строго от дыры
      engineThrust = 1.0 // Максимальный форсаж
    }
    else if (target) {
      // B. УМНАЯ НАВИГАЦИЯ К ЦЕЛИ
      const distToTarget = MathUtils.dist(this, target)
      const angleToTarget = MathUtils.angle(this, target)

      // Проверяем, перекрывает ли черная дыра путь к цели
      // (Простая проверка: если дыра ближе, чем цель, и угол совпадает)
      const angleDiffBH = Math.abs(MathUtils.normalizeAngle(angleToTarget - angleToBH))
      const isPathBlocked = distToBH < distToTarget && angleDiffBH < 0.8 // ~45 градусов

      if (isPathBlocked && bh.state !== BHState.EXPLODING) {
        // МАРШРУТИЗАЦИЯ: Огибаем дыру
        // Если дыра слева, летим правее, и наоборот
        const avoidDir = MathUtils.normalizeAngle(angleToBH - this.angle) > 0 ? -1 : 1
        desiredAngle = angleToBH + (Math.PI / 2) * avoidDir // Летим по касательной
        this.state = SHIP_STATE.ROAM // Мы пока просто летим
      } else {
        // Путь чист, выполняем боевую задачу или полет
        if (type === TARGET_TYPE.SERPENT || type === TARGET_TYPE.SHIP) {
           this.state = SHIP_STATE.DOGFIGHT
           const distToTarget = MathUtils.dist(this, target)
           this.handleCombat(sim, target, distToTarget, type === TARGET_TYPE.SERPENT)
           desiredAngle = this.combatManeuverAngle(target, distToTarget)

           // Ускоряемся если цель далеко
           engineThrust = distToTarget > 400 ? 0.7 : 0.5
        } else {
           this.state = SHIP_STATE.ROAM
           desiredAngle = Navigator.getPathToTarget(this, target, bh)
           engineThrust = 0.4
        }
      }
    }

    // 4. ИЗБЕГАНИЕ СОЮЗНИКОВ (используем Navigator)
    const push = Navigator.getAvoidanceVector(this, sim.ships, CONFIG.SHIP_SEPARATION)
    this.vx += push.x * 0.5
    this.vy += push.y * 0.5

    // 5. REGEN UPGRADE (Наноботы)
    const regenUpgrade = RegenUpgrade.getInstance()
    const regenTimer = { value: this.regenTimer }
    if (regenUpgrade.updateRegen(this, regenTimer)) {
      // Эффект починки (маленькие зеленые плюсики/частицы)
      sim.createExplosion(this.x, this.y, 2, '#10b981')
    }
    this.regenTimer = regenTimer.value

    // Не забываем обновлять макс щит, если купили улучшение во время жизни корабля
    const currentMaxShield = EconomyService.getShieldLevel() * 5
    if (this.maxShield < currentMaxShield) {
        this.shield += (currentMaxShield - this.maxShield) // Добавляем разницу
        this.maxShield = currentMaxShield
    }

    // 6. ДВИЖЕНИЕ
    this.cooldown--; this.bombCooldown--

    let diff = MathUtils.normalizeAngle(desiredAngle - this.angle)
    const turnSpeed = this.state === SHIP_STATE.DOGFIGHT ? CONFIG.SHIP_TURN_SPEED * 2.0 : CONFIG.SHIP_TURN_SPEED
    this.angle += Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed)

    this.vx += Math.cos(this.angle) * engineThrust
    this.vy += Math.sin(this.angle) * engineThrust
    this.vx *= 0.96; this.vy *= 0.96

    const speed = Math.hypot(this.vx, this.vy)
    const maxSpeed = (this.state === SHIP_STATE.PANIC ? CONFIG.SHIP_SPEED * 2 : CONFIG.SHIP_SPEED) * this.speedMult
    if (speed > maxSpeed) {
      this.vx = (this.vx / speed) * maxSpeed
      this.vy = (this.vy / speed) * maxSpeed
    }

    this.thrustPower = engineThrust
    const warpMult = sim.warpFactor > 1.1 ? sim.warpFactor * 0.7 : 1
    this.x += this.vx * warpMult
    this.y += this.vy * warpMult

    // Wrap
    const m = 30
    if (this.x < -m) this.x = sim.width + m; else if (this.x > sim.width + m) this.x = -m
    if (this.y < -m) this.y = sim.height + m; else if (this.y > sim.height + m) this.y = -m
  }

  // --- ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ БОЯ ---

  private combatManeuverAngle(target: {x: number, y: number}, dist: number): number {
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

          if (dist < range && aimDiff < allowedAngle) {
              // 4. CRIT UPGRADE
              const critResult = CritService.calculateCritDamage(this.damageMult)
              this.weapon.fire(sim, this, leadAngle, critResult.damage, this.reloadMult)
          }
      }

      // Кидаем бомбу в дыру (попутно), если смотрим на неё
      if (this.bombLevel > 0 && this.bombCooldown <= 0) {
        const bombUpgrade = UpgradeFactory.create('UPGRADE_BOMB')
        if (bombUpgrade && 'tryFireBomb' in bombUpgrade) {
          (bombUpgrade as any).tryFireBomb(this, sim)
        }
      }
  }

  takeDamage(sim: Simulation, damage: number = 1) {
    sim.spawnDamageText(this.x, this.y, damage, false) // Урон по кораблю

    // Сначала урон идет в щит
    if (this.shield > 0) {
        this.shield -= damage
        // Эффект удара по щиту (синий)
        sim.createExplosion(this.x, this.y, 5, CONFIG.COLORS.shield)
        if (this.shield < 0) {
            this.hp += this.shield // Переносим остаток урона на HP
            this.shield = 0
        }
    } else {
        this.hp -= damage
        sim.createExplosion(this.x, this.y, 10, this.color)
    }

    if (this.hp <= 0) this.die(sim)
  }

  private die(sim: Simulation) {
    sim.createExplosion(this.x, this.y, 50, this.color)
    this.markedForDeletion = true
  }
}

