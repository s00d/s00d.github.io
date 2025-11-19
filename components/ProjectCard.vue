<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMouseInElement } from '@vueuse/core'

const props = defineProps<{
  project: {
    name: string
    description: string
    stars: number
    language: string
    url: string
    topics: string[]
  },
  index: number // Для анимации задержки появления
}>()

const target = ref(null)
const { elementX, elementY, isOutside, elementHeight, elementWidth } = useMouseInElement(target)

const cardTransform = computed(() => {
  if (isOutside.value) return ''
  
  const MAX_ROTATION = 6
  
  const rX = (MAX_ROTATION / 2 - (elementY.value / elementHeight.value) * MAX_ROTATION).toFixed(2) // Rotate X
  const rY = ((elementX.value / elementWidth.value) * MAX_ROTATION - MAX_ROTATION / 2).toFixed(2) // Rotate Y
  
  return `perspective(1000px) rotateX(${rX}deg) rotateY(${rY}deg) scale(1.02)`
})

const langColors: Record<string, string> = {
  TypeScript: 'text-blue-400',
  Vue: 'text-green-400',
  Python: 'text-yellow-400',
  PHP: 'text-purple-400',
  JavaScript: 'text-yellow-300',
  Go: 'text-cyan-400',
  HTML: 'text-orange-400',
  CSS: 'text-blue-300'
}
</script>

<template>
  <a 
    :href="project.url" 
    target="_blank"
    ref="target"
    :style="{ 
      transform: cardTransform,
      transition: isOutside ? 'transform 0.5s ease' : 'none',
      animationDelay: `${index * 50}ms` 
    }"
    class="project-card group relative flex flex-col justify-between p-6 bg-surface/40 backdrop-blur-sm border border-white/5 rounded-2xl hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:bg-surface/60 animate-slide-up opacity-0"
  >
    <!-- Shine Effect -->
    <div class="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-white/5 to-transparent"></div>

    <div class="relative z-10">
      <div class="flex justify-between items-start mb-4">
        <div class="p-2 bg-white/5 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
          <Icon name="lucide:folder-git-2" class="w-6 h-6 text-gray-300 group-hover:text-primary" />
        </div>
        <div class="flex items-center space-x-1 text-gray-400 bg-black/20 px-2 py-1 rounded-full">
          <Icon name="lucide:star" class="w-3.5 h-3.5" />
          <span class="text-xs font-mono font-bold">{{ project.stars }}</span>
        </div>
      </div>

      <h3 class="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
        {{ project.name }}
      </h3>
      
      <p class="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-3 h-[4.5em]">
        {{ project.description || 'No description provided' }}
      </p>

      <!-- Topics (Chips) -->
      <div class="flex flex-wrap gap-2 mb-4 h-6 overflow-hidden">
        <span v-for="topic in project.topics.slice(0, 3)" :key="topic" class="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
          {{ topic }}
        </span>
      </div>
    </div>

    <div class="relative z-10 flex items-center justify-between mt-auto border-t border-white/5 pt-4">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full" :class="project.language === 'Vue' ? 'bg-green-500' : project.language === 'TypeScript' ? 'bg-blue-500' : 'bg-gray-500'"></span>
        <span class="text-xs font-mono" :class="langColors[project.language] || 'text-gray-400'">
          {{ project.language || 'Code' }}
        </span>
      </div>
      <Icon name="lucide:arrow-up-right" class="w-4 h-4 text-gray-500 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
    </div>
  </a>
</template>

<style scoped>
.project-card {
  will-change: transform;
  /* Начальное состояние для анимации появления */
  animation-fill-mode: forwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation-name: slideUp;
  animation-duration: 0.6s;
  animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
}
</style>
