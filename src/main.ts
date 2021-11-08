import { createApp } from 'vue'
import App from './App.vue'

// @ts-ignore
import Particles from "particles.vue3";
import hljsVuePlugin from "@highlightjs/vue-plugin";

createApp(App).use(Particles).use(hljsVuePlugin).mount('#app')
