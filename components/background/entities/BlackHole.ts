import { Entity } from './Entity'
import { CONFIG } from '../config'
import { BHState } from '../types'
import type { Simulation } from '../simulation'
import type { BlackHoleState } from './blackhole/BlackHoleState'
import { StableState } from './blackhole/StableState'
import { UnstableState } from './blackhole/UnstableState'
import { ExplodingState } from './blackhole/ExplodingState'
import { ReformingState } from './blackhole/ReformingState'
import { economy } from '../economy'

export class BlackHole extends Entity {
  mass: number = 0
  radius: number = CONFIG.START_RADIUS
  visualRadius: number = CONFIG.START_RADIUS
  pulse: number = 0
  state: BHState = BHState.STABLE
  shake: number = 0
  shockwaveRadius: number = 0
  safetyTimer: number = 0
  darkMatterTimer: number = 0 // Таймер для начисления черной материи

  // Улучшения черной дыры (покупаются автоматически за darkMatter)
  upgrades = {
    serpentBaseCost: 0,      // Уменьшение базовой стоимости змеи
    serpentHealth: 0,         // Здоровье змеи
    serpentSpeed: 0,          // Скорость змеи
    serpentDamage: 0,         // Урон змеи
    balanceRate: 0            // Скорость накопления darkMatter
  }

  // Дебаффы черной дыры (покупаются игроком за coins)
  debuffs = {
    serpentCost: 0,          // Увеличение базовой стоимости змей (+50 за уровень)
    balanceRate: 0,          // Уменьшение скорости накопления darkMatter (-10 за уровень)
    darkMatterRate: 0        // Уменьшение скорости накопления darkMatter (-5 за уровень)
  }

  private currentState: BlackHoleState = new StableState()
  private states: Map<BHState, BlackHoleState> = new Map([
    [BHState.STABLE, new StableState()],
    [BHState.UNSTABLE, new UnstableState()],
    [BHState.EXPLODING, new ExplodingState()],
    [BHState.REFORMING, new ReformingState()]
  ])

  constructor(x: number, y: number) {
    super(x, y, '#000000')
  }

  /**
   * Устанавливает состояние черной дыры
   */
  setState(newState: BHState): void {
    this.state = newState
    this.currentState = this.states.get(newState) || new StableState()
  }

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

    // Начисление черной материи каждую секунду (базовая +100, +50 за каждый уровень balanceRate, -10 за каждый уровень debuff, -5 за каждый уровень darkMatterRate debuff)
    this.darkMatterTimer++
    if (this.darkMatterTimer >= 60) { // 60 кадров = 1 секунда при 60fps
      const baseRate = 100
      const upgradeBonus = this.upgrades.balanceRate * 50
      const balanceRateDebuffPenalty = this.debuffs.balanceRate * 10
      const darkMatterRateDebuffPenalty = this.debuffs.darkMatterRate * 5
      economy.darkMatter += Math.max(0, baseRate + upgradeBonus - balanceRateDebuffPenalty - darkMatterRateDebuffPenalty)
      this.darkMatterTimer = 0
    }

    // Делегируем обновление текущему состоянию
    this.currentState.update(this, sim)
  }
}

