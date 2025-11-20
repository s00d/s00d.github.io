import { reactive, computed } from 'vue'
import { CONFIG } from './config'

export const economy = reactive({
  coins: 0,

  // УРОВНИ (Начальные значения)
  shipsCount: 4,      // Старт: 4
  damageLevel: 1,     // Старт: 1
  hullLevel: 1,
  turretSpeed: 1,

  shieldLevel: 0,     // Старт: 0
  critLevel: 0,
  regenLevel: 0,
  magnetLevel: 1
})

// РАСЧЕТ СТОИМОСТИ (Экспоненциальный рост)
export const costs = computed(() => {
  // Вспомогательная функция для формулы: Base * (Multiplier ^ Level)
  const calc = (base: number, mult: number, level: number) => Math.floor(base * Math.pow(mult, level))

  return {
    // 1. КОРАБЛИ (Luxury). База 1000. Каждый след. в 2.2 раза дороже.
    // shipsCount - 4, чтобы цена за 5-й корабль была базовой
    ship: calc(1000, 2.2, economy.shipsCount - 4),

    // 2. БОЕВЫЕ (Core). База 250. Рост x1.4 (умеренный)
    damage: calc(250, 1.4, economy.damageLevel - 1),
    turret: calc(300, 1.45, economy.turretSpeed - 1),

    // 3. ВЫЖИВАНИЕ. База 200. Рост x1.35 (чуть дешевле)
    hull: calc(200, 1.35, economy.hullLevel - 1),
    shield: calc(400, 1.4, economy.shieldLevel), // shieldLevel начинается с 0

    // 4. ТЕХНОЛОГИИ (Special). База 500. Рост x1.6 (быстрый)
    crit: calc(500, 1.6, economy.critLevel),
    regen: calc(600, 1.6, economy.regenLevel),
    magnet: calc(300, 1.5, economy.magnetLevel - 1)
  }
})

export const buyUpgrade = (type: keyof typeof costs.value) => {
  const cost = costs.value[type]

  if (economy.coins >= cost) {
    economy.coins -= cost

    // Применение уровней
    if (type === 'ship') {
        economy.shipsCount++
        CONFIG.SHIP_COUNT = economy.shipsCount
    }
    else if (type === 'damage') economy.damageLevel++
    else if (type === 'hull') economy.hullLevel++
    else if (type === 'turret') economy.turretSpeed++
    else if (type === 'shield') economy.shieldLevel++
    else if (type === 'crit') economy.critLevel++
    else if (type === 'regen') economy.regenLevel++
    else if (type === 'magnet') economy.magnetLevel++
  }
}

