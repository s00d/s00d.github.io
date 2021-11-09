<template>
  <div class='app theme'>
    aa
    <Toggle :isDark="isDark" @setIsDark="setIsDark" />
    <Content />
    <Buttons  />
    <Footer />
    <client-only>
      <Background :isDark="isDark" />
    </client-only>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'nuxt-property-decorator';
import Toggle from '../components/toggle.vue'
import Content from '../components/content.vue'
import Buttons from '../components/buttons.vue'
import Footer from '../components/footer.vue'
import Background from '../components/background.vue'

@Component({
  components: {
    Toggle,
    Content,
    Buttons,
    Footer,
    Background,
  }
})

export default class App extends Vue {
  public isDark = true;

  @Watch("isDark")
  onIsDark(val: boolean) {
    localStorage.setItem('isDark', val ? 'yes' : 'no')
  }

  setIsDark(val: boolean) {
    console.log('setIsDark', val);
    this.isDark = val
    this.$nuxt.$colorMode.preference = this.isDark ? 'dark' : 'white'
  }

  mounted(): void {
    this.isDark = localStorage.getItem('isDark') !== 'no';
    this.$nuxt.$colorMode.preference = this.isDark ? 'dark' : 'white'
  }
}
</script>


<style lang="scss">
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
