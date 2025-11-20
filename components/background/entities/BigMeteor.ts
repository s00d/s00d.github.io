import { Entity } from './Entity'
import { CONFIG } from '../config'
import { BHState } from '../types'
import { MathUtils } from '../utils/math'
import type { Simulation } from '../simulation'
import { MeteorVisualGenerator, type MeteorVisualConfig } from '../generators/MeteorVisualGenerator'
import { CollisionService } from '../services/CollisionService'
import { economy } from '../economy'

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
    const bh = sim.blackHole
    const dist = MathUtils.dist(this, bh)
    const angle = MathUtils.angle(this, bh)

    // Центр экрана
    const centerX = sim.width / 2
    const centerY = sim.height / 2
    const angleToCenter = MathUtils.angle(this, {x: centerX, y: centerY})

    // 1. Сначала применяем силы (Гравитация/Взрыв)
    if (bh.state === BHState.EXPLODING) {
      // Взрывная волна - ограничиваем изменение скорости, чтобы не полетел в обратную сторону
      if (dist < bh.shockwaveRadius + 50 && dist > bh.shockwaveRadius - 100) {
        const force = 2.0 // Уменьшили силу
        const newVx = this.vx - Math.cos(angle) * force
        const newVy = this.vy - Math.sin(angle) * force

        // Проверяем, не изменилось ли направление слишком сильно
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
        const newSpeed = Math.sqrt(newVx * newVx + newVy * newVy)
        const dotProduct = (this.vx * newVx + this.vy * newVy) / (currentSpeed * newSpeed + 0.001)

        // Применяем изменение только если направление не изменилось слишком сильно (cos > 0.5)
        if (dotProduct > 0.5 || currentSpeed < 0.5) {
          this.vx = newVx
          this.vy = newVy
        }
      }
    } else {
      // Корректируем направление к центру экрана (небольшая коррекция для поддержания курса)
      const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
      if (currentSpeed > 0.1) {
        const correctionFactor = 0.05 // Небольшая коррекция направления
        const targetVx = Math.cos(angleToCenter) * currentSpeed
        const targetVy = Math.sin(angleToCenter) * currentSpeed
        this.vx = this.vx * (1 - correctionFactor) + targetVx * correctionFactor
        this.vy = this.vy * (1 - correctionFactor) + targetVy * correctionFactor
      }
      // Поглощение - большой метеорит добавляет x3 массу
      if (bh.safetyTimer === 0 && dist < bh.visualRadius) {
         sim.createExplosion(this.x, this.y, 15, this.color)
         bh.mass += CONFIG.MASS_GAIN_METEOR * 3
         // Добавляем черную материю за поглощение большого метеорита
         economy.darkMatter += 500 // Большой метеорит дает 500 темной материи
         this.markedForDeletion = true
         return
      }

      // Гравитация ОТКЛЮЧЕНА для большого метеорита - он движется с постоянной скоростью
      // Большой метеорит не притягивается гравитацией, только поглощается при касании
    }

    // 2. Применяем базовое трение (минимальное, чтобы скорость почти не менялась)
    this.vx *= this.friction
    this.vy *= this.friction

    // 3. Обновляем позицию ПОСЛЕ изменения скорости
    const warpMult = sim.warpFactor > 1.1 ? sim.warpFactor * 0.5 : 1
    this.x += this.vx * warpMult
    this.y += this.vy * warpMult

    // Вращение
    this.rotation += this.rotationSpeed * sim.warpFactor

    // Трейл (длиннее обычного)
    this.trail.push({x: this.x, y: this.y})
    const maxTrail = 30 * sim.warpFactor
    if (this.trail.length > maxTrail) this.trail.shift()

    // Столкновения
    // Столкновение с кораблями
    for (const ship of sim.ships) {
      const shipRadius = ship.sizeMult * 5 // Примерный радиус корабля
      if (CollisionService.checkCircleCollision(this, ship, this.size, shipRadius)) {
        ship.takeDamage(sim, 9999)
        sim.createExplosion(ship.x, ship.y, 20, ship.color)
      }
    }

    // Столкновение с призраками
    for (const serpent of sim.serpents) {
      for (const segment of serpent.segments) {
        if (CollisionService.checkCircleCollision(this, segment, this.size, 0)) {
          serpent.takeDamage(sim, 9999)
          sim.createExplosion(segment.x, segment.y, 20, serpent.color)
          break
        }
      }
    }

    // Столкновение с другими метеоритами
    for (const other of sim.meteors) {
      if (CollisionService.checkCircleCollision(this, other, this.size, other.size)) {
        other.markedForDeletion = true
        sim.createExplosion(other.x, other.y, 10, other.color)
      }
    }

    // Проверка HP
    if (this.hp <= 0) {
      sim.createExplosion(this.x, this.y, 50, this.color)
      this.markedForDeletion = true
      return
    }

    // Удаление за границами
    if (this.x < -500 || this.x > sim.width + 500 || this.y < -500 || this.y > sim.height + 500) {
      this.markedForDeletion = true
    }
  }
}

