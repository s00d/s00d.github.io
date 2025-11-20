export default defineNuxtConfig({
  devtools: { enabled: true },

  // Для GitHub Pages
  ssr: false,

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxt/icon',
    '@nuxtjs/google-fonts',
    '@vueuse/nuxt'
  ],

  colorMode: {
    classSuffix: '',
    preference: 'dark', // По умолчанию темная тема
    fallback: 'dark'
  },

  googleFonts: {
    families: {
      'Inter': [400, 500, 600, 700],
      'JetBrains Mono': [400, 500]
    },
    display: 'swap'
  },

  runtimeConfig: {
    // Секретный токен только на сервере (создай .env файл локально)
    githubToken: process.env.NUXT_GITHUB_TOKEN,
    public: {
      githubUsername: 's00d'
    }
  },

  // Конфигурация для @nuxt/icon
  icon: {
    // Для SPA режима (ssr: false) включаем сканирование компонентов
    // чтобы иконки были в клиентском бандле
    clientBundle: {
      scan: true
    }
  },

  // Настройка Nitro storage для персистентного кеша
  nitro: {
    storage: {
      cache: {
        driver: 'fs',
        base: './.cache'
      }
    },
    prerender: {
      // Предварительно рендерим API роут для сохранения данных как JSON
      routes: ['/api/projects.json'],
      crawlLinks: false
    }
  },

  app: {
    head: {
      title: "Pavel Kuz'min | Creative Developer",
      meta: [
        { name: 'description', content: 'Backend & Frontend Developer Portfolio. Open Source enthusiast.' },
        { name: 'theme-color', content: '#0a0a0a' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.ico' }
      ]
    }
  }
})

