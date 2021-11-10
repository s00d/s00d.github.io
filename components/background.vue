<template>
  <div class="container">
    <Particles
      v-if="show"
      id="tsparticles"
      width='100vw'
      height='100vh'
      :options="options"
    />
  </div>
</template>

<script lang="ts">
import {Prop, Vue, Component, Watch} from 'nuxt-property-decorator';

@Component({
  components: {}
})

export default class Background extends Vue {
  @Prop({type: Boolean, default: true}) public readonly isDark!: boolean
  public show = true
  public options = {}


  reloadConfig() {
    this.options = {
      background: {
        color: {
          value: this.isDark ? '#232323' : '#dcdcdc'
        },
        opacity: 1
      },
      particles: {
        collisions: {
          bounce: {
            horizontal: {
              random: {
                enable: false,
                minimumValue: 0.1
              },
              value: 1
            },
            vertical: {
              random: {
                enable: false,
                minimumValue: 0.1
              },
              value: 1
            }
          },
          enable: true,
          mode: "bounce",
          overlap: {
            enable: true,
            retries: 0
          }
        },
        backgroundMask: {
          composite	:	'destination-out',
          cover: {
            color: {
              value: this.isDark ? '#232323' : '#dcdcdc'
            },
            opacity	:	1
          },
          enable:	true
        },
        number: {
          value: 100,
          density: {
            enable: true,
            area: 800,
          },
        },
        color: {
          value: ['c912ed', '00bfff', '22dd22', 'ffd500', 'ff8000', 'ff2600'],
        },
        shape: {
          type: 'circle',
          stroke: {
            width: 0,
            color: '000',
          },
          polygon: {
            nb_sides: 5,
          },
          image: {
            src: 'img/github.svg',
            width: 100,
            height: 100,
          },
        },
        opacity: {
          value: 0.9,
          random: false,
          anim: {
            enable: false,
            speed: 1,
            opacity_min: 0.5,
            sync: false,
          },
        },
        size: {
          value: 4,
          random: {
            enable: true,
            minimumValue: 2,
          },
          anim: {
            enable: false,
            speed: 30,
            size_min: 0.1,
            sync: true,
          },
        },
        links: {
          enable: true,
          distance: 75,
          color: '999',
          opacity: 0.9,
          width: 1,
          consent: false,
          blink: false,
        },
        move: {
          enable: true,
          speed: 2,
          direction: 'none',
          random: false,
          straight: false,
          out_mode: 'bounce',
          bounce: false,
          attract: {
            enable: false,
            rotateX: 600,
            rotateY: 1200,
          },
          trail: {
            enable: true,
            length: 20,
            fillColor: {
              value: this.isDark ? '#232323' : '#dcdcdc'
            }
          },
        },
      },
      interactivity: {
        detect_on: 'canvas',
        events: {
          // onhover: {
          //   enable: true,
          //   // mode: 'repulse',
          //   // mode:	'bubble',
          //   // mode:	'bubble',
          //   "mode": ["grab", 'bubble'],
          //   parallax:	{
          //     enable: false,
          //     force: 60,
          //     smooth: 10
          //   }
          //
          // },
          onclick: {
            enable: true,
            mode: 'push',
          },
          resize: true,
        },
        modes: {
          trail: {
            delay: 1,
            pauseOnStop: false,
            quantity: 1
          },
          attract: {
            distance: 100,
            duration: 1,
            speed: 5,
          },
          bubble: {
            distance: 400,
            size: 10,
            duration: 2,
            opacity: 8,
            speed: 3,
          },
          grab: {
            distance: 400,
            line_linked: {
              opacity: 1,
            },
          },
          push: {
            particles_nb: 3,
          },
          remove: {
            particles_nb: 2,
          },
          repulse: {
            distance: 100,
            duration: 1,
          },
        },
      },
      retina_detect: true,
      fpsLimit: 60,


      absorbers: {
        color: {
          value: this.isDark ? '#000' : '#fff'
        },
        draggable: false,
        opacity: 1,
        destroy: true,
        orbits: false,
        size: {
          random: {
            enable: true,
            minimumValue: 10
          },
          value: {
            min: 10,
            max: 50
          },
          density: 20,
          limit: {
            radius: 100,
            mass: 0
          }
        },
        position: {
          x: 50,
          y: 50
        }
      },
      // polygon: {
      //   draw: {
      //     "enable": false,
      //     "stroke": {
      //       "color": {
      //         "value": "rgba(255,255,255,0.2)"
      //       },
      //       "width": 0.5,
      //       "opacity": 0.2
      //     }
      //   },
      //   "enable": true,
      //   "inline": {
      //     "arrangement": "equidistant"
      //   },
      //   "move": {
      //     "radius": 10,
      //     "type": "path"
      //   },
      //   "scale": 1,
      //   "type": "inline",
      //   "url": "https://raw.githubusercontent.com/s00d/s00d.github.io/master/static/logo.svg",
      //   "position": {
      //     "x": 30,
      //     "y": 10
      //   }
      // }
      // emitters: [
      //   {
      //     autoPlay: true,
      //     fill: true,
      //     life: {
      //       wait: false
      //     },
      //     rate: {
      //       quantity: 1,
      //       delay: 0.1
      //     },
      //     shape: "square",
      //     startCount: 0,
      //     direction: "top-right",
      //     particles: {
      //       shape: {
      //         type: "circle"
      //       },
      //       color: {
      //         value: "random"
      //       },
      //       lineLinked: {
      //         enable: false
      //       },
      //       opacity: {
      //         value: 0.3
      //       },
      //       rotate: {
      //         value: 0,
      //         random: true,
      //         direction: "counter-clockwise",
      //         animation: {
      //           enable: true,
      //           speed: 15,
      //           sync: false
      //         }
      //       },
      //       size: {
      //         value: 10,
      //         random: {
      //           enable: true,
      //           minimumValue: 5
      //         }
      //       },
      //       move: {
      //         speed: 5,
      //         random: false,
      //         outMode: "bounce"
      //       }
      //     },
      //     position: {
      //       x: 0,
      //       y: 100
      //     }
      //   }
      // ]
      // 3m@62^K^88745%
    }
  }

  @Watch("isDark")
  onIsDark(val: boolean) {
    // this.options.background.color.value = val ? '#000' : '#FFF'
    this.show = false;
    this.reloadConfig()
    this.$nextTick(() => {
      this.show = true
    })
  }

  mounted(): void {
    this.reloadConfig()
  }
}
</script>

<style lang="scss" scoped>
.container {
  transition: background-color 0.5s linear;
  position: absolute;
  background-color: var(--bg);
  background-repeat: no-repeat;
  background-size: cover;
  background-position: 50% 50%;
  z-index: 0;
}

</style>
