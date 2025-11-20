import { reactive, computed } from 'vue'

export const blackHoleUpgrades = reactive({
  // Black hole upgrade levels
  serpentBaseCost: 0,      // Serpent base cost reduction (each level -50)
  serpentHealth: 0,         // Serpent health (each level +10 HP)
  serpentSpeed: 0,          // Serpent speed (each level +0.5)
  serpentDamage: 0,         // Serpent damage (each level +0.5)
  balanceRate: 0            // Balance accumulation rate (each level +50/sec)
})

// Upgrade cost calculation (exponential growth)
export const blackHoleCosts = computed(() => {
  const calc = (base: number, mult: number, level: number) => Math.floor(base * Math.pow(mult, level))

  return {
    serpentBaseCost: calc(200, 1.5, blackHoleUpgrades.serpentBaseCost),
    serpentHealth: calc(300, 1.6, blackHoleUpgrades.serpentHealth),
    serpentSpeed: calc(250, 1.55, blackHoleUpgrades.serpentSpeed),
    serpentDamage: calc(400, 1.65, blackHoleUpgrades.serpentDamage),
    balanceRate: calc(500, 1.7, blackHoleUpgrades.balanceRate)
  }
})

// Buy upgrade
export const buyBlackHoleUpgrade = (type: keyof typeof blackHoleCosts.value, balance: number) => {
  const cost = blackHoleCosts.value[type]

  if (balance >= cost) {
    blackHoleUpgrades[type]++
    return cost
  }
  return 0
}

// Get upgrade effects
export const getBlackHoleUpgradeEffects = () => {
  return {
    serpentBaseCostReduction: blackHoleUpgrades.serpentBaseCost * 50, // -50 per level
    serpentHealthBonus: blackHoleUpgrades.serpentHealth * 10, // +10 HP per level
    serpentSpeedBonus: blackHoleUpgrades.serpentSpeed * 0.5, // +0.5 speed per level
    serpentDamageBonus: blackHoleUpgrades.serpentDamage * 0.5, // +0.5 damage per level
    balanceRateBonus: blackHoleUpgrades.balanceRate * 50 // +50/sec per level
  }
}

