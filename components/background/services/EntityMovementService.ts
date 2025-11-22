import type { Simulation } from '../simulation'
import type { Ship } from '../entities/Ship'
import type { VoidSerpent } from '../entities/VoidSerpent'
import { CONFIG } from '../config'
import { MathUtils } from '../utils/math'
import { Navigator } from '../utils/navigator'
import { SHIP_STATE } from '../constants/states'

/**
 * Универсальный сервис для движения кораблей и призраков
 */
export class EntityMovementService {
  /**
   * Применяет движение к кораблю
   */
  static applyShipMovement(
    ship: Ship,
    desiredAngle: number,
    engineThrust: number,
    sim: Simulation
  ): void {
    // Обновление таймеров
    ship.cooldown--
    ship.bombCooldown--

    // Поворот к желаемому углу
    let diff = MathUtils.normalizeAngle(desiredAngle - ship.angle)
    const turnSpeed = ship.state === SHIP_STATE.DOGFIGHT ? CONFIG.SHIP_TURN_SPEED * 2.0 : CONFIG.SHIP_TURN_SPEED
    ship.angle += Math.sign(diff) * Math.min(Math.abs(diff), turnSpeed)

    // Применение тяги двигателя
    ship.vx += Math.cos(ship.angle) * engineThrust
    ship.vy += Math.sin(ship.angle) * engineThrust

    // Трение
    ship.vx *= 0.96
    ship.vy *= 0.96

    // Ограничение максимальной скорости
    const speed = Math.hypot(ship.vx, ship.vy)
    const maxSpeed = (ship.state === SHIP_STATE.PANIC ? CONFIG.SHIP_SPEED * 2 : CONFIG.SHIP_SPEED) * ship.speedMult
    if (speed > maxSpeed) {
      ship.vx = (ship.vx / speed) * maxSpeed
      ship.vy = (ship.vy / speed) * maxSpeed
    }

    ship.thrustPower = engineThrust

    // Обновление позиции с учетом warpFactor
    const warpMult = sim.warpFactor > 1.1 ? sim.warpFactor * 0.7 : 1
    ship.x += ship.vx * warpMult
    ship.y += ship.vy * warpMult

    // Wrap (выход за границы экрана)
    const m = 30
    if (ship.x < -m) ship.x = sim.width + m
    else if (ship.x > sim.width + m) ship.x = -m
    if (ship.y < -m) ship.y = sim.height + m
    else if (ship.y > sim.height + m) ship.y = -m
  }

  /**
   * Применяет движение к призраку
   */
  static applySerpentMovement(
    serpent: VoidSerpent,
    angle: number,
    speed: number,
    sim: Simulation
  ): void {
    // Обновляем угол
    serpent.angle = angle

    // Избегание большого метеорита
    if (sim.bigMeteor) {
      const avoidRadius = sim.bigMeteor.size + 150 // Радиус избегания для призрака
      const avoidRadiusSq = avoidRadius * avoidRadius
      const distToBigMeteorSq = MathUtils.distSq(serpent, sim.bigMeteor)
      if (distToBigMeteorSq < avoidRadiusSq && distToBigMeteorSq > 0) {
        const distToBigMeteor = Math.sqrt(distToBigMeteorSq)
        const avoidAngle = MathUtils.angle(sim.bigMeteor, serpent) // Угол от метеорита к призраку
        const avoidForce = (1 - distToBigMeteor / avoidRadius) * 1.5 // Сила отталкивания
        // Применяем силу избегания к скорости
        const avoidVx = Math.cos(avoidAngle) * avoidForce
        const avoidVy = Math.sin(avoidAngle) * avoidForce
        // Добавляем к углу движения
        const currentAngle = Math.atan2(Math.sin(serpent.angle) * speed + avoidVy, Math.cos(serpent.angle) * speed + avoidVx)
        serpent.angle = currentAngle
      }
    }

    // Обновляем скорость
    serpent.speed = speed

    // Движение головы
    serpent.x += Math.cos(serpent.angle) * serpent.speed
    serpent.y += Math.sin(serpent.angle) * serpent.speed
  }

  /**
   * Обновляет сегменты призрака
   */
  static updateSerpentSegments(serpent: VoidSerpent, sim: Simulation): void {
    // Добавляем сегменты (с учетом размера!)
    // Чем больше змея, тем "шире" волна
    const wobble = Math.sin(Date.now() * 0.005 + serpent.wobbleOffset) * (3 * serpent.sizeMult)
    const nextX = serpent.x + Math.cos(serpent.angle + Math.PI / 2) * wobble
    const nextY = serpent.y + Math.sin(serpent.angle + Math.PI / 2) * wobble
    serpent.segments.unshift({ x: nextX, y: nextY })

    // Длина хвоста тоже зависит от размера (с ограничением)
    const maxSegments = Math.min(CONFIG.MAX_SERPENT_SEGMENTS * serpent.sizeMult, 80) // Максимум 80 сегментов
    if (serpent.segments.length > maxSegments) {
      serpent.segments.pop()
    }
  }

  /**
   * Применяет избегание союзников для корабля
   */
  static applyShipAvoidance(ship: Ship, sim: Simulation): void {
    const push = Navigator.getAvoidanceVector(ship, sim.ships.getAll(), CONFIG.SHIP_SEPARATION)
    ship.vx += push.x * 0.5
    ship.vy += push.y * 0.5
  }

  /**
   * Применяет избегание большого метеорита для корабля
   */
  static applyShipBigMeteorAvoidance(ship: Ship, sim: Simulation): void {
    if (sim.bigMeteor) {
      const avoidRadius = sim.bigMeteor.size + 100 // Радиус избегания
      const avoidRadiusSq = avoidRadius * avoidRadius
      const distToBigMeteorSq = MathUtils.distSq(ship, sim.bigMeteor)
      if (distToBigMeteorSq < avoidRadiusSq && distToBigMeteorSq > 0) {
        const distToBigMeteor = Math.sqrt(distToBigMeteorSq)
        const avoidAngle = MathUtils.angle(sim.bigMeteor, ship) // Угол от метеорита к кораблю
        const avoidForce = (1 - distToBigMeteor / avoidRadius) * 2.0 // Сила отталкивания
        ship.vx += Math.cos(avoidAngle) * avoidForce
        ship.vy += Math.sin(avoidAngle) * avoidForce
      }
    }
  }
}

