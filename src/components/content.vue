<template>
  <div class="item">
    <h1 class="name" data-v2='name' aria-label="My name is Pavel Kuz'min">Pavel Kuz'min</h1>
    <h2 class="title"  data-v2='title' aria-label='I am a software engineer'>Backend and Frontend Developer</h2>
  </div>
</template>

<style lang="scss" scoped>
@import "../scss/_variables.scss";

.item {
  transition: color 0.5s linear;
  font-weight: normal;
  position: relative;
  z-index: 1;

  .name {
    font-size: 6rem;
    margin: 0 0 3.5rem;
    //color: t($primaryTextColor);
    color: $primaryTextColor;
    @media only screen and (max-device-width: 820px) and (-webkit-min-device-pixel-ratio: 2) {
      font-size: 4.5rem;
    }
  }

  .title {
    font-size: 3.5rem;
    margin: 4rem 0;
    //color: t($secondaryTextColor);
    color: $secondaryTextColor;
    @media only screen and (max-device-width: 820px) and (-webkit-min-device-pixel-ratio: 2) {
      font-size: 2.5rem;
    }
  }
}

</style>
