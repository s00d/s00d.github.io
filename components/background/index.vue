<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { Simulation } from './simulation'
import { economy, costs, buyUpgrade } from './economy'

interface Props {
  showUI?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showUI: true
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
const isShopExpanded = ref(true)

let sim: Simulation | null = null
let animationFrameId: number

const darkMatter = computed(() => economy.darkMatter)

const toggleShop = () => {
  isShopExpanded.value = !isShopExpanded.value
}

// Обработчики для предотвращения всплытия событий на canvas
const stopPropagation = (e: Event) => {
  e.stopPropagation()
}

const handleResize = (): void => { sim?.resize() }
const handleMouseMove = (e: MouseEvent) => { if(sim) { sim.mouse.x = e.clientX; sim.mouse.y = e.clientY } }
const handleMouseDown = () => { if(sim) sim.mouse.down = true }
const handleMouseUp = () => { if(sim) sim.mouse.down = false }

// Touch события для мобильных устройств
// Проверяем, что событие не на UI элементе
const isUIElement = (target: EventTarget | null): boolean => {
  if (!target || !(target instanceof HTMLElement)) return false
  return target.closest('button, .shop-container, .pointer-events-auto') !== null
}

const handleTouchStart = (e: TouchEvent) => {
  // Не обрабатываем события на UI элементах
  if (isUIElement(e.target)) return

  e.preventDefault()
  if (sim && e.touches.length > 0) {
    const touch = e.touches[0]
    if (touch) {
      sim.mouse.x = touch.clientX
      sim.mouse.y = touch.clientY
      sim.mouse.down = true
    }
  }
}

const handleTouchMove = (e: TouchEvent) => {
  // Не обрабатываем события на UI элементах
  if (isUIElement(e.target)) return

  e.preventDefault()
  if (sim && e.touches.length > 0) {
    const touch = e.touches[0]
    if (touch) {
      sim.mouse.x = touch.clientX
      sim.mouse.y = touch.clientY
    }
  }
}

const handleTouchEnd = (e: TouchEvent) => {
  // Не обрабатываем события на UI элементах
  if (isUIElement(e.target)) return

  e.preventDefault()
  if (sim) sim.mouse.down = false
}

const handleTouchCancel = (e: TouchEvent) => {
  // Не обрабатываем события на UI элементах
  if (isUIElement(e.target)) return

  e.preventDefault()
  if (sim) sim.mouse.down = false
}

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
    // Touch события для мобильных устройств
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd, { passive: false })
    window.addEventListener('touchcancel', handleTouchCancel, { passive: false })
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mousedown', handleMouseDown)
  window.removeEventListener('mouseup', handleMouseUp)
  // Touch события
  window.removeEventListener('touchstart', handleTouchStart)
  window.removeEventListener('touchmove', handleTouchMove)
  window.removeEventListener('touchend', handleTouchEnd)
  window.removeEventListener('touchcancel', handleTouchCancel)
})
</script>

<template>
  <div class="fixed inset-0 bg-[#0a0a0a] overflow-hidden font-mono text-white select-none">
    <!-- Канвас на фоне -->
    <canvas ref="canvasRef" class="absolute inset-0 block touch-none" style="z-index: 0; pointer-events: auto;"></canvas>

    <!-- Баланс (слева вверху) -->
    <Transition name="balance-fade">
      <div v-if="!showUI" class="absolute top-0 left-0 p-3 md:p-6 z-10 pointer-events-none">
        <div class="flex items-center gap-4">
          <div class="text-2xl md:text-4xl font-bold text-yellow-400 drop-shadow-md">
            {{ Math.floor(economy.coins) }}$
          </div>
          <div class="text-2xl md:text-4xl font-bold text-purple-400 drop-shadow-md">
            {{ Math.floor(darkMatter) }}⚫
          </div>
        </div>
      </div>
    </Transition>

    <!-- Кнопка сворачивания/разворачивания магазина -->
    <Transition name="shop-fade">
      <button
        v-if="!showUI"
        @click.stop="toggleShop"
        @touchstart.stop="stopPropagation"
        @touchend.stop.prevent="toggleShop"
        class="absolute top-[25px] md:top-[20px] right-[70px] md:right-[80px] z-20 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 active:bg-white/20 border border-white/20 rounded-lg transition-all duration-300 pointer-events-auto touch-manipulation group"
        :title="isShopExpanded ? 'Collapse controls' : 'Expand controls'"
      >
        <svg
          class="w-4 h-4 md:w-5 md:h-5 text-white transition-transform duration-300"
          :class="{ 'rotate-180': !isShopExpanded }"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </Transition>

    <!-- UI СЛОЙ (справа вверху) -->
    <Transition name="shop-fade">
      <div v-if="!showUI" class="absolute top-[80px] md:top-[60px] right-0 p-2 md:p-6 flex flex-col items-end space-y-2 md:space-y-4 z-10 pointer-events-none shop-container">

      <!-- Магазин (включаем pointer-events для кнопок) -->
      <Transition name="shop-expand">
        <div v-if="isShopExpanded" class="flex flex-col space-y-1 md:space-y-2 pointer-events-auto max-h-[calc(100vh-120px)] md:max-h-none overflow-y-auto pr-1 md:pr-0">

        <!-- Кнопка покупки корабля -->
        <button
          @click.stop="buyUpgrade('ship')"
          @touchstart.stop="stopPropagation"
          @touchend.stop.prevent="buyUpgrade('ship')"
          class="group relative px-2 md:px-4 py-1.5 md:py-2 bg-white/5 active:bg-white/10 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          :disabled="economy.coins < costs.ship"
        >
          <div class="flex justify-between items-center w-36 md:w-48">
            <span class="text-xs md:text-sm text-gray-300 group-hover:text-white group-active:text-white">Add Ship</span>
            <span class="text-yellow-400 text-[10px] md:text-xs">{{ costs.ship }}$</span>
          </div>
          <div class="text-[9px] md:text-[10px] text-gray-500 text-right">Count: {{ economy.shipsCount }}</div>
        </button>

        <!-- Урон -->
        <button
          @click.stop="buyUpgrade('damage')"
          @touchstart.stop="stopPropagation"
          @touchend.stop.prevent="buyUpgrade('damage')"
          class="group px-2 md:px-4 py-1.5 md:py-2 bg-white/5 active:bg-white/10 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50 touch-manipulation"
          :disabled="economy.coins < costs.damage"
        >
          <div class="flex justify-between items-center w-36 md:w-48">
            <span class="text-xs md:text-sm text-gray-300 group-hover:text-white group-active:text-white">Damage</span>
            <span class="text-yellow-400 text-[10px] md:text-xs">{{ costs.damage }}$</span>
          </div>
          <div class="text-[9px] md:text-[10px] text-gray-500 text-right">Lvl: {{ economy.damageLevel }}</div>
        </button>

        <!-- Здоровье -->
        <button
          @click.stop="buyUpgrade('hull')"
          @touchstart.stop="stopPropagation"
          @touchend.stop.prevent="buyUpgrade('hull')"
          class="group px-2 md:px-4 py-1.5 md:py-2 bg-white/5 active:bg-white/10 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50 touch-manipulation"
          :disabled="economy.coins < costs.hull"
        >
          <div class="flex justify-between items-center w-36 md:w-48">
            <span class="text-xs md:text-sm text-gray-300 group-hover:text-white group-active:text-white">Hull HP</span>
            <span class="text-yellow-400 text-[10px] md:text-xs">{{ costs.hull }}$</span>
          </div>
          <div class="text-[9px] md:text-[10px] text-gray-500 text-right">Lvl: {{ economy.hullLevel }}</div>
        </button>

        <!-- Скорость стрельбы -->
        <button
          @click.stop="buyUpgrade('turret')"
          @touchstart.stop="stopPropagation"
          @touchend.stop.prevent="buyUpgrade('turret')"
          class="group px-2 md:px-4 py-1.5 md:py-2 bg-white/5 active:bg-white/10 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50 touch-manipulation"
          :disabled="economy.coins < costs.turret"
        >
          <div class="flex justify-between items-center w-36 md:w-48">
            <span class="text-xs md:text-sm text-gray-300 group-hover:text-white group-active:text-white">Fire Rate</span>
            <span class="text-yellow-400 text-[10px] md:text-xs">{{ costs.turret }}$</span>
          </div>
          <div class="text-[9px] md:text-[10px] text-gray-500 text-right">Lvl: {{ economy.turretSpeed }}</div>
        </button>

        <!-- Divider -->
        <div class="h-px bg-white/10 my-1 md:my-2"></div>

        <!-- Щит -->
        <button
          @click.stop="buyUpgrade('shield')"
          @touchstart.stop="stopPropagation"
          @touchend.stop.prevent="buyUpgrade('shield')"
          class="group px-2 md:px-4 py-1.5 md:py-2 bg-white/5 active:bg-white/10 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50 touch-manipulation"
          :disabled="economy.coins < costs.shield"
        >
          <div class="flex justify-between items-center w-36 md:w-48">
            <span class="text-xs md:text-sm text-blue-400 group-hover:text-blue-300 group-active:text-blue-300">Shield Gen</span>
            <span class="text-yellow-400 text-[10px] md:text-xs">{{ costs.shield }}$</span>
          </div>
          <div class="text-[9px] md:text-[10px] text-gray-500 text-right">Max: {{ economy.shieldLevel * 5 }}</div>
        </button>

        <!-- Крит -->
        <button
          @click.stop="buyUpgrade('crit')"
          @touchstart.stop="stopPropagation"
          @touchend.stop.prevent="buyUpgrade('crit')"
          class="group px-2 md:px-4 py-1.5 md:py-2 bg-white/5 active:bg-white/10 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50 touch-manipulation"
          :disabled="economy.coins < costs.crit"
        >
          <div class="flex justify-between items-center w-36 md:w-48">
            <span class="text-xs md:text-sm text-red-400 group-hover:text-red-300 group-active:text-red-300">Crit Chance</span>
            <span class="text-yellow-400 text-[10px] md:text-xs">{{ costs.crit }}$</span>
          </div>
          <div class="text-[9px] md:text-[10px] text-gray-500 text-right">Chance: {{ economy.critLevel * 5 }}%</div>
        </button>

        <!-- Реген -->
        <button
          @click.stop="buyUpgrade('regen')"
          @touchstart.stop="stopPropagation"
          @touchend.stop.prevent="buyUpgrade('regen')"
          class="group px-2 md:px-4 py-1.5 md:py-2 bg-white/5 active:bg-white/10 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50 touch-manipulation"
          :disabled="economy.coins < costs.regen"
        >
          <div class="flex justify-between items-center w-36 md:w-48">
            <span class="text-xs md:text-sm text-green-400 group-hover:text-green-300 group-active:text-green-300">Nanobots</span>
            <span class="text-yellow-400 text-[10px] md:text-xs">{{ costs.regen }}$</span>
          </div>
          <div class="text-[9px] md:text-[10px] text-gray-500 text-right">Lvl: {{ economy.regenLevel }}</div>
        </button>

        <!-- Магнит -->
        <button
          @click.stop="buyUpgrade('magnet')"
          @touchstart.stop="stopPropagation"
          @touchend.stop.prevent="buyUpgrade('magnet')"
          class="group px-2 md:px-4 py-1.5 md:py-2 bg-white/5 active:bg-white/10 hover:bg-white/10 border border-white/10 rounded-lg transition-all disabled:opacity-50 touch-manipulation"
          :disabled="economy.coins < costs.magnet"
        >
          <div class="flex justify-between items-center w-36 md:w-48">
            <span class="text-xs md:text-sm text-purple-400 group-hover:text-purple-300 group-active:text-purple-300">Magnet</span>
            <span class="text-yellow-400 text-[10px] md:text-xs">{{ costs.magnet }}$</span>
          </div>
          <div class="text-[9px] md:text-[10px] text-gray-500 text-right">Range: {{ 500 + (economy.magnetLevel-1)*150 }}</div>
        </button>

        <!-- Divider -->
        <div class="h-px bg-white/10 my-1 md:my-2"></div>

        <!-- Black Hole Debuffs -->
        <div class="text-[10px] md:text-xs text-red-400 font-semibold mb-1">Black Hole Debuffs</div>

        <!-- Serpent Cost Debuff -->
        <button
          @click.stop="buyUpgrade('blackHoleSerpentCost')"
          @touchstart.stop="stopPropagation"
          @touchend.stop.prevent="buyUpgrade('blackHoleSerpentCost')"
          class="group px-2 md:px-4 py-1.5 md:py-2 bg-red-500/10 active:bg-red-500/20 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all disabled:opacity-50 touch-manipulation"
          :disabled="economy.coins < costs.blackHoleSerpentCost"
        >
          <div class="flex justify-between items-center w-36 md:w-48">
            <span class="text-xs md:text-sm text-red-300 group-hover:text-red-200 group-active:text-red-200">Increase Serpent Cost</span>
            <span class="text-yellow-400 text-[10px] md:text-xs">{{ costs.blackHoleSerpentCost }}$</span>
          </div>
          <div class="text-[9px] md:text-[10px] text-gray-500 text-right">+{{ economy.blackHoleSerpentCostDebuff * 50 }}$ base cost</div>
        </button>

        <!-- Balance Rate Debuff -->
        <button
          @click.stop="buyUpgrade('blackHoleBalanceRate')"
          @touchstart.stop="stopPropagation"
          @touchend.stop.prevent="buyUpgrade('blackHoleBalanceRate')"
          class="group px-2 md:px-4 py-1.5 md:py-2 bg-red-500/10 active:bg-red-500/20 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all disabled:opacity-50 touch-manipulation"
          :disabled="economy.coins < costs.blackHoleBalanceRate"
        >
          <div class="flex justify-between items-center w-36 md:w-48">
            <span class="text-xs md:text-sm text-red-300 group-hover:text-red-200 group-active:text-red-200">Reduce Balance Rate</span>
            <span class="text-yellow-400 text-[10px] md:text-xs">{{ costs.blackHoleBalanceRate }}$</span>
          </div>
          <div class="text-[9px] md:text-[10px] text-gray-500 text-right">-{{ economy.blackHoleBalanceRateDebuff * 10 }}$/sec</div>
        </button>

        <!-- Dark Matter Rate Debuff -->
        <button
          @click.stop="buyUpgrade('blackHoleDarkMatterRate')"
          @touchstart.stop="stopPropagation"
          @touchend.stop.prevent="buyUpgrade('blackHoleDarkMatterRate')"
          class="group px-2 md:px-4 py-1.5 md:py-2 bg-red-500/10 active:bg-red-500/20 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all disabled:opacity-50 touch-manipulation"
          :disabled="economy.coins < costs.blackHoleDarkMatterRate"
        >
          <div class="flex justify-between items-center w-36 md:w-48">
            <span class="text-xs md:text-sm text-red-300 group-hover:text-red-200 group-active:text-red-200">Reduce Dark Matter Rate</span>
            <span class="text-yellow-400 text-[10px] md:text-xs">{{ costs.blackHoleDarkMatterRate }}$</span>
          </div>
          <div class="text-[9px] md:text-[10px] text-gray-500 text-right">-{{ economy.blackHoleDarkMatterRateDebuff * 5 }}⚫/sec</div>
        </button>

        </div>
      </Transition>

      <Transition name="shop-expand">
        <div v-if="isShopExpanded" class="text-[9px] md:text-[10px] text-gray-600 pt-2 md:pt-4 text-right pointer-events-auto">
          <span class="hidden md:inline">Hold Click: Warp Drive<br></span>
          <span class="md:hidden">Hold Touch: Warp<br></span>
          Killing Serpents gives $$$
        </div>
      </Transition>

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

/* Анимация сворачивания/разворачивания магазина */
.shop-expand-enter-active {
  transition: all 0.3s ease-out;
  overflow: hidden;
}

.shop-expand-leave-active {
  transition: all 0.3s ease-in;
  overflow: hidden;
}

.shop-expand-enter-from {
  opacity: 0;
  max-height: 0;
  transform: translateX(20px);
}

.shop-expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateX(20px);
}

.shop-expand-enter-to,
.shop-expand-leave-from {
  opacity: 1;
  max-height: 1000px;
  transform: translateX(0);
}

/* Мобильная оптимизация */
@media (max-width: 768px) {
  .shop-container {
    max-width: calc(100vw - 16px);
  }

  .shop-container > div {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
  }

  .shop-container > div::-webkit-scrollbar {
    width: 4px;
  }

  .shop-container > div::-webkit-scrollbar-track {
    background: transparent;
  }

  .shop-container > div::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
}

/* Предотвращение выделения текста на мобильных */
@media (max-width: 768px) {
  button {
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    user-select: none;
  }

  canvas {
    touch-action: none;
    -ms-touch-action: none;
  }
}
</style>

