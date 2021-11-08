<script setup lang="ts">

import Toggle from './components/toggle.vue'
import Content from './components/content.vue'
import Buttons from './components/buttons.vue'
import Footer from './components/footer.vue'
import Particles from './components/particles.vue'

const isDark = true
</script>

<template>
  <div class='app theme' :class="isDark ? 'theme--dark' : 'theme--default'">
<!--    <Toggle :isDark="isDark" @setIsDark="(val) => isDark = val" />-->
    <Content />
    <Buttons  />
    <Footer />
    <Particles :isDark="isDark" />
  </div>
</template>

<style lang="scss">
@import "./scss/_variables.scss";

html {
  overflow: hidden;
  font-size: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', sans-serif;
}

body {
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.app {
  margin: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

</style>
