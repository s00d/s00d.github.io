<script lang="ts">
import {Component, Prop, Vue} from 'nuxt-property-decorator';

import Moon from './icons/Moon.vue'
import Sun from './icons/Sun.vue'

@Component({
  components: {
    Moon,
    Sun
  }
})

export default class Toggle extends Vue {
  @Prop({type: Boolean, default: true}) private readonly isDark!: boolean

  setIsDark() {
    this.$emit('setIsDark', !this.isDark)
  }
}
</script>

<template>
  <div class="container" @click.stop.prevent="setIsDark">
    <input class="toggle" id='toggle' name='toggle' type='checkbox' :checked="isDark"  />
    <a class="switch" @click.stop.prevent="setIsDark">
      <Moon v-if="isDark" />
      <Sun v-else />
    </a>
  </div>
</template>

<style lang="scss" scoped>

.container {
  position: fixed;
  z-index: 1;
  top: 1rem;
  right: 1rem;
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
  border-radius: 25%;
  box-shadow: 0 0 0.25rem 0.25rem rgba(128, 128, 128, 0.25);
  align-items: center;
  justify-content: center;
  transition: background-color 0.5s linear;
  font-size: 0.5rem;
}
</style>
