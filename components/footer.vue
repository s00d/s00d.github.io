<script setup lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';

@Component({
  components: {}
})

export default class Footer extends Vue {
  public isMobile = window.matchMedia('(max-device-width: 820px) and (-webkit-min-device-pixel-ratio: 2)').matches;

}
</script>

<template>
  <div class="container" :style="{'padding-right': isMobile ? '1.5rem' : '1rem'}">
    <p class="text" aria-label="Designed and built by Pavel Kuz'min">Designed and built by&nbsp;
      <a class="link" data-v2='creator' href='https://s00d.github.io/'>Pavel Kuz'min</a>
    &nbsp;<span v-if="isMobile">|<a class="link" data-v2='source' aria-label='Source code' href='https://github.com/s00d/s00d/site'>Source</a></span>
  </p>
  </div>
</template>

<style lang="scss" scoped>
.container {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 0.75rem;
  z-index: 1;
}

.text {
  transition: color 0.5s linear;
  color: var(--tertiary-secondary);
}

.link {
  transition: color 0.5s linear;
  text-decoration: none;
  color: var(--color-secondary);
}
</style>
