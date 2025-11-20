import { Entity } from './Entity'
import { CONFIG } from '../config'
import type { PowerUpType } from '../types'
import { MathUtils } from '../utils/math'
import type { Simulation } from '../simulation'
import { PowerUpFactory } from '../factories/PowerUpFactory'

export class PowerUp extends Entity {
  type: PowerUpType
  isGood: boolean
  life: number = 1200 // Бонус исчезнет сам через 20 сек, если не подобрать
  pulse: number = 0

  constructor(x: number, y: number) {
    // Генерируем тип через фабрику
    const { type, isGood } = PowerUpFactory.generateType()

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

