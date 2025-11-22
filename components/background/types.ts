import { SHIP_STATE, PROJECTILE_TYPE } from './constants/states'

export enum BHState { STABLE, UNSTABLE, EXPLODING, REFORMING }
export type ShipState = typeof SHIP_STATE[keyof typeof SHIP_STATE]
export type ProjectileType = typeof PROJECTILE_TYPE[keyof typeof PROJECTILE_TYPE]
export type PowerUpType =
  // Статы
  | 'SPEED_BOOST' | 'DAMAGE_BOOST' | 'RAPID_FIRE' | 'HEAL' | 'SLOW_DOWN' | 'WEAPON_JAM'
  // Размер (НОВОЕ)
  | 'SIZE_UP' | 'SIZE_DOWN'
  // Оружие
  | 'GET_MINIGUN' | 'GET_SHOTGUN' | 'GET_RAILGUN' | 'GET_MISSILE' | 'GET_PLASMA' | 'GET_FLAK' | 'GET_WAVE' | 'GET_SNIPER'
  // Улучшения
  | 'GET_SHIELD' | 'GET_TELEPORT' | 'UPGRADE_BOMB' | 'UPGRADE_RANGE'
  // Монета
  | 'COIN'
export type Effect = { type: PowerUpType; timer: number }

/**
 * Конфигурация игры
 */
export interface GameConfig {
  POINT_COUNT: number
  MAX_METEORS: number
  GRAVITY_RADIUS_BASE: number
  START_RADIUS: number
  CRITICAL_MASS: number
  MASS_GAIN_METEOR: number
  MASS_GAIN_SHIP: number
  BOMB_DAMAGE: number
  SHIP_COUNT: number
  SHIP_SPEED: number
  SHIP_TURN_SPEED: number
  SHIP_SEPARATION: number
  SHIP_ENGAGEMENT_DIST: number
  POWERUP_RATE: number
  POWERUP_DURATION: number
  SIZE_MODIFIER_BIG: number
  SIZE_MODIFIER_SMALL: number
  MAX_TRAIL_LENGTH: number
  MAX_BIG_METEOR_TRAIL: number
  MAX_MISSILE_TRAIL: number
  MAX_SERPENT_SEGMENTS: number
  COLORS: {
    primary: string
    secondary: string
    danger: string
    repel: string
    shipEngines: string
    white: string
    bg: string
    bomb: string
    buff: string
    debuff: string
    shield: string
  }
}

/**
 * Типы для систем
 */
export type EntitySystemType = 'serpent' | 'ship' | 'meteor' | 'projectile' | 'powerUp' | 'particle' | 'floatingText' | 'shockwave'

/**
 * Конфигурация пула
 */
export interface PoolConfig {
  initialSize: number
  maxSize: number
}
