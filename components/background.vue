<script setup lang="ts">
import { onMounted, onUnmounted, ref, reactive, computed } from 'vue'

interface Props {
  showUI?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showUI: true
})

const canvasRef = ref<HTMLCanvasElement | null>(null)

// ==========================================
// 0. ЭКОНОМИКА И МАГАЗИН (ОБНОВЛЕНО)
// ==========================================

const economy = reactive({
  coins: 0,

  // УРОВНИ (Начальные значения)
  shipsCount: 4,      // Старт: 4
  damageLevel: 1,     // Старт: 1
  hullLevel: 1,
  turretSpeed: 1,

  shieldLevel: 0,     // Старт: 0
  critLevel: 0,
  regenLevel: 0,
  magnetLevel: 1
})

// РАСЧЕТ СТОИМОСТИ (Экспоненциальный рост)
const costs = computed(() => {
  // Вспомогательная функция для формулы: Base * (Multiplier ^ Level)
  const calc = (base: number, mult: number, level: number) => Math.floor(base * Math.pow(mult, level))

  return {
    // 1. КОРАБЛИ (Luxury). База 1000. Каждый след. в 2.2 раза дороже.
    // shipsCount - 4, чтобы цена за 5-й корабль была базовой
    ship: calc(1000, 2.2, economy.shipsCount - 4),

    // 2. БОЕВЫЕ (Core). База 250. Рост x1.4 (умеренный)
    damage: calc(250, 1.4, economy.damageLevel - 1),
    turret: calc(300, 1.45, economy.turretSpeed - 1),

    // 3. ВЫЖИВАНИЕ. База 200. Рост x1.35 (чуть дешевле)
    hull: calc(200, 1.35, economy.hullLevel - 1),
    shield: calc(400, 1.4, economy.shieldLevel), // shieldLevel начинается с 0

    // 4. ТЕХНОЛОГИИ (Special). База 500. Рост x1.6 (быстрый)
    crit: calc(500, 1.6, economy.critLevel),
    regen: calc(600, 1.6, economy.regenLevel),
    magnet: calc(300, 1.5, economy.magnetLevel - 1)
  }
})

const buyUpgrade = (type: keyof typeof costs.value) => {
  const cost = costs.value[type]

  if (economy.coins >= cost) {
    economy.coins -= cost

    // Применение уровней
    if (type === 'ship') {
        economy.shipsCount++
        CONFIG.SHIP_COUNT = economy.shipsCount
    }
    else if (type === 'damage') economy.damageLevel++
    else if (type === 'hull') economy.hullLevel++
    else if (type === 'turret') economy.turretSpeed++
    else if (type === 'shield') economy.shieldLevel++
    else if (type === 'crit') economy.critLevel++
    else if (type === 'regen') economy.regenLevel++
    else if (type === 'magnet') economy.magnetLevel++
  }
}

// ==========================================
// 1. КОНФИГУРАЦИЯ
// ==========================================

const CONFIG = {
  POINT_COUNT: 60,
  MAX_METEORS: 20,
  GRAVITY_RADIUS_BASE: 700,

  START_RADIUS: 20,
  CRITICAL_MASS: 300,
  MASS_GAIN_METEOR: 2.0,
  MASS_GAIN_SHIP: 10.0,
  BOMB_DAMAGE: 6.0,

  SHIP_COUNT: 4,
  SHIP_SPEED: 4.0,          // Чуть быстрее
  SHIP_TURN_SPEED: 0.12,    // Резче поворачивают
  SHIP_SEPARATION: 80,
  SHIP_ENGAGEMENT_DIST: 600, // Видят врагов намного дальше (было 300)

  POWERUP_RATE: 0.015, // Шанс появления бонуса (примерно раз в секунду)
  POWERUP_DURATION: 600, // Длительность эффекта (10 сек при 60fps)

  // Добавим настройки размера
  SIZE_MODIFIER_BIG: 1.8,
  SIZE_MODIFIER_SMALL: 0.6,

  // НАСТРОЙКИ ОРУЖИЯ (ВСЕ 9 ТИПОВ)
  WEAPONS: {
    // Старые
    BLASTER: { cooldown: 40, damage: 1, speed: 12, spread: 0.05, color: null, size: 2 },
    MINIGUN: { cooldown: 5, damage: 0.3, speed: 14, spread: 0.3, color: '#f59e0b', size: 1.5 },
    SHOTGUN: { cooldown: 60, damage: 0.8, speed: 10, spread: 0.4, count: 5, color: '#ef4444', size: 2 },
    RAILGUN: { cooldown: 100, damage: 10, speed: 40, spread: 0, color: '#06b6d4', size: 4 },
    // Новые
    MISSILE: { cooldown: 120, damage: 4, speed: 5, spread: 0.2, color: '#ec4899', size: 3 }, // Самонаводка
    PLASMA:  { cooldown: 150, damage: 0.5, speed: 3, spread: 0, color: '#8b5cf6', size: 8 }, // Медленный шар, урон каждый кадр
    FLAK:    { cooldown: 90, damage: 2, speed: 9, spread: 0.1, color: '#64748b', size: 3 }, // Взрывается
    WAVE:    { cooldown: 25, damage: 1.5, speed: 7, spread: 0, color: '#14b8a6', size: 2 }, // Синусоида
    SNIPER:  { cooldown: 180, damage: 15, speed: 60, spread: 0, color: '#ffffff', size: 2 }  // Ваншот
  },

  COLORS: {
    primary: '#8b5cf6', secondary: '#06b6d4', danger: '#f43f5e',
    repel: '#f59e0b', shipEngines: '#facc15', white: '#ffffff', bg: '#0a0a0a',
    bomb: '#ef4444',
    buff: '#10b981', // Green
    debuff: '#a855f7', // Purple
    shield: '#3b82f6' // Цвет щита
  }
}

enum BHState { STABLE, UNSTABLE, EXPLODING, REFORMING }
type ShipState = 'ROAM' | 'DOGFIGHT' | 'PANIC' | 'RETURN'
type WeaponType = keyof typeof CONFIG.WEAPONS
type ProjectileType = 'NORMAL' | 'MISSILE' | 'PLASMA' | 'FLAK' | 'WAVE' | 'BOMB'
type PowerUpType =
  // Статы
  | 'SPEED_BOOST' | 'DAMAGE_BOOST' | 'RAPID_FIRE' | 'HEAL' | 'SLOW_DOWN' | 'WEAPON_JAM'
  // Размер (НОВОЕ)
  | 'SIZE_UP' | 'SIZE_DOWN'
  // Оружие
  | 'GET_MINIGUN' | 'GET_SHOTGUN' | 'GET_RAILGUN' | 'GET_MISSILE' | 'GET_PLASMA' | 'GET_FLAK' | 'GET_WAVE' | 'GET_SNIPER'
  // Улучшения
  | 'GET_SHIELD' | 'GET_TELEPORT' | 'UPGRADE_BOMB' | 'UPGRADE_RANGE'
type Effect = { type: PowerUpType; timer: number }

// ==========================================
// 2. HELPERS (УТИЛИТЫ)
// ==========================================

class MathUtils {
  static dist(e1: {x: number, y: number}, e2: {x: number, y: number}): number {
    const dx = e1.x - e2.x
    const dy = e1.y - e2.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  static angle(from: {x: number, y: number}, to: {x: number, y: number}): number {
    return Math.atan2(to.y - from.y, to.x - from.x)
  }

  static randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min
  }

  static randomChoice<T>(arr: T[]): T {
    if (arr.length === 0) throw new Error('Array is empty')
    return arr[Math.floor(Math.random() * arr.length)]!
  }

  static normalizeAngle(angle: number): number {
    let a = angle
    while (a < -Math.PI) a += Math.PI * 2
    while (a > Math.PI) a -= Math.PI * 2
    return a
  }

  static randomColor(): string {
    const hue = Math.floor(Math.random() * 360)
    const sat = Math.floor(Math.random() * 30) + 70 // 70-100%
    const light = Math.floor(Math.random() * 40) + 40 // 40-80%
    return `hsl(${hue}, ${sat}%, ${light}%)`
  }
}

// ==========================================
// 3. NAVIGATOR (Логика маршрутов)
// ==========================================

class Navigator {
  static getAvoidanceVector(entity: Entity, obstacles: Entity[], separationDist: number): {x: number, y: number} {
    let pushX = 0
    let pushY = 0
    for (const obs of obstacles) {
      if (obs === entity) continue
      const d = MathUtils.dist(entity, obs)
      if (d < separationDist && d > 0) {
        const force = (1 - d / separationDist)
        pushX -= ((obs.x - entity.x) / d) * force
        pushY -= ((obs.y - entity.y) / d) * force
      }
    }
    return {x: pushX, y: pushY}
  }

  static getPathToTarget(ship: Ship, target: {x: number, y: number}, bh: BlackHole): number {
    const angleToTarget = MathUtils.angle(ship, target)

    // Если паника - просто бежим от дыры
    if (ship.state === 'PANIC') return MathUtils.angle(bh, ship)

    // Проверка на Черную Дыру по курсу
    const distToBH = MathUtils.dist(ship, bh)
    const distToTarget = MathUtils.dist(ship, target)
    const angleToBH = MathUtils.angle(ship, bh)
    const angleDiff = Math.abs(MathUtils.normalizeAngle(angleToTarget - angleToBH))

    // Если дыра ближе чем цель и находится прямо по курсу (~45 град)
    if (bh.state !== BHState.EXPLODING && distToBH < distToTarget && angleDiff < 0.8 && distToBH < 500) {
      // Огибаем
      const avoidDir = MathUtils.normalizeAngle(angleToBH - ship.angle) > 0 ? -1 : 1
      return angleToBH + (Math.PI / 2) * avoidDir
    }

    return angleToTarget
  }
}

// ==========================================
// 3. МОДЕЛИ (ЛОГИКА И ФИЗИКА)
// ==========================================

abstract class Entity {
  x: number
  y: number
  vx: number = 0
  vy: number = 0
  color: string
  markedForDeletion: boolean = false

  constructor(x: number, y: number, color: string) {
    this.x = x
    this.y = y
    this.color = color
  }

  abstract update(sim: Simulation): void

  applyPhysics(warpFactor: number = 1, friction: number = 1) {
    this.x += this.vx * warpFactor
    this.y += this.vy * warpFactor
    this.vx *= friction
    this.vy *= friction
  }
}

class BlackHole extends Entity {
  mass: number = 0
  radius: number = CONFIG.START_RADIUS
  visualRadius: number = CONFIG.START_RADIUS
  pulse: number = 0
  state: BHState = BHState.STABLE
  shake: number = 0
  shockwaveRadius: number = 0
  safetyTimer: number = 0

  constructor(x: number, y: number) { super(x, y, '#000000') }

  update(sim: Simulation) {
    const timeMult = sim.warpFactor
    this.pulse += 0.05 * timeMult

    const growthFactor = this.mass / CONFIG.CRITICAL_MASS
    const targetRadius = CONFIG.START_RADIUS + growthFactor * 80
    this.radius += (targetRadius - this.radius) * 0.05 * timeMult
    this.visualRadius = this.radius + Math.sin(this.pulse) * 2

    if (this.safetyTimer > 0) this.safetyTimer--

    // Уменьшаем тряску ТОЛЬКО если мы НЕ в процессе дестабилизации.
    // Иначе она никогда не наберет силу для взрыва.
    if (this.state !== BHState.UNSTABLE && this.shake > 0) {
        this.shake *= 0.9
    }

    // Логика состояний
    switch (this.state) {
      case BHState.STABLE:
        if (this.mass >= CONFIG.CRITICAL_MASS) this.state = BHState.UNSTABLE
        break
      case BHState.UNSTABLE:
        this.shake += 0.8 * timeMult
        if (this.shake > 120) {
          this.state = BHState.EXPLODING
          this.shockwaveRadius = 1
          sim.spawnSupernovaDebris()
        }
        break
      case BHState.EXPLODING:
        this.shockwaveRadius += 25 * timeMult
        this.shake = 0
        if (this.shockwaveRadius > Math.max(sim.width, sim.height) * 1.5) {
          this.state = BHState.REFORMING
          this.mass = 0
          this.safetyTimer = 200
          sim.initStars()
        }
        break
      case BHState.REFORMING:
        if (this.radius > CONFIG.START_RADIUS + 1) this.radius -= 1 * timeMult
        else this.state = BHState.STABLE
        break
    }
  }
}

class Meteor extends Entity {
  size: number
  trail: {x: number, y: number}[] = []
  isDebris: boolean
  gravityFactor: number
  friction: number
  label?: string

  constructor(x: number, y: number, vx: number, vy: number, isDebris: boolean, label?: string) {
    const isRepelled = !isDebris && Math.random() > 0.85
    const color = isRepelled ? CONFIG.COLORS.repel : (Math.random() > 0.6 ? CONFIG.COLORS.secondary : CONFIG.COLORS.white)
    const debrisColor = MathUtils.randomChoice([CONFIG.COLORS.white, CONFIG.COLORS.primary, CONFIG.COLORS.secondary, CONFIG.COLORS.danger])

    super(x, y, isDebris ? debrisColor : color)
    this.vx = vx; this.vy = vy; this.isDebris = isDebris; this.label = label
    this.size = label ? 4 : MathUtils.randomRange(2, 5)

    // ИЗМЕНЕНИЕ: Увеличили притяжение (было 2.5, стало 4.0)
    this.gravityFactor = isDebris ? -1.5 : (isRepelled ? -2.0 : 4.0)
    this.friction = isDebris ? 0.98 : 1.0
  }

  update(sim: Simulation) {
    const bh = sim.blackHole
    const dist = MathUtils.dist(this, bh)
    const angle = MathUtils.angle(this, bh)

    // 1. Сначала применяем силы (Гравитация/Взрыв)
    if (bh.state === BHState.EXPLODING) {
      // Взрывная волна
      if (dist < bh.shockwaveRadius + 50 && dist > bh.shockwaveRadius - 100) {
        const force = 5.0
        this.vx -= Math.cos(angle) * force
        this.vy -= Math.sin(angle) * force
        if (this.isDebris) {
           this.vx -= Math.cos(angle) * 2; this.vy -= Math.sin(angle) * 2
        }
      }
    } else {
      // Поглощение
      if (bh.safetyTimer === 0 && dist < bh.visualRadius) {
         sim.createExplosion(this.x, this.y, 5, this.color)
         bh.mass += CONFIG.MASS_GAIN_METEOR
         this.markedForDeletion = true
         return
      }

      // Гравитация
      const gravityPower = 0.4 + (bh.mass / CONFIG.CRITICAL_MASS) * 0.6
      const gRadius = CONFIG.GRAVITY_RADIUS_BASE * (0.5 + gravityPower * 0.5)

      if (dist < gRadius) {
         const distFactor = 1 - dist / gRadius
         const pullStrength = this.gravityFactor > 0 ? 2.5 * (distFactor * distFactor) : 0.5 * distFactor
         const finalForce = pullStrength * this.gravityFactor * sim.warpFactor * gravityPower
         const spinForce = (this.gravityFactor > 0 ? 0.05 : 0.1) * sim.warpFactor

         this.vx += Math.cos(angle) * finalForce + Math.cos(angle + Math.PI/2) * spinForce
         this.vy += Math.sin(angle) * finalForce + Math.sin(angle + Math.PI/2) * spinForce

         // ИЗМЕНЕНИЕ: Усиленное торможение, чтобы они падали в дыру, а не пролетали мимо
         // Радиус 350px, сила 0.96
         if (this.gravityFactor > 0 && dist < 350) {
             this.vx *= 0.96; this.vy *= 0.96
         }
      }
    }

    // 2. Применяем базовое трение (если есть)
    this.vx *= this.friction
    this.vy *= this.friction

    // 3. Обновляем позицию ПОСЛЕ изменения скорости (важно!)
    const warpMult = sim.warpFactor > 1.1 ? sim.warpFactor * 0.5 : 1
    this.x += this.vx * warpMult
    this.y += this.vy * warpMult

    // Трейл
    this.trail.push({x: this.x, y: this.y})
    const maxTrail = (this.isDebris ? 8 : 14) * sim.warpFactor
    if (this.trail.length > maxTrail) this.trail.shift()

    // Удаление за границами
    if (this.x < -500 || this.x > sim.width + 500 || this.y < -500 || this.y > sim.height + 500) {
      this.markedForDeletion = true
    }
  }
}

class PowerUp extends Entity {
  type: PowerUpType
  isGood: boolean
  life: number = 1200 // Бонус исчезнет сам через 20 сек, если не подобрать
  pulse: number = 0

  constructor(x: number, y: number) {
    // Рандомный выбор типа
    const rand = Math.random()
    let type: PowerUpType
    let isGood = true

    // Баффы
    if (rand < 0.08) { type = 'SPEED_BOOST'; isGood = true }
    else if (rand < 0.15) { type = 'DAMAGE_BOOST'; isGood = true }
    else if (rand < 0.20) { type = 'SIZE_UP'; isGood = true } // Гигантизм (больше HP)
    else if (rand < 0.25) { type = 'SIZE_DOWN'; isGood = true } // Лилипут (сложнее попасть)
    else if (rand < 0.30) { type = 'GET_SHIELD'; isGood = true }
    else if (rand < 0.35) { type = 'GET_TELEPORT'; isGood = true }
    else if (rand < 0.40) { type = 'UPGRADE_RANGE'; isGood = true }
    else if (rand < 0.45) { type = 'UPGRADE_BOMB'; isGood = true }
    else if (rand < 0.52) { type = 'HEAL'; isGood = true }

    // Оружие (около 30% шанс)
    else if (rand < 0.57) { type = 'GET_MINIGUN'; isGood = true }
    else if (rand < 0.62) { type = 'GET_SHOTGUN'; isGood = true }
    else if (rand < 0.66) { type = 'GET_RAILGUN'; isGood = true }
    else if (rand < 0.70) { type = 'GET_MISSILE'; isGood = true }
    else if (rand < 0.74) { type = 'GET_PLASMA'; isGood = true }
    else if (rand < 0.78) { type = 'GET_FLAK'; isGood = true }
    else if (rand < 0.81) { type = 'GET_WAVE'; isGood = true }
    else if (rand < 0.84) { type = 'GET_SNIPER'; isGood = true }

    // Дебаффы
    else if (rand < 0.92) { type = 'SLOW_DOWN'; isGood = false }
    else { type = 'WEAPON_JAM'; isGood = false }

    super(x, y, isGood ? CONFIG.COLORS.buff : CONFIG.COLORS.debuff)
    this.type = type
    this.isGood = isGood

    // Начальный импульс (чтобы он красиво "вылетал" при появлении)
    this.vx = MathUtils.randomRange(-2, 2)
    this.vy = MathUtils.randomRange(-2, 2)
  }

  update(sim: Simulation) {
    // 1. УБРАНО: Притяжение к черной дыре
    // Бонусы больше не реагируют на гравитацию

    // 2. Движение с торможением
    // Они двигаются по инерции от спавна, но быстро останавливаются
    this.x += this.vx * sim.warpFactor
    this.y += this.vy * sim.warpFactor

    // Сильное трение (0.92), чтобы они "зависли" на месте
    this.vx *= 0.92
    this.vy *= 0.92

    // 3. Визуал
    this.pulse += 0.1
    this.life--

    // 4. УБРАНО: Проверка dist < bh.visualRadius
    // Бонусы не уничтожаются черной дырой

    // Удаляем только по таймеру жизни
    if (this.life <= 0) this.markedForDeletion = true
  }
}

// ==========================================
// 5. WEAPON SYSTEM (НОВОЕ)
// ==========================================

abstract class Weapon {
  cooldownTimer: number = 0
  abstract get config(): typeof CONFIG.WEAPONS[keyof typeof CONFIG.WEAPONS] // Типизация конфига

  update() {
    if (this.cooldownTimer > 0) this.cooldownTimer--
  }

  get isReady(): boolean {
    return this.cooldownTimer <= 0
  }

  // Метод выстрела. Возвращает true, если выстрел произошел
  fire(sim: Simulation, owner: Ship, angle: number, damageMult: number, reloadMult: number): boolean {
    if (!this.isReady) return false

    this.spawnProjectiles(sim, owner, angle, damageMult)

    // Установка кулдауна с учетом баффа скорострельности
    this.cooldownTimer = this.config.cooldown / reloadMult
    return true
  }

  // Абстрактный метод, который реализует каждый ствол
  protected abstract spawnProjectiles(sim: Simulation, owner: Ship, angle: number, damageMult: number): void
}

// --- Бластер (Базовый) ---
class Blaster extends Weapon {
  get config() { return CONFIG.WEAPONS.BLASTER }

  protected spawnProjectiles(sim: Simulation, owner: Ship, angle: number, damageMult: number) {
    const spread = (Math.random() - 0.5) * this.config.spread
    const vx = owner.vx + Math.cos(angle + spread) * this.config.speed
    const vy = owner.vy + Math.sin(angle + spread) * this.config.speed

    sim.projectiles.push(new LinearProjectile(
      owner.x, owner.y, vx, vy,
      owner.color, // Бластер берет цвет корабля
      this.config.damage * damageMult,
      this.config.size,
      60 // Life
    ))
  }
}

// --- Миниган ---
class Minigun extends Weapon {
  get config() { return CONFIG.WEAPONS.MINIGUN }

  protected spawnProjectiles(sim: Simulation, owner: Ship, angle: number, damageMult: number) {
    const spread = (Math.random() - 0.5) * this.config.spread
    const vx = owner.vx + Math.cos(angle + spread) * this.config.speed
    const vy = owner.vy + Math.sin(angle + spread) * this.config.speed

    sim.projectiles.push(new LinearProjectile(
      owner.x, owner.y, vx, vy,
      this.config.color!,
      this.config.damage * damageMult,
      this.config.size,
      50
    ))
  }
}

// --- Дробовик ---
class Shotgun extends Weapon {
  get config() { return CONFIG.WEAPONS.SHOTGUN }

  protected spawnProjectiles(sim: Simulation, owner: Ship, angle: number, damageMult: number) {
    const count = this.config.count || 5
    for (let i = 0; i < count; i++) {
      const spread = (Math.random() - 0.5) * this.config.spread
      const vx = owner.vx + Math.cos(angle + spread) * this.config.speed
      const vy = owner.vy + Math.sin(angle + spread) * this.config.speed

      sim.projectiles.push(new LinearProjectile(
        owner.x, owner.y, vx, vy,
        this.config.color!,
        this.config.damage * damageMult,
        this.config.size,
        40 // Дробовик недалеко стреляет
      ))
    }
  }
}

// --- Ракетница ---
class MissileLauncher extends Weapon {
  get config() { return CONFIG.WEAPONS.MISSILE }

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
}

// --- Рельсотрон ---
class Railgun extends Weapon {
  get config() { return CONFIG.WEAPONS.RAILGUN }

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
}

// --- Плазма ---
class PlasmaGun extends Weapon {
  get config() { return CONFIG.WEAPONS.PLASMA }

  protected spawnProjectiles(sim: Simulation, owner: Ship, angle: number, damageMult: number) {
    const vx = owner.vx + Math.cos(angle) * this.config.speed
    const vy = owner.vy + Math.sin(angle) * this.config.speed

    sim.projectiles.push(new PatternProjectile(
      owner.x, owner.y, vx, vy,
      this.config.color!,
      this.config.damage * damageMult,
      this.config.size,
      'PLASMA'
    ))
  }
}

// --- Зенитка (Flak) ---
class FlakCannon extends Weapon {
  get config() { return CONFIG.WEAPONS.FLAK }

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
}

// --- Волновая пушка ---
class WaveGun extends Weapon {
  get config() { return CONFIG.WEAPONS.WAVE }

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
}

// --- Снайперка ---
class SniperRifle extends Weapon {
  get config() { return CONFIG.WEAPONS.SNIPER }

  protected spawnProjectiles(sim: Simulation, owner: Ship, angle: number, damageMult: number) {
    const vx = owner.vx + Math.cos(angle) * this.config.speed
    const vy = owner.vy + Math.sin(angle) * this.config.speed

    sim.projectiles.push(new LinearProjectile(
      owner.x, owner.y, vx, vy,
      this.config.color!,
      this.config.damage * damageMult,
      this.config.size,
      30
    ))
  }
}

// ==========================================
// 6. ДРУГИЕ МОДЕЛИ
// ==========================================

class Ship extends Entity {
  angle: number
  cooldown: number = 0
  bombCooldown: number = 0
  thrustPower: number = 0
  hp: number = 5
  maxHp: number = 5
  state: ShipState = 'ROAM'

  // Текущая цель навигации
  navTarget: {x: number, y: number} | null = null
  // Тип цели для отрисовки интерфейса
  targetType: 'SERPENT' | 'SHIP' | 'POINT' | 'POWERUP' | null = null

  wanderTarget: {x: number, y: number} | null = null
  combatTimer: number = 0
  combatManeuver: 'CHARGE' | 'FLANK' | 'RETREAT' = 'FLANK'

  // Добавляем хранилище эффектов
  activeEffects: Effect[] = []

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

  constructor(x: number, y: number, angle: number) {
    super(x, y, MathUtils.randomColor()) // Unique color
    this.angle = angle
    this.weapon = new Blaster() // Оружие по умолчанию

    // 1. HULL UPGRADE
    this.maxHp = 5 + (economy.hullLevel - 1) * 3
    this.hp = this.maxHp

    // 2. SHIELD UPGRADE (Новое)
    // База 0. Каждый уровень дает +5 щита.
    this.maxShield = economy.shieldLevel * 5
    this.shield = this.maxShield // Спавнимся с полным щитом

    this.cooldown = MathUtils.randomRange(0, 100)
    this.bombCooldown = MathUtils.randomRange(0, 500)
  }

  // Метод применения бонуса
  applyPowerUp(p: PowerUp) {
    // Мгновенные эффекты
    if (p.type === 'HEAL') { this.hp = Math.min(this.hp + 2, this.maxHp); return }
    if (p.type === 'GET_SHIELD') { this.shield = this.maxShield; return } // Восстановить щит
    if (p.type === 'GET_TELEPORT') { this.hasTeleport = true; return }
    if (p.type === 'UPGRADE_BOMB') { this.bombLevel = 2; return }
    if (p.type === 'UPGRADE_RANGE') { this.rangeMult = 1.5; return }

    // ПОДБОР ОРУЖИЯ
    let newWeapon: Weapon | null = null

    switch(p.type) {
        case 'GET_MINIGUN': newWeapon = new Minigun(); break
        case 'GET_SHOTGUN': newWeapon = new Shotgun(); break
        case 'GET_RAILGUN': newWeapon = new Railgun(); break
        case 'GET_MISSILE': newWeapon = new MissileLauncher(); break
        case 'GET_PLASMA':  newWeapon = new PlasmaGun(); break
        case 'GET_FLAK':    newWeapon = new FlakCannon(); break
        case 'GET_WAVE':    newWeapon = new WaveGun(); break
        case 'GET_SNIPER':  newWeapon = new SniperRifle(); break
    }

    if (newWeapon) {
        this.weapon = newWeapon
        this.weaponTimer = 600 // 10 секунд
        return
    }

    // НОВЫЕ ЭФФЕКТЫ РАЗМЕРА
    // Сбрасываем таймер если уже есть, или добавляем
    if (p.type === 'SIZE_UP' || p.type === 'SIZE_DOWN') {
        const existing = this.activeEffects.find(e => e.type === p.type)
        if (existing) existing.timer = 600
        else this.activeEffects.push({ type: p.type, timer: 600 })
        return
    }

    // Временные эффекты
    const existing = this.activeEffects.find(e => e.type === p.type)
    if (existing) {
        existing.timer = CONFIG.POWERUP_DURATION
    } else {
        this.activeEffects.push({ type: p.type, timer: CONFIG.POWERUP_DURATION })
    }
  }


  // --- ГЛАВНЫЙ МЕТОД ПОИСКА ЦЕЛИ ---
  private findBestTarget(sim: Simulation): { target: {x: number, y: number, vx?: number, vy?: number} | null, type: 'SERPENT' | 'SHIP' | 'POINT' | 'POWERUP' | null } {
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
    if (closestBuff) return { target: closestBuff, type: 'POWERUP' }

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
         return { target: head, type: 'SERPENT' }
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
      return { target: closestShip, type: 'SHIP' }
    }

    // 3. Приоритет: ПАТРУЛЬ (Waypoints)
    if (!this.wanderTarget || MathUtils.dist(this, this.wanderTarget) < 100) {
      const margin = 100
      this.wanderTarget = {
        x: MathUtils.randomRange(margin, sim.width - margin),
        y: MathUtils.randomRange(margin, sim.height - margin)
      }
    }
    return { target: this.wanderTarget, type: 'POINT' }
  }

  update(sim: Simulation) {
    // --- 0. ОБРАБОТКА ЭФФЕКТОВ ---
    // Сбрасываем множители к дефолту
    let speedMult = 1.0
    // Применяем глобальные улучшения урона и скорости
    let damageMult = 1.0 + (economy.damageLevel - 1) * 0.2
    let reloadMult = 1.0 + (economy.turretSpeed - 1) * 0.15
    let isJammed = false

    // Перебираем активные эффекты
    this.sizeMult = 1.0 // Сброс перед пересчетом
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
        const eff = this.activeEffects[i]
        if (!eff) {
          this.activeEffects.splice(i, 1)
          continue
        }
        eff.timer--

        switch (eff.type) {
            case 'SPEED_BOOST': speedMult = 1.8; break
            case 'SLOW_DOWN': speedMult = 0.5; break
            case 'DAMAGE_BOOST': damageMult = 3.0; break
            case 'RAPID_FIRE': reloadMult = 4.0; break
            case 'WEAPON_JAM': isJammed = true; break
            // РАЗМЕР
            case 'SIZE_UP': this.sizeMult = CONFIG.SIZE_MODIFIER_BIG; break
            case 'SIZE_DOWN': this.sizeMult = CONFIG.SIZE_MODIFIER_SMALL; break
        }

        if (eff.timer <= 0) this.activeEffects.splice(i, 1)
    }

    // Если мы маленькие - мы быстрее!
    if (this.sizeMult < 1.0) speedMult *= 1.3
    // Если большие - медленнее, но больше HP (визуально)
    if (this.sizeMult > 1.0) speedMult *= 0.8

    // Обновляем таймер оружия самого корабля (возврат к бластеру)
    if (this.weaponTimer > 0) {
        this.weaponTimer--
        if (this.weaponTimer <= 0) this.weapon = new Blaster()
    }

    // ОБНОВЛЯЕМ САМО ОРУЖИЕ (для кулдауна)
    this.weapon.update()

    // ЛОГИКА ТЕЛЕПОРТА (В бою)
    if (this.hasTeleport && this.state === 'DOGFIGHT' && this.navTarget) {
        // Прыгаем, если враг далеко
        const dist = MathUtils.dist(this, this.navTarget)
        if (dist > 400) {
            // Телепорт за спину врагу
            const angle = MathUtils.angle(this, this.navTarget)
            this.x = this.navTarget.x - Math.cos(angle) * 100
            this.y = this.navTarget.y - Math.sin(angle) * 100

            // Эффект телепортации
            sim.createExplosion(this.x, this.y, 20, CONFIG.COLORS.shield)
            this.hasTeleport = false // Потрачено
        }
    }

    const bh = sim.blackHole
    const distToBH = MathUtils.dist(this, bh)
    const angleToBH = MathUtils.angle(this, bh)

    // 1. СМЕРТЬ
    if (bh.state === BHState.EXPLODING && distToBH < bh.shockwaveRadius + 50) { this.die(sim); return }
    if (bh.state !== BHState.EXPLODING && distToBH < bh.visualRadius) {
      bh.mass += CONFIG.MASS_GAIN_SHIP; this.die(sim); return
    }

    // 2. ГРАВИТАЦИЯ
    const gravityPower = 0.1 + (bh.mass / CONFIG.CRITICAL_MASS) * 0.9
    const gRadius = CONFIG.GRAVITY_RADIUS_BASE * (0.5 + gravityPower * 0.5)
    if (bh.state !== BHState.EXPLODING && distToBH < gRadius) {
      const pull = 0.3 * gravityPower * (1 - distToBH / gRadius)
      this.vx += Math.cos(angleToBH) * pull
      this.vy += Math.sin(angleToBH) * pull
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
      this.state = 'PANIC'
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
        this.state = 'ROAM' // Мы пока просто летим
      } else {
        // Путь чист, выполняем боевую задачу или полет
        if (type === 'SERPENT' || type === 'SHIP') {
           this.state = 'DOGFIGHT'
           const distToTarget = MathUtils.dist(this, target)
           this.handleCombat(sim, target, distToTarget, type === 'SERPENT', damageMult, reloadMult, isJammed)
           desiredAngle = this.combatManeuverAngle(target, distToTarget)

           // Ускоряемся если цель далеко
           engineThrust = distToTarget > 400 ? 0.7 : 0.5
        } else {
           this.state = 'ROAM'
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
    if (economy.regenLevel > 0 && this.hp < this.maxHp) {
        this.regenTimer++
        // Скорость регена: чем выше уровень, тем чаще.
        // Ур 1: раз в 300 кадров (5 сек). Ур 5: раз в 60 кадров (1 сек).
        const regenRate = Math.max(60, 360 - (economy.regenLevel * 60))

        if (this.regenTimer > regenRate) {
            this.hp++
            this.regenTimer = 0
            // Эффект починки (маленькие зеленые плюсики/частицы)
            sim.createExplosion(this.x, this.y, 2, '#10b981')
        }
    }

    // Не забываем обновлять макс щит, если купили улучшение во время жизни корабля
    const currentMaxShield = economy.shieldLevel * 5
    if (this.maxShield < currentMaxShield) {
        this.shield += (currentMaxShield - this.maxShield) // Добавляем разницу
        this.maxShield = currentMaxShield
    }

    // 6. ДВИЖЕНИЕ
    this.cooldown--; this.bombCooldown--

    let diff = MathUtils.normalizeAngle(desiredAngle - this.angle)
    const turnSpeed = this.state === 'DOGFIGHT' ? CONFIG.SHIP_TURN_SPEED * 2.0 : CONFIG.SHIP_TURN_SPEED
    this.angle += Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed)

    this.vx += Math.cos(this.angle) * engineThrust
    this.vy += Math.sin(this.angle) * engineThrust
    this.vx *= 0.96; this.vy *= 0.96

    const speed = Math.hypot(this.vx, this.vy)
    const maxSpeed = (this.state === 'PANIC' ? CONFIG.SHIP_SPEED * 2 : CONFIG.SHIP_SPEED) * speedMult
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
          this.combatManeuver = r < 0.4 ? 'CHARGE' : (r < 0.8 ? 'FLANK' : 'RETREAT')
      }

      if (this.combatManeuver === 'CHARGE') return angleToEnemy
      if (this.combatManeuver === 'RETREAT') return angleToEnemy + Math.PI
      // FLANK: Летим перпендикулярно (окружаем)
      return angleToEnemy + Math.PI / 2
  }

  private handleCombat(sim: Simulation, target: any, dist: number, isSerpent: boolean, damageMult: number, reloadMult: number, isJammed: boolean) {
      // Рассчитываем упреждение
      // Если у цели есть скорость (корабль), используем её. Если нет (сегмент змеи), считаем 0
      const tvx = target.vx || 0
      const tvy = target.vy || 0

      const leadX = target.x + tvx * 15
      const leadY = target.y + tvy * 15
      const leadAngle = MathUtils.angle(this, {x: leadX, y: leadY})

      const aimDiff = Math.abs(MathUtils.normalizeAngle(leadAngle - this.angle))

      // Стрельба
      if (this.weapon.isReady && !isJammed) {
          // Угол стрельбы зависит от типа оружия (у минигана шире)
          const allowedAngle = (this.weapon instanceof Minigun) ? 0.8 : 0.5

          // Некоторые оружия стреляют дальше (Снайперка, Ракеты)
          let range = CONFIG.SHIP_ENGAGEMENT_DIST + 100
          if (this.weapon instanceof SniperRifle || this.weapon instanceof MissileLauncher) range = 1000

          if (dist < range && aimDiff < allowedAngle) {
              // 4. CRIT UPGRADE
              // 5% шанс за уровень
              let finalDamageMult = damageMult
              const critChance = economy.critLevel * 0.05
              const isCrit = Math.random() < critChance

              if (isCrit) {
                  finalDamageMult *= 2.0 // Крит x2
              }

              this.weapon.fire(sim, this, leadAngle, finalDamageMult, reloadMult)
          }
      }

      // Кидаем бомбу в дыру (попутно), если смотрим на неё
      const bh = sim.blackHole
      const angleToBH = MathUtils.angle(this, bh)
      const bhDiff = Math.abs(MathUtils.normalizeAngle(angleToBH - this.angle))
      const distBH = MathUtils.dist(this, bh)

      if (this.bombCooldown <= 0 && bhDiff < 0.5 && distBH < 500 && bh.state !== BHState.EXPLODING) {
           sim.spawnBomb(this.x, this.y, this.vx, this.vy, this.angle, this.bombLevel)
           this.bombCooldown = 400
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

// ==========================================
// 5. PROJECTILES (НАСЛЕДОВАНИЕ)
// ==========================================

abstract class Projectile extends Entity {
  damage: number
  size: number
  life: number
  maxLife: number

  constructor(x: number, y: number, vx: number, vy: number, color: string, damage: number, size: number, life: number) {
    super(x, y, color)
    this.vx = vx; this.vy = vy; this.damage = damage; this.size = size; this.life = life; this.maxLife = life
  }

  // Базовая логика коллизий
  checkCollisions(sim: Simulation) {
    // Корабли
    for (const s of sim.ships) {
       if (s.color === this.color) continue // Friendly fire off
       // Учитываем размер снаряда и размер корабля
       if (MathUtils.dist(this, s) < (12 * s.sizeMult + this.size)) {
          this.onHitShip(sim, s)
          return
       }
    }
    // Змеи
    for (const s of sim.serpents) {
        if (s.segments.length > 0) {
            const head = s.segments[0]
            if (head && MathUtils.dist(this, head) < (20 * s.sizeMult + this.size)) {
                this.onHitSerpent(sim, s)
                return
            }
        }
    }
  }

  onHitShip(sim: Simulation, ship: Ship) {
      ship.takeDamage(sim, this.damage)
      this.createHitEffect(sim)
      this.markedForDeletion = true
  }

  onHitSerpent(sim: Simulation, serpent: VoidSerpent) {
      serpent.takeDamage(sim, this.damage)
      this.createHitEffect(sim)
      this.markedForDeletion = true
  }

  createHitEffect(sim: Simulation) {
      sim.createExplosion(this.x, this.y, 5, this.color)
  }

  abstract drawSpecific(ctx: CanvasRenderingContext2D): void

  // Общий апдейт
  update(sim: Simulation) {
    this.life--
    if (this.life <= 0) {
       this.markedForDeletion = true
       return
    }
    this.applyPhysics(sim.warpFactor)
    this.checkCollisions(sim)
  }
}

// --- Лазер / Пуля / Рельсотрон ---
class LinearProjectile extends Projectile {
  drawSpecific(ctx: CanvasRenderingContext2D) {
    const angle = Math.atan2(this.vy, this.vx)
    ctx.rotate(angle)

    const len = this.size > 3 ? 30 : 10
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(-len, 0)
    ctx.strokeStyle = this.color
    ctx.lineWidth = this.size
    ctx.stroke()
  }
}

// --- Самонаводящаяся Ракета ---
class HomingMissile extends Projectile {
  target?: Entity | null
  trail: {x: number, y: number}[] = []
  fuel: number = 100

  constructor(x: number, y: number, vx: number, vy: number, color: string, damage: number) {
     super(x, y, vx, vy, color, damage, 4, 200)
  }

  override update(sim: Simulation) {
     // Поиск цели
     if (!this.target || (this.target as any).markedForDeletion) {
        let closest = Infinity
        for (const s of sim.ships) {
            if (s.color === this.color) continue
            const d = MathUtils.dist(this, s)
            if (d < closest && d < 800) { closest = d; this.target = s }
        }
        if (!this.target) { // Если нет кораблей, ищем змей
            for (const s of sim.serpents) {
                const d = MathUtils.dist(this, s)
                if (d < closest && d < 800) { closest = d; this.target = s }
            }
        }
     }

     // Наведение
     if (this.target && this.fuel > 0) {
         const tx = (this.target instanceof VoidSerpent && this.target.segments.length > 0 && this.target.segments[0]) ? this.target.segments[0].x : this.target.x
         const ty = (this.target instanceof VoidSerpent && this.target.segments.length > 0 && this.target.segments[0]) ? this.target.segments[0].y : this.target.y

         const angleToTarget = Math.atan2(ty - this.y, tx - this.x)
         const currentAngle = Math.atan2(this.vy, this.vx)
         let diff = MathUtils.normalizeAngle(angleToTarget - currentAngle)

         const turnSpeed = 0.08 * sim.warpFactor
         const newAngle = currentAngle + Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed)

         const speed = Math.hypot(this.vx, this.vy)
         this.vx = Math.cos(newAngle) * speed * 1.02 // Ракета ускоряется
         this.vy = Math.sin(newAngle) * speed * 1.02

         // Cap speed
         const maxSpeed = 12
         const curSpeed = Math.hypot(this.vx, this.vy)
         if (curSpeed > maxSpeed) {
             this.vx = (this.vx/curSpeed)*maxSpeed
             this.vy = (this.vy/curSpeed)*maxSpeed
         }

         this.fuel--

         // Дым
         if (Math.random() < 0.4) {
             sim.particles.push(new Particle(this.x, this.y, '#555', MathUtils.randomRange(1, 3), 0, 0))
         }
     }

     // Trail
     this.trail.push({x: this.x, y: this.y})
     if (this.trail.length > 15) this.trail.shift()

     super.update(sim)
  }

  override createHitEffect(sim: Simulation) {
      sim.createExplosion(this.x, this.y, 20, '#fbbf24') // Взрыв
      sim.spawnShockwave(this.x, this.y)
      this.markedForDeletion = true
  }

  drawSpecific(ctx: CanvasRenderingContext2D) {
     // Рисуем хвост отдельно в мировых координатах
     ctx.rotate(-Math.atan2(this.vy, this.vx)) // Hacky undo rotation for trail

     if (this.trail.length > 1 && this.trail[0]) {
         ctx.beginPath()
         ctx.moveTo(this.trail[0].x - this.x, this.trail[0].y - this.y) // Local coords
         for (const t of this.trail) {
             if (t) ctx.lineTo(t.x - this.x, t.y - this.y)
         }
         ctx.strokeStyle = '#9ca3af'
         ctx.lineWidth = 1
         ctx.stroke()
     }

     // Restore rotation for body
     ctx.rotate(Math.atan2(this.vy, this.vx))

     // Rocket Body
     ctx.fillStyle = this.color
     ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, 4); ctx.lineTo(-4, -4); ctx.fill()

     // Flame
     ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-8, 0); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.stroke()
  }
}

// --- Бомба ---
class BombProjectile extends Projectile {
  constructor(x: number, y: number, vx: number, vy: number, damage: number) {
      super(x, y, vx, vy, CONFIG.COLORS.bomb, damage, 4, 300)
  }

  override update(sim: Simulation) {
      const bh = sim.blackHole
      const dist = MathUtils.dist(this, bh)

      if (bh.state !== BHState.EXPLODING) {
          const gForce = 0.8 * (1 - Math.min(1, dist / CONFIG.GRAVITY_RADIUS_BASE))
          const angle = MathUtils.angle(this, bh)
          this.vx += Math.cos(angle) * gForce
          this.vy += Math.sin(angle) * gForce
      }

      this.x += this.vx * sim.warpFactor
      this.y += this.vy * sim.warpFactor
      this.life--

      // Hit Black Hole
      if (dist < bh.visualRadius && bh.state !== BHState.EXPLODING) {
          sim.createExplosion(this.x, this.y, 30, this.color)
          bh.mass = Math.max(0, bh.mass - this.damage)
          bh.shake = 10
          sim.spawnShockwave(this.x, this.y)
          this.markedForDeletion = true
          return
      }

      // Hit Serpent (Instakill logic)
      for (const s of sim.serpents) {
          for (const seg of s.segments) {
              if (MathUtils.dist(this, seg) < 30) {
                  s.takeDamage(sim, 100)
                  sim.createExplosion(this.x, this.y, 40, this.color)
                  sim.spawnShockwave(this.x, this.y)
                  this.markedForDeletion = true
                  return
              }
          }
      }

      if (this.life <= 0) this.markedForDeletion = true
  }

  drawSpecific(ctx: CanvasRenderingContext2D) {
     ctx.beginPath()
     ctx.arc(0, 0, 4, 0, Math.PI * 2)
     ctx.fillStyle = this.color
     ctx.shadowBlur = 10; ctx.shadowColor = this.color
     ctx.fill(); ctx.shadowBlur = 0
  }
}

// --- Волна / Плазма / Зенитка ---
class PatternProjectile extends Projectile {
    pattern: 'WAVE' | 'PLASMA' | 'FLAK'
    initialV: {x: number, y: number}
    spawnTime: number

    constructor(x: number, y: number, vx: number, vy: number, color: string, damage: number, size: number, pattern: 'WAVE' | 'PLASMA' | 'FLAK') {
        super(x, y, vx, vy, color, damage, size, 60)
        this.pattern = pattern
        this.initialV = {x: vx, y: vy}
        this.spawnTime = Date.now()
        if (pattern === 'PLASMA') this.life = 100
    }

    override update(sim: Simulation) {
        if (this.pattern === 'WAVE') {
             const age = (Date.now() - this.spawnTime) * 0.015
             const perpX = -this.initialV.y; const perpY = this.initialV.x
             const len = Math.sqrt(perpX*perpX + perpY*perpY) || 1
             const offset = Math.sin(age) * 4
             this.x += (perpX/len) * offset * 0.2
             this.y += (perpY/len) * offset * 0.2
        } else if (this.pattern === 'FLAK' && this.life < 10) {
             for(let i=0; i<6; i++) {
                 const a = Math.random()*Math.PI*2
                 const s = 6
                 sim.projectiles.push(new LinearProjectile(this.x, this.y, Math.cos(a)*s, Math.sin(a)*s, this.color, 1, 1.5, 20))
             }
             this.markedForDeletion = true
             return
        }

        super.update(sim)
    }

    // Plasma Piercing override
    override onHitShip(sim: Simulation, ship: Ship) {
        ship.takeDamage(sim, this.damage)
        if (this.pattern !== 'PLASMA') this.markedForDeletion = true
        else sim.createExplosion(this.x, this.y, 2, this.color)
    }

    override onHitSerpent(sim: Simulation, s: VoidSerpent) {
        s.takeDamage(sim, this.damage)
        if (this.pattern !== 'PLASMA') this.markedForDeletion = true
    }

    drawSpecific(ctx: CanvasRenderingContext2D) {
        if (this.pattern === 'PLASMA') {
            const p = Math.sin(Date.now() * 0.02) * 2
            ctx.shadowBlur = 10; ctx.shadowColor = this.color
            ctx.beginPath(); ctx.arc(0, 0, this.size + p, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0
        } else {
            ctx.beginPath(); ctx.arc(0, 0, this.size, 0, Math.PI*2); ctx.fill()
        }
    }
}

class Shockwave extends Entity {
  radius: number = 1
  maxRadius: number = 250 // Радиус поражения
  life: number = 1.0

  constructor(x: number, y: number) {
    super(x, y, '#ffffff') // Цвет волны
  }

  update(sim: Simulation) {
    // Волна расширяется быстро
    this.radius += 8 * sim.warpFactor
    this.life -= 0.03

    if (this.life <= 0) {
      this.markedForDeletion = true
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(255, 200, 200, ${this.life})`
    ctx.lineWidth = 20 * this.life // Толщина уменьшается
    ctx.stroke()
    ctx.restore()
  }
}

class Particle extends Entity {
  life: number = 1.0
  size: number
  constructor(x: number, y: number, color: string, size: number, vx: number, vy: number) {
    super(x, y, color)
    this.size = size; this.vx = vx; this.vy = vy
  }
  update() {
    this.x += this.vx; this.y += this.vy; this.life -= 0.02
    if (this.life <= 0) this.markedForDeletion = true
  }
}

class Star extends Entity {
  constructor(x: number, y: number) {
    super(x, y, 'rgba(139, 92, 246, 0.6)')
    this.vx = MathUtils.randomRange(-0.5, 0.5)
    this.vy = MathUtils.randomRange(-0.5, 0.5)
  }
  update(sim: Simulation) {
    if (sim.warpFactor > 1.1) {
       const dx = this.x - sim.width / 2
       const dy = this.y - sim.height / 2
       const dist = Math.sqrt(dx*dx + dy*dy) || 1
       this.x += (dx/dist) * 2 * sim.warpFactor
       this.y += (dy/dist) * 2 * sim.warpFactor
    } else if (sim.blackHole.state === BHState.EXPLODING) {
       const bh = sim.blackHole
       const dist = MathUtils.dist(this, bh)
       if (dist < bh.shockwaveRadius + 100 && dist > bh.shockwaveRadius - 50) {
          const angle = MathUtils.angle(bh, this)
          this.vx += Math.cos(angle) * 5
          this.vy += Math.sin(angle) * 5
       }
    }
    this.applyPhysics(1, 0.95)

    if (this.x < 0 || this.x > sim.width || this.y < 0 || this.y > sim.height) {
      if (sim.warpFactor > 1.1) {
         this.x = sim.width/2 + MathUtils.randomRange(-50, 50)
         this.y = sim.height/2 + MathUtils.randomRange(-50, 50)
      } else {
         this.vx *= -1; this.vy *= -1
      }
    }
  }
}

class VoidSerpent extends Entity {
  life: number = 1.0
  angle: number
  speed: number
  segments: {x: number, y: number}[] = []
  wobbleOffset: number = Math.random() * 100
  hp: number = 30
  maxHp: number = 30

  // Новые свойства для ИИ и бонусов
  activeEffects: Effect[] = []
  sizeMult: number = 1.0
  navTarget: {x: number, y: number} | null = null // Для отрисовки линии
  targetType: 'SHIP' | 'POWERUP' | null = null
  damageMult: number = 1.0

  constructor(x: number, y: number) {
    const hue = MathUtils.randomRange(250, 300)
    super(x, y, `hsla(${hue}, 100%, 70%, 1)`)
    this.angle = Math.random() * Math.PI * 2
    this.speed = MathUtils.randomRange(1.5, 2.5)
    this.segments.push({x, y})
  }

  // Применение бонусов (как у корабля)
  applyPowerUp(p: PowerUp) {
    if (p.type === 'HEAL') { this.hp = Math.min(this.hp + 10, this.maxHp); return }

    // Змеи не используют пушки, но получают статы
    // Оружие превращаем в лечение или урон
    if (p.type.startsWith('GET_') && p.type !== 'GET_SHIELD' && p.type !== 'GET_TELEPORT') {
         this.activeEffects.push({ type: 'DAMAGE_BOOST', timer: 600 })
         return
    }
    const existing = this.activeEffects.find(e => e.type === p.type)
    if (existing) existing.timer = 600
    else this.activeEffects.push({ type: p.type, timer: 600 })
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
      let type: 'SHIP' | 'POWERUP' | null = null
      // 1. Ищем Бонусы (Змеи тоже любят баффы)
      for (const p of sim.powerUps) {
          if (!p.isGood) continue
          const d = MathUtils.dist(this, p)
          if (d < closestDist && d < 400) { // Чует бонусы недалеко
              closestDist = d
              target = p
              type = 'POWERUP'
          }
      }
      // 2. Ищем Корабли (Еда) - приоритет выше, если близко
      for (const s of sim.ships) {
          const d = MathUtils.dist(this, s)
          // Если корабль ближе текущего бонуса или бонуса нет - атакуем корабль
          if (d < closestDist && d < 800) {
              closestDist = d
              target = s
              type = 'SHIP'
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
    if (bh.state === BHState.EXPLODING) {
        // Если волна (shockwaveRadius) дошла до змея
        if (distFromCenter < bh.shockwaveRadius + 50) {
            // Мгновенная смерть (наносим урона больше, чем макс. HP)
            this.takeDamage(sim, 9999)
            return
        }
    }
    // ------------------------------------------

    // --- ОБРАБОТКА ЭФФЕКТОВ ---
    let speedMult = 1.0
    this.sizeMult = 1.0
    this.damageMult = 1.0
    for (let i = this.activeEffects.length - 1; i >= 0; i--) {
        const eff = this.activeEffects[i]
        if (!eff) {
          this.activeEffects.splice(i, 1)
          continue
        }
        eff.timer--
        switch (eff.type) {
            case 'SPEED_BOOST': speedMult = 1.5; break
            case 'SLOW_DOWN': speedMult = 0.5; break
            case 'DAMAGE_BOOST': this.damageMult = 2.0; break
            case 'SIZE_UP': this.sizeMult = CONFIG.SIZE_MODIFIER_BIG; break
            case 'SIZE_DOWN': this.sizeMult = CONFIG.SIZE_MODIFIER_SMALL; break
        }
        if (eff.timer <= 0) this.activeEffects.splice(i, 1)
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
        this.speed = 3.0 * speedMult

        // АТАКА (Укус)
        if (this.targetType === 'SHIP' && MathUtils.dist(this, target) < 30 * this.sizeMult) {
             // Кусаем корабль!
             (target as Ship).takeDamage(sim, 2 * this.damageMult)
             // Отталкиваемся
             this.angle += Math.PI
        }
        // ПОДБОР БОНУСА
        if (this.targetType === 'POWERUP' && MathUtils.dist(this, target) < 30 * this.sizeMult) {
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
        this.speed = 2.0 * speedMult
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

// ==========================================
// 3.5. FLOATING TEXT (Всплывающий текст)
// ==========================================

class FloatingText extends Entity {
  text: string
  life: number = 1.0
  size: number = 20

  constructor(x: number, y: number, text: string, color: string) {
    super(x, y, color)
    this.text = text
    this.vy = -1.5 // Летит вверх
    this.vx = MathUtils.randomRange(-0.5, 0.5) // Немного вбок
  }

  update(sim: Simulation) {
    this.x += this.vx
    this.y += this.vy
    this.life -= 0.02 // Чуть быстрее исчезает
    if (this.life <= 0) this.markedForDeletion = true
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.globalAlpha = this.life
    ctx.fillStyle = this.color
    ctx.font = `bold ${this.size}px monospace`
    ctx.textAlign = 'center'
    // Тень для читаемости
    ctx.shadowColor = '#000'
    ctx.shadowBlur = 4
    ctx.fillText(this.text, this.x, this.y)
    ctx.restore()
  }
}

// ==========================================
// 4. RENDERER (ОТРИСОВКА)
// ==========================================

class Renderer {
  ctx: CanvasRenderingContext2D

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx
  }

  clear(width: number, height: number, warpFactor: number, isExploding: boolean, shockRadius: number) {
    // Используем простую очистку без альфа-канала при взрыве для скорости
    // Или простой цвет
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
       // Стандартный трейл эффект
       this.ctx.fillStyle = `rgba(10, 10, 10, ${0.3 + (1 / warpFactor) * 0.7})`
       this.ctx.fillRect(0, 0, width, height)
    }
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

    // B. Фотонное кольцо (тонкое яркое кольцо внутри)
    this.ctx.beginPath()
    this.ctx.arc(0, 0, r * 0.95, 0, Math.PI * 2)
    this.ctx.strokeStyle = '#ffffff' // Чистый белый свет
    this.ctx.lineWidth = 2
    this.ctx.shadowBlur = 10
    this.ctx.shadowColor = coreColor
    this.ctx.stroke()
    this.ctx.shadowBlur = 0

    // C. Эффект линзирования (внутреннее искажение)
    // Создаем "воронку" внутри
    const innerG = this.ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.9)
    innerG.addColorStop(0, '#000000')
    innerG.addColorStop(0.6, 'rgba(0,0,0,0.8)')
    innerG.addColorStop(1, coreColor) // Цвет по краям

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
    this.ctx.rotate(Date.now() * 0.0002) // Простое время
    const color = bh.state === BHState.UNSTABLE ? CONFIG.COLORS.danger : CONFIG.COLORS.primary

    for (let orbit = 1; orbit <= 3; orbit++) {
      const r = bh.visualRadius + orbit * 20; const count = 4 + orbit * 2
      this.ctx.beginPath(); this.ctx.arc(0, 0, r, 0, Math.PI * 2); this.ctx.strokeStyle = color; this.ctx.lineWidth = 1; this.ctx.globalAlpha = 0.1; this.ctx.stroke()
      for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count + (Date.now() * 0.001) * (0.5/orbit) * (orbit%2===0?1:-1)
        this.ctx.beginPath(); this.ctx.arc(Math.cos(a)*r, Math.sin(a)*r, 4, 0, Math.PI * 2); this.ctx.fillStyle = color; this.ctx.globalAlpha = 0.8; this.ctx.fill()
      }
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

  drawShip(s: Ship) {
     // 1. ЛИНИЯ МАРШРУТА (Глобальные координаты)
     if (s.navTarget && s.state !== 'PANIC') {
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
        const flameScale = s.state === 'PANIC' ? 180 : 80
        const flameLen = s.thrustPower * flameScale * flicker * 0.02

        this.ctx.beginPath(); this.ctx.moveTo(-6, -2); this.ctx.lineTo(-6 - flameLen * 20, 0); this.ctx.lineTo(-6, 2)
        this.ctx.fillStyle = s.state === 'PANIC' ? '#ef4444' : CONFIG.COLORS.shipEngines; this.ctx.fill()
     }

     // Тело
     this.ctx.fillStyle = s.color
     this.ctx.beginPath(); this.ctx.moveTo(10,0); this.ctx.lineTo(-6,6); this.ctx.lineTo(-4,0); this.ctx.lineTo(-6,-6); this.ctx.fill()
     this.ctx.strokeStyle = '#fff'; this.ctx.lineWidth = 1; this.ctx.stroke()

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
     if (!(s.weapon instanceof Blaster)) {
         if (s.weapon instanceof Minigun) statusStr += '∴'
         else if (s.weapon instanceof Shotgun) statusStr += '⋗'
         else if (s.weapon instanceof Railgun) statusStr += '━'
         else if (s.weapon instanceof MissileLauncher) statusStr += '🚀'
         else if (s.weapon instanceof PlasmaGun) statusStr += '🟣'
         else if (s.weapon instanceof FlakCannon) statusStr += '💥'
         else if (s.weapon instanceof WaveGun) statusStr += '〰️'
         else if (s.weapon instanceof SniperRifle) statusStr += '🎯'
     }

     // Иконки эффектов
     s.activeEffects.forEach(e => {
         if (e.type === 'SPEED_BOOST') statusStr += '⚡'
         else if (e.type === 'DAMAGE_BOOST') statusStr += '⚔️'
         else if (e.type === 'HEAL') statusStr += '❤️'
         else if (e.type === 'WEAPON_JAM') statusStr += '🚫'
     })

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

    let symbol = '?'
    switch(p.type) {
        case 'SPEED_BOOST': symbol = '⚡'; break
        case 'DAMAGE_BOOST': symbol = '💪'; break // Бицепс или Меч
        case 'RAPID_FIRE': symbol = '🔥'; break
        case 'HEAL': symbol = '❤️'; break
        case 'SLOW_DOWN': symbol = '❄️'; break
        case 'WEAPON_JAM': symbol = '🚫'; break
        // ОРУЖИЕ
        case 'GET_MINIGUN': symbol = '∴'; break // Три точки
        case 'GET_SHOTGUN': symbol = '⋗'; break // Веер
        case 'GET_RAILGUN': symbol = '━'; break // Линия
        case 'GET_MISSILE': symbol = '🚀'; break
        case 'GET_PLASMA': symbol = '🟣'; break
        case 'GET_FLAK': symbol = '💥'; break
        case 'GET_WAVE': symbol = '〰️'; break
        case 'GET_SNIPER': symbol = '🎯'; break
        case 'GET_SHIELD': symbol = '🛡️'; break
        case 'GET_TELEPORT': symbol = '🌀'; break
        case 'UPGRADE_BOMB': symbol = '💣'; break
        case 'UPGRADE_RANGE': symbol = '🔭'; break
        case 'SIZE_UP': symbol = '➕'; break // Или 🦍
        case 'SIZE_DOWN': symbol = '➖'; break // Или 🐜
    }
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

    // Свечение
    this.ctx.shadowBlur = 15
    this.ctx.shadowColor = s.color
    this.ctx.strokeStyle = s.color

    // УЧИТЫВАЕМ РАЗМЕР (sizeMult)
    const lineWidth = Math.max(0, (3 * s.life) * s.sizeMult)
    this.ctx.lineWidth = lineWidth

    this.ctx.lineCap = 'round'

    this.ctx.globalAlpha = Math.max(0, Math.min(1, s.life))
    if (lineWidth > 0) {
      this.ctx.stroke()
    }

    // Голова (яркая точка)
    const headRadius = Math.max(0, (4 * s.life) * s.sizeMult)
    if (headRadius > 0) {
      this.ctx.beginPath()
      this.ctx.arc(first.x, first.y, headRadius, 0, Math.PI * 2)
      this.ctx.fillStyle = '#ffffff'
      this.ctx.fill()
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

class SpaceCracks {
  segments: { x1: number, y1: number, x2: number, y2: number, width: number, alpha: number }[] = []
  active: boolean = false
  life: number = 0

  generate(cx: number, cy: number, width: number, height: number) {
    this.segments = []
    this.active = true
    this.life = 1.0

    // 1. Рандомное количество основных трещин (было фиксировано 7)
    const numCracks = Math.floor(MathUtils.randomRange(5, 12))

    // 2. Глобальный поворот (чтобы первая трещина не всегда смотрела вправо)
    const globalRotation = Math.random() * Math.PI * 2

    for (let i = 0; i < numCracks; i++) {
      // Базовый угол + глобальный поворот + джиттер
      let angle = globalRotation + (Math.PI * 2 * i) / numCracks + MathUtils.randomRange(-0.4, 0.4)

      let currentX = cx
      let currentY = cy

      // Не рисуем до самого края каждый раз, делаем рандомную длину
      const maxDist = Math.max(width, height) * MathUtils.randomRange(0.5, 0.9)
      let distTraveled = 0

      while (distTraveled < maxDist) {
        // Рандомная длина сегмента (зигзага)
        const step = MathUtils.randomRange(40, 120)

        // Изменяем угол для зигзага
        angle += MathUtils.randomRange(-0.6, 0.6)

        const nextX = currentX + Math.cos(angle) * step
        const nextY = currentY + Math.sin(angle) * step

        this.segments.push({
          x1: currentX, y1: currentY,
          x2: nextX, y2: nextY,
          width: Math.max(1, 6 - (distTraveled / 150)), // Толщина падает быстрее
          alpha: MathUtils.randomRange(0.4, 1.0) // Разная яркость сегментов
        })

        // Шанс ответвления (маленькая трещинка вбок)
        if (Math.random() < 0.3) {
          const branchAngle = angle + MathUtils.randomRange(0.5, 1.5) * (Math.random() > 0.5 ? 1 : -1)
          const branchLen = MathUtils.randomRange(30, 60)
          this.segments.push({
            x1: currentX, y1: currentY,
            x2: currentX + Math.cos(branchAngle) * branchLen,
            y2: currentY + Math.sin(branchAngle) * branchLen,
            width: 1,
            alpha: 0.5
          })
        }

        currentX = nextX
        currentY = nextY
        distTraveled += step
      }
    }
  }

  update(isReforming: boolean) {
    if (!this.active) return

    if (isReforming) {
      this.life -= 0.015
    } else {
      // Мерцание при взрыве
      this.life = 1.0 - Math.random() * 0.1
    }

    if (this.life <= 0) {
      this.active = false
      this.segments = []
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return

    ctx.save()
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#a5f3fc' // Cyan светящийся

    ctx.beginPath()
    for (let i = 0; i < this.segments.length; i++) {
      const s = this.segments[i]
      if (!s) continue
      if (this.life * s.alpha > 0.05) {
        // Динамическая ширина зависит от жизни (эффект затягивания)
        ctx.lineWidth = s.width * this.life
        ctx.moveTo(s.x1, s.y1)
        ctx.lineTo(s.x2, s.y2)
      }
    }
    ctx.globalAlpha = this.life
    ctx.stroke()
    ctx.restore()
  }
}

// ==========================================
// 5. SIMULATION (CONTROLLER)
// ==========================================

class Simulation {
  canvas: HTMLCanvasElement
  renderer: Renderer
  width: number = 0
  height: number = 0
  warpFactor: number = 1.0
  mouse = { x: -1000, y: -1000, down: false }

  blackHole: BlackHole
  stars: Star[] = []
  meteors: Meteor[] = []
  ships: Ship[] = []
  projectiles: Projectile[] = []
  particles: Particle[] = []
  serpents: VoidSerpent[] = []
  cracks: SpaceCracks
  shockwaves: Shockwave[] = []
  powerUps: PowerUp[] = []
  floatingTexts: FloatingText[] = []

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new Renderer(canvas.getContext('2d')!)
    this.blackHole = new BlackHole(0, 0)
    this.cracks = new SpaceCracks()
    this.resize()
    this.initStars()
  }

  resize() {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.canvas.width = this.width
    this.canvas.height = this.height
    this.blackHole.x = this.width / 2
    this.blackHole.y = this.height / 2
    if (this.stars.length === 0) this.initStars()
  }

  initStars() {
    this.stars = []
    for (let i = 0; i < CONFIG.POINT_COUNT; i++) this.stars.push(new Star(MathUtils.randomRange(0, this.width), MathUtils.randomRange(0, this.height)))
  }

  spawnMeteor() {
    const angle = Math.random() * Math.PI * 2
    const dist = Math.max(this.width, this.height) * 0.7
    const x = this.blackHole.x + Math.cos(angle) * dist
    const y = this.blackHole.y + Math.sin(angle) * dist

    const isRepelled = Math.random() > 0.85
    const spread = isRepelled ? 500 : 100
    const targetX = this.blackHole.x + (Math.random() - 0.5) * spread
    const targetY = this.blackHole.y + (Math.random() - 0.5) * spread
    const angleToTarget = MathUtils.angle({x,y}, {x: targetX, y: targetY})
    const speed = MathUtils.randomRange(2, 4)

    this.meteors.push(new Meteor(x, y, Math.cos(angleToTarget) * speed, Math.sin(angleToTarget) * speed, false))
  }

  spawnShip() {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.max(this.width, this.height) / 2 + 50
    const x = this.width/2 + Math.cos(angle) * radius
    const y = this.height/2 + Math.sin(angle) * radius
    this.ships.push(new Ship(x, y, angle + Math.PI))
  }

  spawnLaser(x: number, y: number, vx: number, vy: number, angle: number, color: string, damageMult: number = 1) {
    // Устаревший метод, используется только для обратной совместимости
    // Теперь используется fireWeapon в классе Ship
    const stats = CONFIG.WEAPONS.BLASTER
    const spread = (Math.random() - 0.5) * stats.spread
    const finalVx = vx + Math.cos(angle + spread) * stats.speed
    const finalVy = vy + Math.sin(angle + spread) * stats.speed
    this.projectiles.push(new LinearProjectile(x + Math.cos(angle) * 15, y + Math.sin(angle) * 15, finalVx, finalVy, color || '#8b5cf6', stats.damage * damageMult, 2, 60))
  }

  spawnPowerUp() {
    // Спавн в случайном месте, но не слишком близко к дыре
    let x, y, d
    do {
        x = MathUtils.randomRange(50, this.width - 50)
        y = MathUtils.randomRange(50, this.height - 50)
        d = MathUtils.dist({x,y}, this.blackHole)
    } while(d < 200) // Не спавнить в центре

    this.powerUps.push(new PowerUp(x, y))
  }

  spawnBomb(x: number, y: number, vx: number, vy: number, angle: number, bombLevel: number = 1) {
     // Урон бомбы = База + (Уровень апгрейда * 10)
     const damage = CONFIG.BOMB_DAMAGE + (bombLevel - 1) * 10
     this.projectiles.push(new BombProjectile(x + Math.cos(angle) * 10, y + Math.sin(angle) * 10, vx + Math.cos(angle) * 6, vy + Math.sin(angle) * 6, damage))
  }

  createExplosion(x: number, y: number, count: number, color: string) {
    // Ограничитель: если частиц уже слишком много, не спавним новые
    if (this.particles.length > 300) return

    // Уменьшаем количество частиц в 2 раза, но делаем их крупнее
    const safeCount = Math.floor(count * 0.5)

    for (let i = 0; i < safeCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = MathUtils.randomRange(2, 12) // Чуть быстрее
      // Size range 2-6 (было 1-4)
      this.particles.push(new Particle(x, y, color, MathUtils.randomRange(2, 6), Math.cos(angle) * speed, Math.sin(angle) * speed))
    }
  }

  spawnSupernovaDebris() {
    // Снизили с 150 до 60 метеоритов
    const debrisCount = 60
    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = MathUtils.randomRange(15, 40)
      this.meteors.push(new Meteor(this.blackHole.x, this.blackHole.y, Math.cos(angle) * speed, Math.sin(angle) * speed, true))
    }
    // Взрыв центра (было 120, стало 50)
    this.createExplosion(this.blackHole.x, this.blackHole.y, 50, '#ffffff')

    // ЗАПУСК ТРЕЩИН
    this.cracks.generate(this.blackHole.x, this.blackHole.y, this.width, this.height)
  }

  spawnSerpent() {
    this.serpents.push(new VoidSerpent(this.blackHole.x, this.blackHole.y))
  }

  // Метод для создания волны (Вызываем из бомбы)
  addCoins(amount: number, x: number, y: number) {
      economy.coins += amount
      // Создаем всплывающий текст
      this.floatingTexts.push(new FloatingText(x, y, `+${amount}$`, '#fbbf24')) // Золотой цвет
  }

  // Новый метод для показа урона
  spawnDamageText(x: number, y: number, damage: number, isCrit: boolean) {
    const text = Math.floor(damage).toString()
    const color = isCrit ? '#ef4444' : '#ffffff' // Красный для крита, белый обычный
    const size = isCrit ? 24 : 14
    // Немного рандомизируем позицию, чтобы цифры не слипались
    const ox = MathUtils.randomRange(-10, 10)
    const oy = MathUtils.randomRange(-10, 10)

    const ft = new FloatingText(x + ox, y + oy, text, color)
    ft.size = size
    this.floatingTexts.push(ft)
  }

  spawnShockwave(x: number, y: number) {
    this.shockwaves.push(new Shockwave(x, y))

    // ЛОГИКА УРОНА ПО ПЛОЩАДИ (AOE)
    // Проходим по всем змеям
    for (const s of this.serpents) {
      // Проверяем расстояние до каждого сегмента змеи, чтобы попасть наверняка
      let hit = false
      for (const seg of s.segments) {
        const dist = MathUtils.dist({x, y}, seg)
        if (dist < 250) { // Радиус взрыва
           hit = true
           break
        }
      }

      if (hit) {
        // Наносим урон змее (например, 10 урона - треть жизни)
        s.takeDamage(this, 10)
        // Отталкиваем змею от взрыва (немного физики)
        const angle = MathUtils.angle({x, y}, s)
        s.x += Math.cos(angle) * 20
        s.y += Math.sin(angle) * 20
      }
    }
  }

  update() {
    // Input Logic
    if (this.mouse.down) this.warpFactor += (5.0 - this.warpFactor) * 0.05
    else this.warpFactor += (1.0 - this.warpFactor) * 0.05

    // Render Clear
    this.renderer.clear(this.width, this.height, this.warpFactor, this.blackHole.state === BHState.EXPLODING, this.blackHole.shockwaveRadius)

    // ОТРИСОВКА ТРЕЩИН (Сразу после очистки экрана, чтобы они были на заднем фоне)
    // Передаем true, если дыра в стадии REFORMING (чтобы начали исчезать)
    this.cracks.update(this.blackHole.state === BHState.REFORMING)
    if (this.renderer.ctx) {
      this.cracks.draw(this.renderer.ctx)
    }

    // Logic Update
    this.blackHole.update(this)
    this.renderer.drawBlackHole(this.blackHole)

    this.stars.forEach(s => s.update(this))
    this.renderer.drawStars(this.stars, this.warpFactor)

    // === ЗМЕИ ===
    // Редкий спавн (примерно раз в 5-10 секунд)
    // Спавним только если дыра спокойна
    if (this.blackHole.state === BHState.STABLE && Math.random() < 0.003) {
      this.spawnSerpent()
    }

    for (let i = this.serpents.length - 1; i >= 0; i--) {
      const s = this.serpents[i]
      if (!s) {
        this.serpents.splice(i, 1)
        continue
      }
      s.update(this)
      this.renderer.drawVoidSerpent(s)
      if (s.markedForDeletion) this.serpents.splice(i, 1)
    }
    // ============

    // СПАВН БОНУСОВ
    if (this.blackHole.state !== BHState.EXPLODING && Math.random() < CONFIG.POWERUP_RATE) {
        this.spawnPowerUp()
    }

    // Meteors
    const activeMeteors = this.meteors.filter(m => !m.isDebris).length
    if (this.blackHole.state !== BHState.EXPLODING && activeMeteors < CONFIG.MAX_METEORS && Math.random() < 0.05) this.spawnMeteor()

    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i]
      if (!m) {
        this.meteors.splice(i, 1)
        continue
      }
      m.update(this)
      this.renderer.drawMeteor(m, this.warpFactor)
      if (m.markedForDeletion) this.meteors.splice(i, 1)
    }

    // Ships
    while (this.ships.length < CONFIG.SHIP_COUNT) this.spawnShip()
    for (let i = this.ships.length - 1; i >= 0; i--) {
      const s = this.ships[i]
      if (!s) {
        this.ships.splice(i, 1)
        continue
      }
      s.update(this)
      this.renderer.drawShip(s)
      if (s.markedForDeletion) this.ships.splice(i, 1)
    }

    // Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i]
      if (!p) {
        this.projectiles.splice(i, 1)
        continue
      }
      p.update(this)
      this.renderer.drawProjectile(p)
      if (p.markedForDeletion) this.projectiles.splice(i, 1)
    }

    // ОБНОВЛЕНИЕ БОНУСОВ
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i]
      if (!p) {
        this.powerUps.splice(i, 1)
        continue
      }
      p.update(this)
      this.renderer.drawPowerUp(p)

      // Проверка столкновения с кораблями
      for (const s of this.ships) {
          if (MathUtils.dist(p, s) < 25) { // Подобрал!
              s.applyPowerUp(p)
              // Эффект подбора
              this.createExplosion(p.x, p.y, 15, p.color)
              p.markedForDeletion = true
              break
          }
      }

      if (p.markedForDeletion) this.powerUps.splice(i, 1)
    }

    // ОБРАБОТКА ВОЛН (Вставлено перед частицами)
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i]
      if (!sw) {
        this.shockwaves.splice(i, 1)
        continue
      }
      sw.update(this)
      sw.draw(this.renderer.ctx)
      if (sw.markedForDeletion) this.shockwaves.splice(i, 1)
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      if (!p) {
        this.particles.splice(i, 1)
        continue
      }
      p.update()
      this.renderer.drawParticle(p)
      if (p.markedForDeletion) this.particles.splice(i, 1)
    }

    // Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i]
      if (!ft) {
        this.floatingTexts.splice(i, 1)
        continue
      }
      ft.update(this)
      ft.draw(this.renderer.ctx)
      if (ft.markedForDeletion) this.floatingTexts.splice(i, 1)
    }
  }
}

// ==========================================
// 6. LIFECYCLE
// ==========================================

let sim: Simulation | null = null
let animationFrameId: number

const handleResize = (): void => { sim?.resize() }
const handleMouseMove = (e: MouseEvent) => { if(sim) { sim.mouse.x = e.clientX; sim.mouse.y = e.clientY } }
const handleMouseDown = () => { if(sim) sim.mouse.down = true }
const handleMouseUp = () => { if(sim) sim.mouse.down = false }

const loop = () => {
  sim?.update()
  animationFrameId = requestAnimationFrame(loop)
}

onMounted(() => {
  if (canvasRef.value) {
    sim = new Simulation(canvasRef.value)
    loop()
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mousedown', handleMouseDown)
  window.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div class="fixed inset-0 bg-[#0a0a0a] overflow-hidden font-mono text-white select-none">
    <!-- Канвас на фоне -->
    <canvas ref="canvasRef" class="absolute inset-0 block pointer-events-auto" style="z-index: 0;"></canvas>

    <!-- Баланс (слева вверху) -->
    <Transition name="balance-fade">
      <div v-if="!showUI" class="absolute top-0 left-0 p-6 z-10 pointer-events-none">
        <div class="text-4xl font-bold text-yellow-400 drop-shadow-md">
          {{ Math.floor(economy.coins) }}$
        </div>
      </div>
    </Transition>

    <!-- UI СЛОЙ (справа вверху) -->
    <Transition name="shop-fade">
      <div v-if="!showUI" class="absolute top-[60px] right-0 p-6 flex flex-col items-end space-y-4 z-10 pointer-events-none shop-container">

      <!-- Магазин (включаем pointer-events для кнопок) -->
      <div class="flex flex-col space-y-2 pointer-events-auto">

        <!-- Кнопка покупки корабля -->
        <button
          @click="buyUpgrade('ship')"
          class="group relative px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="economy.coins < costs.ship"
        >
          <div class="flex justify-between items-center w-48">
            <span class="text-sm text-gray-300 group-hover:text-white">Add Ship</span>
            <span class="text-yellow-400 text-xs">{{ costs.ship }}$</span>
          </div>
          <div class="text-[10px] text-gray-500 text-right">Count: {{ economy.shipsCount }}</div>
        </button>

        <!-- Урон -->
        <button
          @click="buyUpgrade('damage')"
          class="group px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
          :disabled="economy.coins < costs.damage"
        >
          <div class="flex justify-between items-center w-48">
            <span class="text-sm text-gray-300 group-hover:text-white">Damage</span>
            <span class="text-yellow-400 text-xs">{{ costs.damage }}$</span>
          </div>
          <div class="text-[10px] text-gray-500 text-right">Lvl: {{ economy.damageLevel }}</div>
        </button>

        <!-- Здоровье -->
        <button
          @click="buyUpgrade('hull')"
          class="group px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
          :disabled="economy.coins < costs.hull"
        >
          <div class="flex justify-between items-center w-48">
            <span class="text-sm text-gray-300 group-hover:text-white">Hull HP</span>
            <span class="text-yellow-400 text-xs">{{ costs.hull }}$</span>
          </div>
          <div class="text-[10px] text-gray-500 text-right">Lvl: {{ economy.hullLevel }}</div>
        </button>

        <!-- Скорость стрельбы -->
        <button
          @click="buyUpgrade('turret')"
          class="group px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
          :disabled="economy.coins < costs.turret"
        >
          <div class="flex justify-between items-center w-48">
            <span class="text-sm text-gray-300 group-hover:text-white">Fire Rate</span>
            <span class="text-yellow-400 text-xs">{{ costs.turret }}$</span>
          </div>
          <div class="text-[10px] text-gray-500 text-right">Lvl: {{ economy.turretSpeed }}</div>
        </button>

        <!-- Divider -->
        <div class="h-px bg-white/10 my-2"></div>

        <!-- Щит -->
        <button
          @click="buyUpgrade('shield')"
          class="group px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
          :disabled="economy.coins < costs.shield"
        >
          <div class="flex justify-between items-center w-48">
            <span class="text-sm text-blue-400 group-hover:text-blue-300">Shield Gen</span>
            <span class="text-yellow-400 text-xs">{{ costs.shield }}$</span>
          </div>
          <div class="text-[10px] text-gray-500 text-right">Max: {{ economy.shieldLevel * 5 }}</div>
        </button>

        <!-- Крит -->
        <button
          @click="buyUpgrade('crit')"
          class="group px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
          :disabled="economy.coins < costs.crit"
        >
          <div class="flex justify-between items-center w-48">
            <span class="text-sm text-red-400 group-hover:text-red-300">Crit Chance</span>
            <span class="text-yellow-400 text-xs">{{ costs.crit }}$</span>
          </div>
          <div class="text-[10px] text-gray-500 text-right">Chance: {{ economy.critLevel * 5 }}%</div>
        </button>

        <!-- Реген -->
        <button
          @click="buyUpgrade('regen')"
          class="group px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
          :disabled="economy.coins < costs.regen"
        >
          <div class="flex justify-between items-center w-48">
            <span class="text-sm text-green-400 group-hover:text-green-300">Nanobots</span>
            <span class="text-yellow-400 text-xs">{{ costs.regen }}$</span>
          </div>
          <div class="text-[10px] text-gray-500 text-right">Lvl: {{ economy.regenLevel }}</div>
        </button>

        <!-- Магнит -->
        <button
          @click="buyUpgrade('magnet')"
          class="group px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
          :disabled="economy.coins < costs.magnet"
        >
          <div class="flex justify-between items-center w-48">
            <span class="text-sm text-purple-400 group-hover:text-purple-300">Magnet</span>
            <span class="text-yellow-400 text-xs">{{ costs.magnet }}$</span>
          </div>
          <div class="text-[10px] text-gray-500 text-right">Range: {{ 500 + (economy.magnetLevel-1)*150 }}</div>
        </button>

      </div>

      <div class="text-[10px] text-gray-600 pt-4">
        Hold Click: Warp Drive<br>
        Killing Serpents gives $$$
      </div>

      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Анимация появления кнопок магазина */
.shop-fade-enter-active {
  transition: all 0.4s ease-out;
}

.shop-fade-leave-active {
  transition: all 0.3s ease-in;
}

.shop-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.shop-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.shop-fade-enter-to,
.shop-fade-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* Staggered animation для кнопок */
.shop-container > div > button {
  animation: slideInRight 0.5s ease-out backwards;
}

.shop-container > div > button:nth-child(1) {
  animation-delay: 0.05s;
}

.shop-container > div > button:nth-child(2) {
  animation-delay: 0.1s;
}

.shop-container > div > button:nth-child(3) {
  animation-delay: 0.15s;
}

.shop-container > div > button:nth-child(4) {
  animation-delay: 0.2s;
}

.shop-container > div > button:nth-child(5) {
  animation-delay: 0.25s;
}

.shop-container > div > button:nth-child(6) {
  animation-delay: 0.3s;
}

.shop-container > div > button:nth-child(7) {
  animation-delay: 0.35s;
}

.shop-container > div > button:nth-child(8) {
  animation-delay: 0.4s;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Анимация появления баланса */
.balance-fade-enter-active {
  transition: all 0.4s ease-out;
}

.balance-fade-leave-active {
  transition: all 0.3s ease-in;
}

.balance-fade-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.balance-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.balance-fade-enter-to,
.balance-fade-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>

