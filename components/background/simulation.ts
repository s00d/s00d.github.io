import { CONFIG } from './config'
import { BHState } from './types'
import { MathUtils } from './utils/math'
import { Renderer } from './renderer/Renderer'
import { SpaceCracks } from './renderer/SpaceCracks'
import { BlackHole } from './entities/BlackHole'
import { Star } from './entities/Star'
import { Meteor } from './entities/Meteor'
import { BigMeteor } from './entities/BigMeteor'
import { Ship } from './entities/Ship'
import { Particle } from './entities/Particle'
import { VoidSerpent } from './entities/VoidSerpent'
import { Shockwave } from './entities/Shockwave'
import { PowerUp } from './entities/PowerUp'
import { FloatingText } from './entities/FloatingText'
import { DamageNumber } from './ui/DamageNumber'
import { CoinReward } from './ui/CoinReward'
import type { Projectile } from './projectiles/Projectile'
import { LinearProjectile } from './projectiles/LinearProjectile'
import { BombProjectile } from './projectiles/BombProjectile'
import { Blaster } from './weapons/Blaster'
import { economy } from './economy'
import { DamageService } from './services/DamageService'
import { CollisionService } from './services/CollisionService'

export class Simulation {
  canvas: HTMLCanvasElement
  renderer: Renderer
  width: number = 0
  height: number = 0
  warpFactor: number = 1.0
  mouse = { x: -1000, y: -1000, down: false }

  blackHole: BlackHole
  stars: Star[] = []
  meteors: Meteor[] = []
  bigMeteor: BigMeteor | null = null
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

  spawnBigMeteor() {
    // Спавним только если нет большого метеорита
    if (this.bigMeteor !== null) return

    const angle = Math.random() * Math.PI * 2
    const dist = Math.max(this.width, this.height) * 0.7
    const x = this.blackHole.x + Math.cos(angle) * dist
    const y = this.blackHole.y + Math.sin(angle) * dist

    // Метеорит всегда летит к центру экрана (к черной дыре)
    const centerX = this.width / 2
    const centerY = this.height / 2
    const angleToCenter = MathUtils.angle({x, y}, {x: centerX, y: centerY})
    const speed = MathUtils.randomRange(1.5, 2.5)

    this.bigMeteor = new BigMeteor(x, y, Math.cos(angleToCenter) * speed, Math.sin(angleToCenter) * speed)
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
    const blaster = new Blaster()
    const stats = blaster.config
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
    const serpent = new VoidSerpent(this.blackHole.x, this.blackHole.y)

    // Применяем улучшения черной дыры к змее (дебаффы не влияют на характеристики змей, только на стоимость)
    const upgrades = this.blackHole.upgrades
    serpent.maxHp += upgrades.serpentHealth * 10
    serpent.hp = serpent.maxHp
    serpent.speed += upgrades.serpentSpeed * 0.5
    serpent.damageMult += upgrades.serpentDamage * 0.5

    this.serpents.push(serpent)
  }

  // Apply debuffs from economy to black hole
  applyDebuffsToBlackHole() {
    this.blackHole.debuffs.serpentCost = economy.blackHoleSerpentCostDebuff
    this.blackHole.debuffs.balanceRate = economy.blackHoleBalanceRateDebuff
    this.blackHole.debuffs.darkMatterRate = economy.blackHoleDarkMatterRateDebuff
  }

  // Автоматическая покупка улучшений черной дыры (первое доступное) - использует darkMatter черной дыры
  autoBuyBlackHoleUpgrades() {
    const upgrades = [
      { type: 'serpentBaseCost' as const, cost: this.getBlackHoleUpgradeCost('serpentBaseCost') },
      { type: 'serpentHealth' as const, cost: this.getBlackHoleUpgradeCost('serpentHealth') },
      { type: 'serpentSpeed' as const, cost: this.getBlackHoleUpgradeCost('serpentSpeed') },
      { type: 'serpentDamage' as const, cost: this.getBlackHoleUpgradeCost('serpentDamage') },
      { type: 'balanceRate' as const, cost: this.getBlackHoleUpgradeCost('balanceRate') }
    ]

    // Сортируем по стоимости (от дешевых к дорогим)
    upgrades.sort((a, b) => a.cost - b.cost)

    // Покупаем первое доступное улучшение за darkMatter из economy
    for (const upgrade of upgrades) {
      if (economy.darkMatter >= upgrade.cost) {
        economy.darkMatter -= upgrade.cost
        this.blackHole.upgrades[upgrade.type]++
        break
      }
    }
  }

  // Получить стоимость улучшения черной дыры
  getBlackHoleUpgradeCost(type: keyof typeof this.blackHole.upgrades): number {
    const level = this.blackHole.upgrades[type]
    const baseCosts: Record<keyof typeof this.blackHole.upgrades, number> = {
      serpentBaseCost: 200,
      serpentHealth: 300,
      serpentSpeed: 250,
      serpentDamage: 400,
      balanceRate: 500
    }
    const multipliers: Record<keyof typeof this.blackHole.upgrades, number> = {
      serpentBaseCost: 1.5,
      serpentHealth: 1.6,
      serpentSpeed: 1.55,
      serpentDamage: 1.65,
      balanceRate: 1.7
    }

    const base = baseCosts[type]
    const mult = multipliers[type]
    return Math.floor(base * Math.pow(mult, level))
  }

  // Метод для добавления монет (использует CoinReward)
  addCoins(amount: number, x: number, y: number) {
      economy.coins += amount
      // Создаем всплывающий текст награды
      const coinReward = CoinReward.create(x, y, amount)
      this.floatingTexts.push(coinReward)
  }

  // Method to add dark matter (for black hole upgrades)
  addDarkMatter(amount: number, x: number, y: number) {
      economy.darkMatter += amount
      // Create floating text for dark matter reward
      const darkMatterReward = CoinReward.create(x, y, amount)
      darkMatterReward.text = `+${Math.floor(amount)}⚫`
      darkMatterReward.color = '#8b5cf6' // Purple color for dark matter
      this.floatingTexts.push(darkMatterReward)
  }

  // Метод для показа урона (использует DamageNumber)
  spawnDamageText(x: number, y: number, damage: number, isCrit: boolean) {
    const damageNumber = DamageNumber.create(x, y, damage, isCrit)
    this.floatingTexts.push(damageNumber)
  }

  spawnShockwave(x: number, y: number) {
    this.shockwaves.push(new Shockwave(x, y))

    // ЛОГИКА УРОНА ПО ПЛОЩАДИ (AOE)
    const affected = DamageService.applyAoeDamage(x, y, 250, 10, this.serpents)

    for (const { serpent, damage, pushAngle } of affected) {
      serpent.takeDamage(this, damage)
      // Отталкиваем змею от взрыва (немного физики)
      serpent.x += Math.cos(pushAngle) * 20
      serpent.y += Math.sin(pushAngle) * 20
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
    // Автоматический заказ призрака при достаточном балансе
    // Базовая стоимость 500 - (улучшения * 50) + (дебаффы * 50) + экспоненциальный рост: +100, +200, +400, +800...
    const baseCostReduction = this.blackHole.upgrades.serpentBaseCost * 50
    const debuffIncrease = this.blackHole.debuffs.serpentCost * 50
    const SERPENT_BASE_COST = Math.max(100, 500 - baseCostReduction + debuffIncrease) // Минимум 100
    const SERPENT_EXTRA_COST = this.serpents.length > 0 ? 100 * Math.pow(2, this.serpents.length - 1) : 0
    const SERPENT_COST = SERPENT_BASE_COST + SERPENT_EXTRA_COST

    // Автоматическая покупка улучшений (если не хватает на змею) - использует darkMatter из economy
    if (this.blackHole.state === BHState.STABLE && economy.darkMatter < SERPENT_COST) {
      this.autoBuyBlackHoleUpgrades()
    }

    if (this.blackHole.state === BHState.STABLE && economy.darkMatter >= SERPENT_COST) {
      economy.darkMatter -= SERPENT_COST
      this.spawnSerpent()
    }

    // Старый редкий спавн (примерно раз в 5-10 секунд) - оставляем как резерв
    // if (this.blackHole.state === BHState.STABLE && Math.random() < 0.003) {
    //   this.spawnSerpent()
    // }

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

    // Big Meteor
    if (this.bigMeteor === null) {
      // Спавним сразу после уничтожения предыдущего (только если дыра не взрывается)
      if (this.blackHole.state !== BHState.EXPLODING) {
        this.spawnBigMeteor()
      }
    } else {
      this.bigMeteor.update(this)
      this.renderer.drawBigMeteor(this.bigMeteor, this.warpFactor)
      if (this.bigMeteor.markedForDeletion) {
        this.bigMeteor = null
        // Спавним новый сразу после уничтожения предыдущего
        if (this.blackHole.state !== BHState.EXPLODING) {
          this.spawnBigMeteor()
        }
      }
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
          if (CollisionService.checkCircleCollision(p, s, 25, 0)) { // Подобрал!
              // Специальная обработка монеты
              if (p.type === 'COIN') {
                economy.coins += 500
                this.createExplosion(p.x, p.y, 20, '#fbbf24')
                const coinReward = CoinReward.create(p.x, p.y, 500)
                this.floatingTexts.push(coinReward)
              } else {
                s.applyPowerUp(p)
                this.createExplosion(p.x, p.y, 15, p.color)
              }
              p.markedForDeletion = true
              break
          }
      }

      // Проверка столкновения с призраками
      for (const s of this.serpents) {
        if (s.segments.length > 0) {
          const head = s.segments[0]
          if (head && CollisionService.checkCircleCollision(p, head, 25, 20)) {
            // Специальная обработка монеты для призраков
            if (p.type === 'COIN') {
              economy.darkMatter += 500
              this.createExplosion(p.x, p.y, 20, '#fbbf24')
              const coinReward = CoinReward.create(p.x, p.y, 500)
              coinReward.text = `+500⚫`
              coinReward.color = '#8b5cf6'
              this.floatingTexts.push(coinReward)
            } else {
              s.applyPowerUp(p)
              this.createExplosion(p.x, p.y, 15, p.color)
            }
            p.markedForDeletion = true
            break
          }
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

