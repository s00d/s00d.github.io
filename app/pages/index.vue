<script setup lang="ts">
import type { Project } from '~/components/ProjectCard.vue'

const { data: projects } = await useFetch<Project[]>('/api/projects.json', { default: () => [] })

const links = [
  { label: 'GitHub', handle: 'github.com/s00d', to: 'https://github.com/s00d', icon: 'i-simple-icons-github' },
  { label: 'LinkedIn', handle: 'linkedin.com/in/s00d', to: 'https://www.linkedin.com/in/s00d/', icon: 'i-simple-icons-linkedin' },
  { label: 'Telegram', handle: '@is_s00d', to: 'https://t.me/is_s00d', icon: 'i-simple-icons-telegram' },
  { label: 'Email', handle: 'Virus191288@gmail.com', to: 'mailto:Virus191288@gmail.com', icon: 'i-lucide-mail' },
]

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))
const stats = computed(() => [
  { label: 'Repositories', value: projects.value.length, icon: 'i-lucide-folder-git-2' },
  { label: 'Stars', value: projects.value.reduce((s, p) => s + p.stars, 0), icon: 'i-lucide-star' },
  { label: 'Forks', value: projects.value.reduce((s, p) => s + p.forks, 0), icon: 'i-lucide-git-fork' },
])

const featured = computed(() => projects.value.slice(0, 3))
const rest = computed(() => projects.value.slice(3))

const languages = computed(() => {
  const counts = new Map<string, number>()
  for (const p of rest.value) if (p.language) counts.set(p.language, (counts.get(p.language) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 8)
})

const query = ref('')
const language = ref<string | null>(null)
const showAll = ref(false)
const PAGE = 15

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return rest.value.filter(p =>
    (!language.value || p.language === language.value)
    && (!q || [p.name, p.description ?? '', ...p.topics].some(s => s.toLowerCase().includes(q))),
  )
})
const filtering = computed(() => !!query.value.trim() || !!language.value)
const visible = computed(() => (showAll.value || filtering.value ? filtered.value : filtered.value.slice(0, PAGE)))

const year = new Date().getFullYear()
</script>

<template>
  <div class="relative min-h-dvh text-default">
    <SpaceScene :moons="projects.slice(0, 12)" />
    <!-- Scrim keeps text readable over the scene: full on phones, left side on desktop. -->
    <div class="pointer-events-none fixed inset-0 -z-10 bg-default/60 lg:bg-transparent lg:bg-linear-to-r lg:from-default/85 lg:via-default/30 lg:to-transparent" />

    <!-- Header -->
    <header class="sticky top-0 z-20 border-b border-default/50 bg-default/50 backdrop-blur-xl">
      <div class="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" class="group inline-flex items-center gap-2 font-mono text-sm font-semibold tracking-tight">
          <span class="grid size-7 place-items-center rounded-lg bg-primary text-[11px] text-inverted transition group-hover:rotate-6">s0</span>
          <span><span class="text-primary">~/</span>s00d</span>
        </a>
        <nav class="flex items-center gap-1">
          <UButton to="#work" label="Work" variant="ghost" color="neutral" class="hidden sm:inline-flex" />
          <UButton to="#projects" label="Projects" variant="ghost" color="neutral" class="hidden sm:inline-flex" />
          <UButton to="#contact" label="Contact" variant="ghost" color="neutral" class="hidden sm:inline-flex" />
          <span class="mx-1 hidden h-5 w-px bg-(--ui-border) sm:block" />
          <UButton to="https://github.com/s00d" target="_blank" icon="i-simple-icons-github" variant="ghost" color="neutral" aria-label="GitHub" />
          <UColorModeButton />
        </nav>
      </div>
    </header>

    <main id="top" class="mx-auto max-w-6xl px-4 sm:px-6">
      <!-- Hero -->
      <section class="flex min-h-[calc(100dvh-3.5rem)] max-w-2xl flex-col justify-center py-16">
        <p class="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-default bg-default/70 px-3 py-1 font-mono text-xs text-muted backdrop-blur">
          <span class="relative flex size-2">
            <span class="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60 motion-reduce:hidden" />
            <span class="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          backend &amp; frontend developer
        </p>

        <h1 class="text-5xl font-bold leading-[0.95] tracking-tighter text-highlighted sm:text-7xl md:text-8xl">
          Pavel<br>
          <span class="text-primary">Kuz'min</span>
        </h1>

        <p class="mt-6 max-w-xl text-lg leading-relaxed text-toned sm:text-xl">
          Building useful things in the open: libraries, plugins and tools for
          <span class="font-medium text-highlighted">Rust</span>, <span class="font-medium text-highlighted">Tauri</span>,
          <span class="font-medium text-highlighted">Vue</span>, <span class="font-medium text-highlighted">Nuxt</span>,
          <span class="font-medium text-highlighted">PHP</span> and more.
        </p>

        <div class="mt-8 flex flex-wrap items-center gap-3">
          <UButton to="#work" size="xl" label="See my work" trailing-icon="i-lucide-arrow-down" />
          <UButton to="#contact" size="xl" label="Get in touch" color="neutral" variant="outline" class="bg-default/60 backdrop-blur" />
          <div class="flex gap-1">
            <UTooltip v-for="l in links.slice(0, 3)" :key="l.label" :text="l.label">
              <UButton :to="l.to" target="_blank" size="xl" color="neutral" variant="ghost" :icon="l.icon" :aria-label="l.label" />
            </UTooltip>
          </div>
        </div>

        <dl v-if="projects.length" class="mt-14 grid max-w-xl grid-cols-3 gap-3">
          <div
            v-for="s in stats"
            :key="s.label"
            class="rounded-xl border border-default bg-default/70 p-4 backdrop-blur"
          >
            <dt class="flex items-center gap-1.5 text-xs text-muted">
              <UIcon :name="s.icon" class="size-3.5 text-primary" />{{ s.label }}
            </dt>
            <dd class="mt-1 font-mono text-2xl font-semibold text-highlighted sm:text-3xl">{{ fmt(s.value) }}</dd>
          </div>
        </dl>

        <p class="mt-8 hidden items-center gap-2 font-mono text-xs text-dimmed lg:flex">
          <UIcon name="i-lucide-mouse-pointer-2" class="size-3.5" />
          drag the planet · hover a moon to see a project · click space
        </p>
      </section>

      <!-- Featured -->
      <section id="work" class="scroll-mt-20 py-16">
        <p class="font-mono text-xs uppercase tracking-widest text-primary">01 — featured</p>
        <h2 class="mt-2 text-3xl font-bold tracking-tight text-highlighted sm:text-4xl">Most used work</h2>
        <p class="mt-2 max-w-xl text-toned">The projects people star and fork the most.</p>
        <div class="mt-8 grid gap-4 lg:grid-cols-3">
          <ProjectCard v-for="(p, i) in featured" :key="p.id" :project="p" :rank="i + 1" featured />
        </div>
      </section>

      <!-- All projects -->
      <section id="projects" class="scroll-mt-20 py-16">
        <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p class="font-mono text-xs uppercase tracking-widest text-primary">02 — projects</p>
            <h2 class="mt-2 text-3xl font-bold tracking-tight text-highlighted sm:text-4xl">Everything else</h2>
            <p class="mt-2 text-toned">Open source work and personal labs, sorted by stars.</p>
          </div>
          <UInput v-model="query" icon="i-lucide-search" placeholder="Search name, topic…" size="lg" class="w-full md:w-80" aria-label="Search projects" />
        </div>

        <div class="mt-6 mb-8 flex flex-wrap gap-2">
          <UButton
            label="All"
            size="sm"
            :color="language ? 'neutral' : 'primary'"
            :variant="language ? 'outline' : 'solid'"
            :class="language ? 'bg-default/70 backdrop-blur' : ''"
            @click="language = null"
          />
          <UButton
            v-for="[lang, count] in languages"
            :key="lang"
            size="sm"
            :color="language === lang ? 'primary' : 'neutral'"
            :variant="language === lang ? 'solid' : 'outline'"
            :class="language === lang ? '' : 'bg-default/70 backdrop-blur'"
            @click="language = language === lang ? null : lang"
          >
            {{ lang }} <span class="opacity-60">{{ count }}</span>
          </UButton>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProjectCard v-for="p in visible" :key="p.id" :project="p" />
        </div>

        <p v-if="!filtered.length" class="py-12 text-center text-muted">Nothing found.</p>

        <div class="mt-10 flex flex-wrap justify-center gap-3">
          <UButton
            v-if="!filtering && !showAll && filtered.length > PAGE"
            :label="`Show all ${filtered.length}`"
            color="neutral"
            variant="outline"
            icon="i-lucide-chevrons-down"
            class="bg-default/70 backdrop-blur"
            @click="showAll = true"
          />
          <UButton to="https://github.com/s00d?tab=repositories" target="_blank" label="All repositories on GitHub" color="neutral" variant="ghost" trailing-icon="i-lucide-arrow-up-right" />
        </div>
      </section>

      <!-- Contact -->
      <section id="contact" class="scroll-mt-20 py-16">
        <div data-solid class="rounded-3xl border border-default bg-default/85 p-6 backdrop-blur-md sm:p-10">
          <p class="font-mono text-xs uppercase tracking-widest text-primary">03 — contact</p>
          <h2 class="mt-2 text-3xl font-bold tracking-tight text-highlighted sm:text-4xl">Get in touch</h2>
          <p class="mt-2 text-toned">Questions, ideas, bug reports or just hello.</p>
          <div class="mt-8 grid gap-3 sm:grid-cols-2">
            <a
              v-for="l in links"
              :key="l.label"
              :href="l.to"
              target="_blank"
              rel="noopener"
              class="group flex items-center gap-4 rounded-xl border border-default bg-elevated/50 p-4 transition hover:border-primary/50 hover:bg-primary/5"
            >
              <span class="grid size-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-inverted">
                <UIcon :name="l.icon" class="size-5" />
              </span>
              <span class="min-w-0">
                <span class="block font-semibold text-highlighted">{{ l.label }}</span>
                <span class="block truncate font-mono text-sm text-muted">{{ l.handle }}</span>
              </span>
              <UIcon name="i-lucide-arrow-up-right" class="ml-auto size-4 shrink-0 text-dimmed transition group-hover:text-primary" />
            </a>
          </div>
        </div>
      </section>
    </main>

    <footer class="border-t border-default/50 bg-default/60 backdrop-blur-xl">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted sm:flex-row sm:px-6">
        <p>© {{ year }} Pavel Kuz'min</p>
        <div class="flex items-center gap-1">
          <UButton v-for="l in links" :key="l.label" :to="l.to" target="_blank" :icon="l.icon" :aria-label="l.label" size="sm" color="neutral" variant="ghost" />
        </div>
        <p class="font-mono text-xs">Nuxt · Tailwind · three.js</p>
      </div>
    </footer>
  </div>
</template>
