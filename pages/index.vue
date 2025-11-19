<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Получаем данные с нашего API (при генерации будет сохранен в статический файл)
const { data: projects, pending } = await useFetch('/api/projects.json', {
  default: () => [] as Array<{
    id: number
    name: string
    description: string | null
    stars: number
    forks: number
    language: string | null
    url: string
    homepage: string | null
    topics: string[]
  }>
})

const links = [
  { name: 'GitHub', url: 'https://github.com/s00d', icon: 'lucide:github' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/s00d/', icon: 'lucide:linkedin' },
  { name: 'Telegram', url: 'tg://resolve?domain=is_s00d', icon: 'lucide:send' },
  { name: 'Email', url: 'mailto:Virus191288@gmail.com', icon: 'lucide:mail' }
]

// Typewriter Effect
const typewriterText = ref('')
const fullText = "Backend & Frontend Developer building useful things."
const isTyping = ref(true)

// Состояние видимости интерфейса
const showUI = ref(true)
const toggleUI = () => {
  showUI.value = !showUI.value
}

onMounted(() => {
  let i = 0
  const typeInterval = setInterval(() => {
    if (i < fullText.length) {
      typewriterText.value += fullText.charAt(i)
      i++
    } else {
      clearInterval(typeInterval)
      isTyping.value = false
    }
  }, 50) // Скорость печати
})
</script>

<template>
  <div class="min-h-screen text-white relative selection:bg-primary selection:text-white overflow-x-hidden">
    <Background :showUI="showUI" />

    <!-- Кнопка переключения интерфейса -->
    <button
      @click="toggleUI"
      class="fixed top-4 right-4 z-50 w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-110 group"
      :title="showUI ? 'Скрыть интерфейс' : 'Показать интерфейс'"
    >
      <Icon
        :name="showUI ? 'lucide:eye-off' : 'lucide:eye'"
        class="w-5 h-5 text-white group-hover:text-primary transition-colors"
      />
    </button>

    <div v-show="showUI" class="relative z-10">
      <main class="container mx-auto px-6 py-24 max-w-7xl">

        <!-- Hero Section -->
        <header class="mb-32 max-w-3xl">
          <div class="animate-fade-in-down">
            <span class="inline-block px-3 py-1 mb-6 text-xs font-mono font-medium tracking-wider text-primary bg-primary/10 rounded-full border border-primary/20">
              HELLO, WORLD
            </span>

            <h1 class="text-6xl md:text-8xl font-bold mb-8 tracking-tight leading-tight">
              Pavel
              <span class="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
                Kuz'min
              </span>
            </h1>
          </div>

          <h2 class="text-2xl md:text-3xl text-gray-400 mb-10 font-light h-20 md:h-auto">
            <span class="text-white">{{ typewriterText }}</span>
            <span v-if="isTyping" class="animate-blink">|</span>
          </h2>

          <!-- Social Links -->
          <div class="flex flex-wrap gap-4 animate-fade-in-up" style="animation-delay: 300ms;">
            <a v-for="link in links" :key="link.name" :href="link.url" target="_blank"
               class="group flex items-center space-x-2 px-5 py-3 bg-surface/50 backdrop-blur-md rounded-full hover:bg-white/10 border border-white/10 hover:border-primary/50 transition-all duration-300 hover:scale-105">
              <Icon :name="link.icon" class="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
              <span class="font-medium">{{ link.name }}</span>
            </a>
          </div>
        </header>

        <!-- Projects Section -->
        <section>
          <div class="flex items-end justify-between mb-12 border-b border-white/10 pb-4">
            <div>
              <h2 class="text-3xl font-bold flex items-center gap-3 mb-2">
                <Icon name="lucide:code-2" class="text-primary" />
                Selected Projects
              </h2>
              <p class="text-gray-400 text-sm">Open source contributions and personal labs</p>
            </div>
            <a href="https://github.com/s00d?tab=repositories" target="_blank" class="hidden md:flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group">
              View all on GitHub
              <Icon name="lucide:arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Skeletons -->
            <div v-for="i in 6" :key="i" class="h-64 bg-white/5 rounded-2xl animate-pulse border border-white/5"></div>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 perspective-grid">
            <ProjectCard
              v-for="(p, index) in projects"
              :key="p.id"
              :project="p"
              :index="index"
            />
          </div>

          <div class="mt-12 text-center md:hidden">
             <a href="https://github.com/s00d?tab=repositories" target="_blank" class="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-6 py-3 rounded-full">
              View all on GitHub
              <Icon name="lucide:arrow-right" class="w-4 h-4" />
            </a>
          </div>
        </section>

        <footer class="mt-40 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-gray-500 text-sm">
          <p>&copy; {{ new Date().getFullYear() }} Pavel Kuz'min.</p>
          <p class="mt-2 md:mt-0 flex items-center gap-2">
            Built with <Icon name="logos:nuxt-icon" class="w-4 h-4 grayscale opacity-50" /> Nuxt 3 & Tailwind
          </p>
        </footer>
      </main>
    </div>
  </div>
</template>

<style>
/* Глобальные анимации для страницы */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.animate-blink {
  animation: blink 1s step-end infinite;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
  opacity: 0;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-down {
  animation: fadeInDown 0.8s ease-out forwards;
}

.perspective-grid {
  perspective: 1000px;
}
</style>
