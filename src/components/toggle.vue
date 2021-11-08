<script setup lang="ts">
import { ref } from 'vue'
import Moon from '../icons/Moon.vue'
import Sun from '../icons/Sun.vue'

defineProps<{
  isDark: boolean,
}>()

const emits = defineEmits<{
  (eventName: 'setIsDark', hovering: boolean): void
}>()

const count = ref(0)
</script>

<template>
  <main class="container">
    <input class="toggle" id='toggle' name='toggle' type='checkbox' :checked="isDark" @change="(event) => $emit('setIsDark', !isDark)" />
    <a class="switch" @click="">
      <Moon v-if="isDark" />
      <Sun v-else />
    </a>
  </main>
</template>

<style lang="scss" scoped>
@import "../scss/_variables.scss";

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
  //background-color: t($shadowColor);
  background-color: $shadowColor;
  border-radius: 25%;
  box-shadow: 0 0 0.25rem 0.25rem rgba(128, 128, 128, 0.25);
  align-items: center;
  justify-content: center;
  transition: background-color 0.5s linear;
  font-size: 0.5rem;
}
</style>
