<script setup lang="ts">
export interface Project {
  id: number
  name: string
  description: string | null
  stars: number
  forks: number
  language: string | null
  url: string
  homepage: string | null
  topics: string[]
  pushedAt: string
}

const props = defineProps<{ project: Project, featured?: boolean, rank?: number }>()

const LANG: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Vue: '#41b883', PHP: '#777bb4', Rust: '#dea584',
  Python: '#3572a5', Go: '#00add8', HTML: '#e34c26', CSS: '#663399', Shell: '#89e051',
  Swift: '#f05138', Kotlin: '#a97bff', Ruby: '#701516',
}

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))

const updated = computed(() => {
  const days = (Date.parse(props.project.pushedAt) - Date.now()) / 864e5
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (days > -30) return rtf.format(Math.round(days), 'day')
  if (days > -365) return rtf.format(Math.round(days / 30), 'month')
  return rtf.format(Math.round(days / 365), 'year')
})
</script>

<template>
  <article
    class="group relative flex flex-col overflow-hidden rounded-2xl border border-default bg-default/85 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    :class="featured ? 'p-6' : 'p-5'"
  >
    <!-- Hover accent line -->
    <span class="absolute inset-x-0 top-0 h-px scale-x-0 bg-linear-to-r from-transparent via-primary to-transparent transition-transform duration-500 group-hover:scale-x-100" />

    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p v-if="featured" class="mb-2 font-mono text-[11px] uppercase tracking-widest text-primary">
          #{{ rank }} · {{ fmt(project.stars) }} stars
        </p>
        <h3 class="break-words font-mono font-semibold text-highlighted" :class="featured ? 'text-xl' : 'text-base'">
          <a
            :href="project.url"
            target="_blank"
            rel="noopener"
            class="transition-colors after:absolute after:inset-0 focus-visible:outline-none group-hover:text-primary"
          >{{ project.name }}</a>
        </h3>
      </div>
      <span class="grid size-8 shrink-0 place-items-center rounded-full border border-default text-dimmed transition group-hover:border-primary/50 group-hover:text-primary">
        <UIcon name="i-lucide-arrow-up-right" class="size-4 transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
      </span>
    </div>

    <p class="mt-3 text-sm leading-relaxed text-toned" :class="featured ? 'line-clamp-4' : 'line-clamp-3'">
      {{ project.description || 'No description.' }}
    </p>

    <div v-if="project.topics.length" class="mt-4 flex flex-wrap gap-1.5">
      <span
        v-for="t in project.topics.slice(0, featured ? 6 : 3)"
        :key="t"
        class="rounded-md bg-elevated px-2 py-0.5 font-mono text-[11px] text-muted"
      >{{ t }}</span>
    </div>

    <div class="min-h-5 flex-1" />
    <div class="flex items-center gap-4 border-t border-default pt-4 text-xs text-muted">
      <span v-if="project.language" class="inline-flex items-center gap-1.5">
        <span class="size-2.5 rounded-full ring-2 ring-default" :style="{ background: LANG[project.language] ?? 'var(--ui-text-dimmed)' }" />
        {{ project.language }}
      </span>
      <span class="inline-flex items-center gap-1" title="Stars"><UIcon name="i-lucide-star" class="size-3.5" />{{ fmt(project.stars) }}</span>
      <span class="inline-flex items-center gap-1" title="Forks"><UIcon name="i-lucide-git-fork" class="size-3.5" />{{ fmt(project.forks) }}</span>
      <span class="hidden truncate sm:inline">{{ updated }}</span>
      <a
        v-if="project.homepage"
        :href="project.homepage"
        target="_blank"
        rel="noopener"
        class="relative z-10 ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-primary/10 hover:text-primary"
      >
        <UIcon name="i-lucide-globe" class="size-3.5" />site
      </a>
    </div>
  </article>
</template>
