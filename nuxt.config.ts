// User site: GitHub Pages serves it from the root of https://s00d.github.io/.
export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // Build-time only: lifts the anonymous GitHub API rate limit.
    githubToken: '',
    public: { githubUsername: 's00d' },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: "Pavel Kuz'min — developer",
      meta: [
        { name: 'description', content: "Pavel Kuz'min (s00d): backend & frontend developer. Open source projects, links and contacts." },
        { property: 'og:title', content: "Pavel Kuz'min — developer" },
        { property: 'og:image', content: 'https://s00d.github.io/android-chrome-512x512.png' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },

  icon: {
    // Bundle every icon so the static site never asks the Iconify API at runtime.
    clientBundle: { scan: true, sizeLimitKb: 512 },
  },

  colorMode: { preference: 'system' },

  nitro: {
    prerender: {
      routes: ['/', '/api/projects.json'],
      crawlLinks: false,
      failOnError: true,
    },
  },

  compatibilityDate: '2025-11-03',
})
