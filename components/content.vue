<script lang="ts">
import {Component, Prop, Vue} from 'nuxt-property-decorator';

@Component({
  components: {
  }
})

export default class Content extends Vue {
  animate() {
    // @ts-ignore
    this.$anime({
      targets: '.name',
      translateX: 250,
      rotate: '1turn',
      color: [ "#" +Math.floor(Math.random()*16777215).toString(16), "#" +Math.floor(Math.random()*16777215).toString(16)],
      duration: 800
    })
  }
}
</script>

<template>
  <div class="item">
    <h1 class="name" data-v2='name' aria-label="My name is Pavel Kuz'min" @click="animate" v-anime="{
        rotate: [-10, 5, -10, 0],
        duration: 5000,
        opacity: [0.9, 1],
        // translateY: [-50, 50, -50, 50, -50, 50, -50, 50, -50, 50, -50, 50, -50, 50, -50, 50, -50, 50, -50, 50, -50, 50],
        easing: 'easeInOutSine',
        mode: 'out-in',

        loop: true,
      }">Pavel Kuz'min</h1>
    <h2 class="title"  data-v2='title' aria-label='I am a software engineer'>Backend and Frontend Developer</h2>
  </div>
</template>

<style lang="scss" scoped>
.item {
  transition: color 0.5s linear;
  font-weight: normal;
  position: relative;
  z-index: 1;

  .name {
    font-size: 6rem;
    margin: 0 0 3.5rem;
    color: var(--color-primary);
    @media only screen and (max-device-width: 820px) and (-webkit-min-device-pixel-ratio: 2) {
      font-size: 4.5rem;
    }
  }

  .title {
    font-size: 3.5rem;
    margin: 4rem 0;
    color: var(--color-secondary);
    @media only screen and (max-device-width: 820px) and (-webkit-min-device-pixel-ratio: 2) {
      font-size: 2.5rem;
    }
  }
}

</style>
