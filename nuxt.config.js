export default {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: 'Pavel Kuz\'min',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Source: https://github.com/s00d/s00d.github.io' },
      { hid: 'keywords', name: 'keywords', content: 'Pavel Kuz\'min, Pavel, Kuz\'min, pavelkuzmin, s00d, backend developer, frontend developer' },
      { name: 'author', content: 'Pavel Kuz\'min' },
      { name: 'format-detection', content: 'telephone=no' },
      { name: 'og:site_name', content: 'Personal Website' },
      { name: 'og:url', content: 'https://s00d.github.io/' },
      { name: 'og:locale', content: 'en_US' },
      { name: 'og:image', content: 'https://git.io/JXzzH' },
      { name: 'og:image:type', content: 'image/png' },
      { name: 'og:image:width', content: '1280' },
      { name: 'og:image:height', content: '640' },
      { name: 'og:image:alt', content: 's00d.github.io' },
      { name: 'og:type', content: 'website' },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'canonical', href: 'https://s00d.github.io' },
      { rel: 'manifest', href: '/manifest.webmanifest' },
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    { src: '~plugins/vue-particles', ssr: false }
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
    '@nuxtjs/color-mode',
    '@nuxtjs/style-resources',
    '@nuxtjs/pwa',
  ],

  styleResources: {
    scss: [
      '~assets/scss/_variables.scss',
      '~assets/scss/_mixins.scss',
    ]
  },

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/pwa
    '@nuxtjs/pwa',
    // https://go.nuxtjs.dev/content
    '@nuxt/content',
  ],

  // PWA module configuration: https://go.nuxtjs.dev/pwa
  pwa: {
    manifest: {
      lang: 'en'
    }
  },

  // Content module configuration: https://go.nuxtjs.dev/config-content
  content: {},

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
  },
  router: {
    base: '/'
  }

}
