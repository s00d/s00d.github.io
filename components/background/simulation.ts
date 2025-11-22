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
import { DamageApplicationService } from './services/DamageApplicationService'
import { CollisionService } from './services/CollisionService'
import { EffectSpawnService } from './services/EffectSpawnService'
import { BlackHoleUpgradeService } from './services/BlackHoleUpgradeService'
import { EntityManager } from './services/EntityManager'
import { SerpentSystem } from './systems/SerpentSystem'
import { ShipSystem } from './systems/ShipSystem'
import { MeteorSystem } from './systems/MeteorSystem'
import { ProjectileSystem } from './systems/ProjectileSystem'
import { PowerUpSystem } from './systems/PowerUpSystem'
import { ParticleSystem } from './systems/ParticleSystem'
import { FloatingTextSystem } from './systems/FloatingTextSystem'
import { ShockwaveSystem } from './systems/ShockwaveSystem'
import type { EntitySystem } from './systems/EntitySystem'
import { ParticlePool } from './pools/ParticlePool'
import { ProjectilePool } from './pools/ProjectilePool'
import { SpawnManager } from './factories/SpawnManager'
import { SpatialGrid } from './services/SpatialGrid'

export class Simulation {
  canvas: HTMLCanvasElement
  renderer: Renderer
  width: number = 0
  height: number = 0
  warpFactor: number = 1.0
  mouse = { x: -1000, y: -1000, down: false }

  blackHole: BlackHole
  stars: Star[] = []
  meteors: EntityManager<Meteor> = new EntityManager<Meteor>()
  bigMeteor: BigMeteor | null = null
  ships: EntityManager<Ship> = new EntityManager<Ship>()
  projectiles: EntityManager<Projectile> = new EntityManager<Projectile>()
  particles: EntityManager<Particle> = new EntityManager<Particle>()
  serpents: EntityManager<VoidSerpent> = new EntityManager<VoidSerpent>()
  cracks: SpaceCracks
  shockwaves: EntityManager<Shockwave> = new EntityManager<Shockwave>()
  powerUps: EntityManager<PowerUp> = new EntityManager<PowerUp>()
  floatingTexts: EntityManager<FloatingText> = new EntityManager<FloatingText>()

  // Системы управления сущностями
  private systems: Map<string, EntitySystem> = new Map()

  // Пулы для переиспользования объектов
  particlePool: ParticlePool = new ParticlePool(50, 300)
  projectilePool: ProjectilePool = new ProjectilePool(20, 100, 10, 50)

  // Менеджер спавна
  spawnManager: SpawnManager = new SpawnManager()

  // Пространственная сетка для оптимизации коллизий
  spatialGrid: SpatialGrid = new SpatialGrid(100)

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new Renderer(canvas.getContext('2d')!)
    this.blackHole = new BlackHole(0, 0)
    this.cracks = new SpaceCracks()
    this.resize()
    this.initStars()
    this.initSystems()
  }

  private initSystems() {
    this.systems.set('serpent', new SerpentSystem())
    this.systems.set('ship', new ShipSystem())
    this.systems.set('meteor', new MeteorSystem())
    this.systems.set('projectile', new ProjectileSystem())
    this.systems.set('powerUp', new PowerUpSystem())
    this.systems.set('particle', new ParticleSystem())
    this.systems.set('floatingText', new FloatingTextSystem())
    this.systems.set('shockwave', new ShockwaveSystem())
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
    this.spawnManager.spawnMeteor(this)
  }

  spawnBigMeteor() {
    this.spawnManager.spawnBigMeteor(this)
  }

  spawnShip() {
    this.spawnManager.spawnShip(this)
  }

  spawnLaser(x: number, y: number, vx: number, vy: number, angle: number, color: string, damageMult: number = 1) {
    // Устаревший метод, используется только для обратной совместимости
    // Теперь используется fireWeapon в классе Ship
    const blaster = new Blaster()
    const stats = blaster.config
    const spread = (Math.random() - 0.5) * stats.spread
    const finalVx = vx + Math.cos(angle + spread) * stats.speed
    const finalVy = vy + Math.sin(angle + spread) * stats.speed
    const projectile = this.projectilePool.acquireLinear(x + Math.cos(angle) * 15, y + Math.sin(angle) * 15, finalVx, finalVy, color || '#8b5cf6', stats.damage * damageMult, 2, 60)
    this.projectiles.add(projectile)
  }

  spawnPowerUp() {
    this.spawnManager.spawnPowerUp(this)
  }

  spawnBomb(x: number, y: number, vx: number, vy: number, angle: number, bombLevel: number = 1) {
    EffectSpawnService.spawnBomb(x, y, vx, vy, angle, bombLevel, this)
  }

  createExplosion(x: number, y: number, count: number, color: string) {
    EffectSpawnService.createExplosion(x, y, count, color, this)
  }

  spawnSupernovaDebris() {
    // Снизили с 150 до 60 метеоритов
    const debrisCount = 60
    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = MathUtils.randomRange(15, 40)
      this.meteors.add(new Meteor(this.blackHole.x, this.blackHole.y, Math.cos(angle) * speed, Math.sin(angle) * speed, true))
    }
    // Взрыв центра (было 120, стало 50)
    EffectSpawnService.createExplosion(this.blackHole.x, this.blackHole.y, 50, '#ffffff', this)

    // ЗАПУСК ТРЕЩИН
    this.cracks.generate(this.blackHole.x, this.blackHole.y, this.width, this.height)
  }

  spawnSerpent() {
    this.spawnManager.spawnSerpent(this)
  }

  // Apply debuffs from economy to black hole
  applyDebuffsToBlackHole() {
    BlackHoleUpgradeService.applyDebuffs(this.blackHole)
  }

  // Автоматическая покупка улучшений черной дыры (первое доступное) - использует darkMatter черной дыры
  autoBuyBlackHoleUpgrades() {
    BlackHoleUpgradeService.autoBuyUpgrade(this.blackHole)
  }

  // Получить стоимость улучшения черной дыры
  getBlackHoleUpgradeCost(type: keyof typeof this.blackHole.upgrades): number {
    return BlackHoleUpgradeService.getUpgradeCost(this.blackHole, type)
  }

  // Метод для добавления монет (использует CoinReward)
  addCoins(amount: number, x: number, y: number) {
    EffectSpawnService.addCoins(amount, x, y, this)
  }

  // Method to add dark matter (for black hole upgrades)
  addDarkMatter(amount: number, x: number, y: number) {
    EffectSpawnService.addDarkMatter(amount, x, y, this)
  }

  // Метод для показа урона (использует DamageNumber)
  spawnDamageText(x: number, y: number, damage: number, isCrit: boolean) {
    EffectSpawnService.spawnDamageText(x, y, damage, isCrit, this)
  }

  spawnShockwave(x: number, y: number) {
    EffectSpawnService.spawnShockwave(x, y, this)
  }

  update() {
    this.updateInput()
    this.renderClear()
    this.updateSystems()
    this.renderSystems()
  }

  private updateInput() {
    // Input Logic
    if (this.mouse.down) this.warpFactor += (5.0 - this.warpFactor) * 0.05
    else this.warpFactor += (1.0 - this.warpFactor) * 0.05
  }

  private renderClear() {
    // Render Clear (полная очистка)
    this.renderer.clear(this.width, this.height, this.warpFactor, this.blackHole.state === BHState.EXPLODING, this.blackHole.shockwaveRadius)

    // Отрисовываем туманность на фоне (после очистки)
    const currentTime = Date.now()
    this.renderer.drawNebula(
      this.width,
      this.height,
      currentTime,
      this.blackHole.state === BHState.EXPLODING,
      this.blackHole.shockwaveRadius
    )

    // Накладываем трейл-эффект поверх туманности (с меньшей непрозрачностью, чтобы туманность была видна)
    if (this.blackHole.state !== BHState.EXPLODING) {
      this.renderer.applyTrailEffect(this.width, this.height, this.warpFactor)
    }

    // ОТРИСОВКА ТРЕЩИН (Сразу после очистки экрана, чтобы они были на заднем фоне)
    this.cracks.update(this.blackHole.state === BHState.REFORMING)
    if (this.renderer.ctx) {
      this.cracks.draw(this.renderer.ctx)
    }

    // Черная дыра и звезды
    this.blackHole.update(this)
    this.renderer.drawBlackHole(this.blackHole)

    this.stars.forEach(s => s.update(this))
    this.renderer.drawStars(this.stars, this.warpFactor)

    // Big Meteor (специальная обработка, так как это не EntityManager)
    if (this.bigMeteor === null) {
      if (this.blackHole.state !== BHState.EXPLODING) {
        this.spawnBigMeteor()
      }
    } else {
      this.bigMeteor.update(this)
      this.renderer.drawBigMeteor(this.bigMeteor, this.warpFactor)
      if (this.bigMeteor.markedForDeletion) {
        this.bigMeteor = null
        if (this.blackHole.state !== BHState.EXPLODING) {
          this.spawnBigMeteor()
        }
      }
    }
  }

  private updateSystems() {
    // Обновляем пространственную сетку для оптимизации коллизий
    this.updateSpatialGrid()

    // Обновление всех систем
    for (const system of this.systems.values()) {
      system.update(this)
    }
  }

  private updateSpatialGrid() {
    // Очищаем сетку каждый кадр
    this.spatialGrid.clear()

    // Добавляем все сущности в сетку
    for (const ship of this.ships.getAll()) {
      this.spatialGrid.insert(ship)
    }
    for (const serpent of this.serpents.getAll()) {
      this.spatialGrid.insert(serpent)
    }
    for (const meteor of this.meteors.getAll()) {
      this.spatialGrid.insert(meteor)
    }
    for (const powerUp of this.powerUps.getAll()) {
      this.spatialGrid.insert(powerUp)
    }
    if (this.bigMeteor) {
      this.spatialGrid.insert(this.bigMeteor)
    }
  }

  private renderSystems() {
    // Рендеринг всех систем
    for (const system of this.systems.values()) {
      system.render(this, this.renderer)
    }
  }
}

