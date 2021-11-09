<script lang="ts">
import {Component, Prop, Vue} from 'nuxt-property-decorator';

import FullscreenIcon from './icons/Fullscreen.vue'
import RevFullscreenIcon from './icons/RevFullscreen.vue'

@Component({
  components: {
    FullscreenIcon,
    RevFullscreenIcon
  }
})

export default class Fullscreen extends Vue {
  @Prop({type: Boolean, default: true}) private readonly isDark!: boolean
  private fullscreen = false
  setFullscrean() {
    this.$fullscreen.toggle(this.$el.querySelector('.fullscreen-wrapper'), {
      teleport: true,
      callback: (isFullscreen) => {
        this.fullscreen = isFullscreen
      },
    })
  }
}
</script>

<template>
  <div class="container" @click.stop.prevent="setFullscrean">
    <a class="switch" @click.stop.prevent="setFullscrean">
      <FullscreenIcon v-if="!fullscreen" />
      <RevFullscreenIcon v-else />
    </a>
  </div>
</template>

<style lang="scss" scoped>

.container {
  position: fixed;
  z-index: 1;
  top: 1rem;
  left: 1rem;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;

  :active {
    -webkit-transform: scale(0.9);
    transform: scale(0.9);
  }
}


.toggle {
  display: none;
}

.switch {
  cursor: pointer;
  display: flex;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0.75rem;
  background-color: var(--shadow-color);
  color: var(--color-primary);
  border-radius: 25%;
  box-shadow: 0 0 0.25rem 0.25rem rgba(128, 128, 128, 0.25);
  align-items: center;
  justify-content: center;
  transition: background-color 0.5s linear;
  font-size: 0.5rem;
}
</style>
