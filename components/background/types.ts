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

