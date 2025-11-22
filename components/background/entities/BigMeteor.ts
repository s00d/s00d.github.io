import { Entity } from './Entity'
import { CONFIG } from '../config'
import { BHState } from '../types'
import { MathUtils } from '../utils/math'
import type { Simulation } from '../simulation'
import { MeteorVisualGenerator, type MeteorVisualConfig } from '../generators/MeteorVisualGenerator'
import { CollisionService } from '../services/CollisionService'
import { economy } from '../economy'
import { Ship } from './Ship'
import { VoidSerpent } from './VoidSerpent'
import { Meteor } from './Meteor'
import { DamageApplicationService } from '../services/DamageApplicationService'
import { EffectSpawnService } from '../services/EffectSpawnService'
import { MeteorPhysicsService } from '../services/MeteorPhysicsService'
import { MeteorCollisionService } from '../services/MeteorCollisionService'
import { DeathService } from '../services/DeathService'

export class BigMeteor extends Entity {
  size: number
  trail: {x: number, y: number}[] = []
  gravityFactor: number = 4.0
  friction: number = 1.0

  // Свойства большого метеорита
  rotation: number = 0
  rotationSpeed: number = 0
  hp: number = 5
  maxHp: number = 5
  visualConfig: MeteorVisualConfig

  constructor(x: number, y: number, vx: number, vy: number) {
    const color = Math.random() > 0.6 ? CONFIG.COLORS.secondary : CONFIG.COLORS.white
    super(x, y, color)

    // Большой метеорит: размер в 3 раза больше обычного
    this.size = MathUtils.randomRange(6, 15)
    this.hp = 5
    this.maxHp = 5
    this.rotationSpeed = MathUtils.randomRange(-0.05, 0.05)
    this.rotation = Math.random() * Math.PI * 2

    // Генерируем визуальную конфигурацию
    this.visualConfig = MeteorVisualGenerator.generate(this.size)

    // Замедляем скорость движения
    this.vx = vx * 0.4
    this.vy = vy * 0.4
  }

  update(sim: Simulation) {
    // Применяем физику (гравитация, движение, вращение, трейл)
    MeteorPhysicsService.applyPhysics(this, sim)

    // Если метеорит был удален при поглощении, выходим
    if (this.markedForDeletion) {
      return
    }

    // Проверяем коллизии
    MeteorCollisionService.checkCollisions(this, sim)

    // Проверка HP
    if (this.hp <= 0) {
      DeathService.handleBigMeteorDeath(this, sim)
      return
    }

    // Удаление за границами
    if (this.x < -500 || this.x > sim.width + 500 || this.y < -500 || this.y > sim.height + 500) {
      this.markedForDeletion = true
    }
  }
}

