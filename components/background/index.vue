<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Simulation } from './simulation'
import { economy, costs, buyUpgrade } from './economy'

interface Props {
  showUI?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showUI: true
})

const canvasRef = ref<HTMLCanvasElement | null>(null)

let sim: Simulation | null = null
let animationFrameId: number

const handleResize = (): void => { sim?.resize() }
const handleMouseMove = (e: MouseEvent) => { if(sim) { sim.mouse.x = e.clientX; sim.mouse.y = e.clientY } }
const handleMouseDown = () => { if(sim) sim.mouse.down = true }
const handleMouseUp = () => { if(sim) sim.mouse.down = false }

const loop = () => {
  sim?.update()
  animationFrameId = requestAnimationFrame(loop)
}

onMounted(() => {
  if (canvasRef.value) {
    sim = new Simulation(canvasRef.value)
    loop()
    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mousedown', handleMouseDown)
  window.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div class="fixed inset-0 bg-[#0a0a0a] overflow-hidden font-mono text-white select-none">
    <!-- Канвас на фоне -->
    <canvas ref="canvasRef" class="absolute inset-0 block pointer-events-auto" style="z-index: 0;"></canvas>

    <!-- Баланс (слева вверху) -->
    <Transition name="balance-fade">
      <div v-if="!showUI" class="absolute top-0 left-0 p-6 z-10 pointer-events-none">
        <div class="text-4xl font-bold text-yellow-400 drop-shadow-md">
          {{ Math.floor(economy.coins) }}$
        </div>
      </div>
    </Transition>

    <!-- UI СЛОЙ (справа вверху) -->
    <Transition name="shop-fade">
      <div v-if="!showUI" class="absolute top-[60px] right-0 p-6 flex flex-col items-end space-y-4 z-10 pointer-events-none shop-container">

      <!-- Магазин (включаем pointer-events для кнопок) -->
      <div class="flex flex-col space-y-2 pointer-events-auto">

        <!-- Кнопка покупки корабля -->
        <button
          @click="buyUpgrade('ship')"
          class="group relative px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="economy.coins < costs.ship"
        >
          <div class="flex justify-between items-center w-48">
            <span class="text-sm text-gray-300 group-hover:text-white">Add Ship</span>
            <span class="text-yellow-400 text-xs">{{ costs.ship }}$</span>
          </div>
          <div class="text-[10px] text-gray-500 text-right">Count: {{ economy.shipsCount }}</div>
        </button>

        <!-- Урон -->
        <button
          @click="buyUpgrade('damage')"
          class="group px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
          :disabled="economy.coins < costs.damage"
        >
          <div class="flex justify-between items-center w-48">
            <span class="text-sm text-gray-300 group-hover:text-white">Damage</span>
            <span class="text-yellow-400 text-xs">{{ costs.damage }}$</span>
          </div>
          <div class="text-[10px] text-gray-500 text-right">Lvl: {{ economy.damageLevel }}</div>
        </button>

        <!-- Здоровье -->
        <button
          @click="buyUpgrade('hull')"
          class="group px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
          :disabled="economy.coins < costs.hull"
        >
          <div class="flex justify-between items-center w-48">
            <span class="text-sm text-gray-300 group-hover:text-white">Hull HP</span>
            <span class="text-yellow-400 text-xs">{{ costs.hull }}$</span>
          </div>
          <div class="text-[10px] text-gray-500 text-right">Lvl: {{ economy.hullLevel }}</div>
        </button>

        <!-- Скорость стрельбы -->
        <button
          @click="buyUpgrade('turret')"
          class="group px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
          :disabled="economy.coins < costs.turret"
        >
          <div class="flex justify-between items-center w-48">
            <span class="text-sm text-gray-300 group-hover:text-white">Fire Rate</span>
            <span class="text-yellow-400 text-xs">{{ costs.turret }}$</span>
          </div>
          <div class="text-[10px] text-gray-500 text-right">Lvl: {{ economy.turretSpeed }}</div>
        </button>

        <!-- Divider -->
        <div class="h-px bg-white/10 my-2"></div>

        <!-- Щит -->
        <button
          @click="buyUpgrade('shield')"
          class="group px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
          :disabled="economy.coins < costs.shield"
        >
          <div class="flex justify-between items-center w-48">
            <span class="text-sm text-blue-400 group-hover:text-blue-300">Shield Gen</span>
            <span class="text-yellow-400 text-xs">{{ costs.shield }}$</span>
          </div>
          <div class="text-[10px] text-gray-500 text-right">Max: {{ economy.shieldLevel * 5 }}</div>
        </button>

        <!-- Крит -->
        <button
          @click="buyUpgrade('crit')"
          class="group px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
          :disabled="economy.coins < costs.crit"
        >
          <div class="flex justify-between items-center w-48">
            <span class="text-sm text-red-400 group-hover:text-red-300">Crit Chance</span>
            <span class="text-yellow-400 text-xs">{{ costs.crit }}$</span>
          </div>
          <div class="text-[10px] text-gray-500 text-right">Chance: {{ economy.critLevel * 5 }}%</div>
        </button>

        <!-- Реген -->
        <button
          @click="buyUpgrade('regen')"
          class="group px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
          :disabled="economy.coins < costs.regen"
        >
          <div class="flex justify-between items-center w-48">
            <span class="text-sm text-green-400 group-hover:text-green-300">Nanobots</span>
            <span class="text-yellow-400 text-xs">{{ costs.regen }}$</span>
          </div>
          <div class="text-[10px] text-gray-500 text-right">Lvl: {{ economy.regenLevel }}</div>
        </button>

        <!-- Магнит -->
        <button
          @click="buyUpgrade('magnet')"
          class="group px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50"
          :disabled="economy.coins < costs.magnet"
        >
          <div class="flex justify-between items-center w-48">
            <span class="text-sm text-purple-400 group-hover:text-purple-300">Magnet</span>
            <span class="text-yellow-400 text-xs">{{ costs.magnet }}$</span>
          </div>
          <div class="text-[10px] text-gray-500 text-right">Range: {{ 500 + (economy.magnetLevel-1)*150 }}</div>
        </button>

      </div>

      <div class="text-[10px] text-gray-600 pt-4">
        Hold Click: Warp Drive<br>
        Killing Serpents gives $$$
      </div>

      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Анимация появления кнопок магазина */
.shop-fade-enter-active {
  transition: all 0.4s ease-out;
}

.shop-fade-leave-active {
  transition: all 0.3s ease-in;
}

.shop-fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.shop-fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.shop-fade-enter-to,
.shop-fade-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* Staggered animation для кнопок */
.shop-container > div > button {
  animation: slideInRight 0.5s ease-out backwards;
}

.shop-container > div > button:nth-child(1) {
  animation-delay: 0.05s;
}

.shop-container > div > button:nth-child(2) {
  animation-delay: 0.1s;
}

.shop-container > div > button:nth-child(3) {
  animation-delay: 0.15s;
}

.shop-container > div > button:nth-child(4) {
  animation-delay: 0.2s;
}

.shop-container > div > button:nth-child(5) {
  animation-delay: 0.25s;
}

.shop-container > div > button:nth-child(6) {
  animation-delay: 0.3s;
}

.shop-container > div > button:nth-child(7) {
  animation-delay: 0.35s;
}

.shop-container > div > button:nth-child(8) {
  animation-delay: 0.4s;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Анимация появления баланса */
.balance-fade-enter-active {
  transition: all 0.4s ease-out;
}

.balance-fade-leave-active {
  transition: all 0.3s ease-in;
}

.balance-fade-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.balance-fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.balance-fade-enter-to,
.balance-fade-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>

