import type { Simulation } from '../simulation'
import type { BigMeteor } from '../entities/BigMeteor'
import { CONFIG } from '../config'
import { MathUtils } from '../utils/math'
import { BHState } from '../types'
import { economy } from '../economy'
import { EffectSpawnService } from './EffectSpawnService'
import { GravityService } from './GravityService'
import type { BlackHole } from '../entities/BlackHole'

/**
 * Сервис для физики большого метеорита
 * Отвечает за гравитацию, движение, вращение и трейл
 */
export class MeteorPhysicsService {
  /**
   * Применяет физику к большому метеориту
   */
  static applyPhysics(meteor: BigMeteor, sim: Simulation): void {
    const bh = sim.blackHole
    const distSq = MathUtils.distSq(meteor, bh)
    const distToBH = Math.sqrt(distSq)
    const angle = MathUtils.angle(meteor, bh)

    // Центр экрана
    const centerX = sim.width / 2
    const centerY = sim.height / 2
    const angleToCenter = MathUtils.angle(meteor, { x: centerX, y: centerY })

    // 1. Сначала применяем силы (Гравитация/Взрыв)
    if (bh.state === BHState.EXPLODING) {
      // Уничтожение от ударной волны
      if (GravityService.shouldDieFromShockwave(meteor, bh)) {
        EffectSpawnService.createExplosion(meteor.x, meteor.y, 20, meteor.color, sim)
        meteor.markedForDeletion = true
        return
      }
      
      // Взрывная волна - ограничиваем изменение скорости, чтобы не полетел в обратную сторону
      const shockwaveRadiusMinSq = (bh.shockwaveRadius - 100) * (bh.shockwaveRadius - 100)
      const shockwaveRadiusMaxSq = (bh.shockwaveRadius + 50) * (bh.shockwaveRadius + 50)
      if (distSq < shockwaveRadiusMaxSq && distSq > shockwaveRadiusMinSq) {
        const force = 2.0 // Уменьшили силу
        const newVx = meteor.vx - Math.cos(angle) * force
        const newVy = meteor.vy - Math.sin(angle) * force

        // Проверяем, не изменилось ли направление слишком сильно
        const currentSpeed = Math.sqrt(meteor.vx * meteor.vx + meteor.vy * meteor.vy)
        const newSpeed = Math.sqrt(newVx * newVx + newVy * newVy)
        const dotProduct = (meteor.vx * newVx + meteor.vy * newVy) / (currentSpeed * newSpeed + 0.001)

        // Применяем изменение только если направление не изменилось слишком сильно (cos > 0.5)
        if (dotProduct > 0.5 || currentSpeed < 0.5) {
          meteor.vx = newVx
          meteor.vy = newVy
        }
      }
    } else {
      // ДВИЖЕНИЕ К ЦЕНТРУ ЭКРАНА
      // Корректируем направление к центру экрана (небольшая коррекция для поддержания курса)
      const currentSpeed = Math.sqrt(meteor.vx * meteor.vx + meteor.vy * meteor.vy)
      if (currentSpeed > 0.1) {
        const correctionFactor = 0.05 // Небольшая коррекция направления
        const targetVx = Math.cos(angleToCenter) * currentSpeed
        const targetVy = Math.sin(angleToCenter) * currentSpeed
        meteor.vx = meteor.vx * (1 - correctionFactor) + targetVx * correctionFactor
        meteor.vy = meteor.vy * (1 - correctionFactor) + targetVy * correctionFactor
      }

      // Поглощение - большой метеорит добавляет x3 массу
      const visualRadiusSq = bh.visualRadius * bh.visualRadius
      if (bh.safetyTimer === 0 && distSq < visualRadiusSq) {
        EffectSpawnService.createExplosion(meteor.x, meteor.y, 15, meteor.color, sim)
        bh.mass += CONFIG.MASS_GAIN_METEOR * 3
        // Добавляем черную материю за поглощение большого метеорита
        economy.darkMatter += 500 // Большой метеорит дает 500 темной материи
        meteor.markedForDeletion = true
        return
      }

      // Гравитация ОТКЛЮЧЕНА для большого метеорита - он движется с постоянной скоростью
      // Большой метеорит не притягивается гравитацией, только поглощается при касании
    }

    // 2. Применяем базовое трение (минимальное, чтобы скорость почти не менялась)
    meteor.vx *= meteor.friction
    meteor.vy *= meteor.friction

    // 3. Обновляем позицию ПОСЛЕ изменения скорости
    const warpMult = sim.warpFactor > 1.1 ? sim.warpFactor * 0.5 : 1
    meteor.x += meteor.vx * warpMult
    meteor.y += meteor.vy * warpMult

    // Вращение
    meteor.rotation += meteor.rotationSpeed * sim.warpFactor

    // Трейл (длиннее обычного)
    meteor.trail.push({ x: meteor.x, y: meteor.y })
    const maxTrail = Math.min(CONFIG.MAX_BIG_METEOR_TRAIL * sim.warpFactor, 60) // Ограничение до 60
    if (meteor.trail.length > maxTrail) {
      meteor.trail.shift()
    }
  }
}

