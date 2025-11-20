// Состояния корабля
export const SHIP_STATE = {
  ROAM: 'ROAM',
  DOGFIGHT: 'DOGFIGHT',
  PANIC: 'PANIC',
  RETURN: 'RETURN'
} as const

// Типы целей
export const TARGET_TYPE = {
  SERPENT: 'SERPENT',
  SHIP: 'SHIP',
  POINT: 'POINT',
  POWERUP: 'POWERUP'
} as const

// Боевые маневры
export const COMBAT_MANEUVERS = {
  CHARGE: 'CHARGE',
  FLANK: 'FLANK',
  RETREAT: 'RETREAT'
} as const

// Типы снарядов
export const PROJECTILE_TYPE = {
  NORMAL: 'NORMAL',
  MISSILE: 'MISSILE',
  PLASMA: 'PLASMA',
  FLAK: 'FLAK',
  WAVE: 'WAVE',
  BOMB: 'BOMB'
} as const

