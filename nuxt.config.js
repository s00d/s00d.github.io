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
      // { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      // { hid: 'description', name: 'description', content: 'Source: https://github.com/s00d/s00d.github.io' },
      // { hid: 'keywords', name: 'keywords', content: 'Pavel Kuz\'min, Pavel, Kuz\'min, pavelkuzmin, s00d, backend developer, frontend developer' },
      // { name: 'author', content: 'Pavel Kuz\'min' },
      // { name: 'format-detection', content: 'telephone=no' },
      // { name: 'og:site_name', content: 'Personal Website' },
      // { name: 'og:url', content: 'https://s00d.github.io/' },
      // { name: 'og:locale', content: 'en_US' },
      // { name: 'og:image', content: 'https://git.io/JXw4X' },
      // { name: 'og:image:type', content: 'image/png' },
      // { name: 'og:image:width', content: '1280' },
      // { name: 'og:image:height', content: '640' },
      // { name: 'og:image:alt', content: 's00d.github.io' },
      // { name: 'og:type', content: 'website' },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      // { rel: 'apple-touch-icon', type: 'image/x-icon', href: '/favicon.ico' },
      // { rel: 'canonical', href: 'https://s00d.github.io' },
    ]
  },


  sitemap: {
    hostname: "https://s00d.github.io",
    gzip: true,
    exclude: ["/admin/**"]
  },
  robots: [
    {
      UserAgent: 'Googlebot',
      Disallow: () => '/admin' // accepts function
    }
  ],

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    { src: '~plugins/vue-particles', ssr: false },
    { src: '~plugins/vue-fullscreen-import', ssr: false },
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    // https://go.nuxtjs.dev/typescript
    '@nuxt/typescript-build',
    '@nuxtjs/color-mode',
    '@nuxtjs/style-resources',
    // https://go.nuxtjs.dev/pwa
    '@nuxtjs/pwa',
    'nuxt-animejs'
  ],

  styleResources: {
    scss: [
      '~assets/scss/_variables.scss',
      '~assets/scss/_mixins.scss',
    ]
  },

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/content
    '@nuxt/content',


    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
    '@nuxtjs/toast',
    'nuxt-speedkit'
  ],

  toast: {
    position: "top-center",
  },

  speedkit: {
    // Options
  },

  // PWA module configuration: https://go.nuxtjs.dev/pwa
  pwa: {
    icon: {
      /* icon options */
    },
    meta: {
      name: 'Personal Website',
      author: 'Pavel Kuz\'min',
      description: 'Source: https://github.com/s00d/s00d.github.io',
      theme_color: '#000',
      lang: 'en',
      ogType: 'website',
      ogSiteName: 'Pavel Kuz\'min',
      ogTitle: 'Personal Website',
      ogDescription: 'Source: https://github.com/s00d/s00d.github.io',

      ogImage: {
        path: 'https://git.io/JXw4X',
        width: 1280,
        height: 640,
        type: 'image/png',
      },
      ogUrl: 'https://s00d.github.io/',
    },
    manifest: {
      name: 'Personal Website',
      short_name: 'Pavel Kuz\'min',
      lang: 'en',
      icons: [
        {
          src: "favicon.svg",
          sizes: "64x64 32x32 24x24 16x16",
          type: "image/x-icon"
        }
      ],
      background_color: '#000',
      theme_color: '#000',
      useWebmanifestExtension: true,
    },
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
