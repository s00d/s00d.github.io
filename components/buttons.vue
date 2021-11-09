<script lang="ts">
import { Component, Vue } from 'nuxt-property-decorator';
import GitHub from './icons/GitHub.vue';
import LinkedIn from './icons/LinkedIn.vue';
// import Resume from './icons/Resume.vue';
import Email from './icons/Email.vue';
import Telegram from './icons/Telegram.vue';

@Component({
  components: {
    GitHub,
    LinkedIn,
    Email,
    Telegram,
  }
})

export default class Buttons extends Vue {
  private buttons = [
    {
      href: 'https://github.com/s00d/',
      aria: 'Visit my GitHub profile',
      icon: 'GitHub',
      label: 'GitHub',
    },
    {
      href: 'https://www.linkedin.com/in/s00d/',
      aria: 'Visit my LinkedIn profile',
      icon: 'LinkedIn',
      label: 'LinkedIn',
    },
    // {
    //   href: 'https://drive.google.com/drive/folders/10k8NWflSYQ5laPzuWtK3bzUKzuOeas8i/',
    //   aria: 'Visit Google Drive to view and download my resume',
    //   icon: 'Resume',
    //   label: 'Resume',
    // },
    {
      href: 'mailto:Virus191288@gmail.com',
      aria: 'Send me an email with this template',
      icon: 'Email',
      label: 'Email',
    },
    {
      href: 'tg://resolve?domain=is_s00d',
      aria: 'Send me Telegram message',
      icon: 'Telegram',
      label: 'Telegram',
    }
  ];


}

</script>

<template>
  <div class="container">
    <span  class='button-container' v-for="(item, i) in buttons" :key="i">
        <a class='button' :href="item.href" target='_self' :aria-label="item.aria" rel='noopener noreferrer'>
          <div class='icon'>
<!--            <component @is="item.icon"></component>-->
            <GitHub v-if="item.icon === 'GitHub'"/>
            <LinkedIn v-if="item.icon === 'LinkedIn'"/>
<!--            <Resume v-if="item.icon === 'Resume'"/>-->
            <Email v-if="item.icon === 'Email'"/>
            <Telegram v-if="item.icon === 'Telegram'"/>
          </div>
          <span class='icon_title' v-text="item.label"></span>
        </a>
      </span>
  </div>
</template>

<style lang="scss" scoped>
.container {
  a,
  a:active,
  a:hover {
    outline: 0;
  }

  .button-container {
    display: inline-block;
    height: 6rem;
    width: 6rem;
    margin: 0 1.75rem;
  }

  .button {
    transition: color 0.5s linear;
    height: 6rem;
    width: 6rem;
    color: var(--color-primary);
    display: table-cell;
    vertical-align: middle;
    text-align: center;
    text-decoration: none;
    position: relative;
    z-index: 1;
    border-radius: 25%;
  }

  .icon {
    height: 4.5rem;
    width: 4.5rem;
    padding: 1rem;
  }

  .icon_title {
    font-size: 1.25rem;
  }

  .button:hover {
    background-color: var(--shadow-color);
    box-shadow: 0 0 0.75rem 0.75rem rgba(128, 128, 128, 0.25);
  }

  .button:active {
    -webkit-transform: scale(0.9);
    transform: scale(0.9);
  }

  .button-container .icon_title {
    display: none;
  }

  .button-container:hover .icon_title {
    display: initial;
  }

  .button-container:hover .icon {
    display: none;
  }

  @media only screen and (max-device-width: 820px) and (-webkit-min-device-pixel-ratio: 2) {
    .button-container {
      height: 5rem;
      width: 5rem;
      margin: 0 0.8rem;
    }

    .button {
      height: 5rem;
      width: 5rem;
    }

    .icon {
      height: 4rem;
      width: 4rem;
      padding: 0.5rem;
    }

    .icon_title {
      font-size: 1rem;
    }
  }
}

</style>
