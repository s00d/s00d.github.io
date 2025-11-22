import type { GameConfig } from './types'

export const CONFIG: GameConfig = {
  POINT_COUNT: 60,
  MAX_METEORS: 20,
  GRAVITY_RADIUS_BASE: 700,

  START_RADIUS: 20,
  CRITICAL_MASS: 300,
  MASS_GAIN_METEOR: 2.0,
  MASS_GAIN_SHIP: 10.0,
  BOMB_DAMAGE: 6.0,

  SHIP_COUNT: 4,
  SHIP_SPEED: 4.0,          // Чуть быстрее
  SHIP_TURN_SPEED: 0.12,    // Резче поворачивают
  SHIP_SEPARATION: 80,
  SHIP_ENGAGEMENT_DIST: 600, // Видят врагов намного дальше (было 300)

  POWERUP_RATE: 0.015, // Шанс появления бонуса (примерно раз в секунду)
  POWERUP_DURATION: 600, // Длительность эффекта (10 сек при 60fps)

  // Добавим настройки размера
  SIZE_MODIFIER_BIG: 1.8,
  SIZE_MODIFIER_SMALL: 0.6,

  // Ограничения для трейлов
  MAX_TRAIL_LENGTH: 30,        // Максимальная длина трейла для метеоритов
  MAX_BIG_METEOR_TRAIL: 30,    // Максимальная длина трейла для большого метеорита
  MAX_MISSILE_TRAIL: 15,       // Максимальная длина трейла для ракет
  MAX_SERPENT_SEGMENTS: 40,    // Базовое максимальное количество сегментов змеи


  COLORS: {
    primary: '#8b5cf6', secondary: '#06b6d4', danger: '#f43f5e',
    repel: '#f59e0b', shipEngines: '#facc15', white: '#ffffff', bg: '#0a0a0a',
    bomb: '#ef4444',
    buff: '#10b981', // Green
    debuff: '#a855f7', // Purple
    shield: '#3b82f6' // Цвет щита
  }
}

