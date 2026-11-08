<script setup lang="ts">
// Interactive 3D background (three.js, loaded lazily): a low-poly planet with an
// atmosphere and a dust ring, moons orbiting it = top projects (hover shows the
// name, click opens the repo), a parallax star field. The camera follows the
// cursor, scrolling flies past the planet, dragging empty space spins it.
// Motion freezes under prefers-reduced-motion; interaction keeps working.
interface Moon { name: string, url: string, stars: number }
const props = defineProps<{ moons: Moon[] }>()

const host = ref<HTMLDivElement>()
const label = ref<HTMLDivElement>()
const hovered = ref<Moon | null>(null)
const colorMode = useColorMode()

let cleanup = () => {}
onBeforeUnmount(() => cleanup())

onMounted(async () => {
  const [THREE, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
    import('three'),
    import('three/addons/postprocessing/EffectComposer.js'),
    import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),
    import('three/addons/postprocessing/OutputPass.js'),
  ])
  const el = host.value
  if (!el) return

  let renderer: InstanceType<typeof THREE.WebGLRenderer>
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  } catch {
    return // no WebGL: the CSS background stays
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75))
  renderer.setSize(innerWidth, innerHeight)
  el.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 200)
  camera.position.set(0, 0, 10)

  const reduce = matchMedia('(prefers-reduced-motion: reduce)')
  const isDark = () => colorMode.value === 'dark'
  const VIOLET = new THREE.Color('#8b5cf6')
  const CYAN = new THREE.Color('#22d3ee')

  // --- Planet -------------------------------------------------------------
  const world = new THREE.Group()
  scene.add(world)
  const planet = new THREE.Group()
  planet.rotation.z = 0.35
  world.add(planet)

  // Terrain: displaced low-poly sphere, faces coloured by height (sea, lowland, hills, peaks).
  const terrain = (p: InstanceType<typeof THREE.Vector3>) =>
    Math.sin(p.x * 5.1 + p.y * 2.3) * Math.cos(p.z * 4.7 - p.x * 1.9) * 0.5
    + Math.sin(p.y * 9.3 + p.z * 7.1) * 0.25
    + Math.sin(p.x * 17.0 - p.z * 13.0) * 0.12
  const geo = new THREE.IcosahedronGeometry(1.6, 5)
  const pos = geo.attributes.position!
  const v = new THREE.Vector3()
  const heights = new Float32Array(pos.count)
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize()
    const h = Math.max(0, terrain(v))
    heights[i] = h
    v.multiplyScalar(1.6 + h * 0.22)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  const BANDS = {
    dark: ['#211e2e', '#3a3060', '#57498f', '#b3a9dc'],
    light: ['#d4d4d8', '#a78bfa', '#7c6bb0', '#fafafa'],
  }
  const colors = new Float32Array(pos.count * 3)
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const paintTerrain = (dark: boolean) => {
    const bands = (dark ? BANDS.dark : BANDS.light).map(c => new THREE.Color(c))
    const c = new THREE.Color()
    for (let f = 0; f < pos.count; f += 3) {
      const h = (heights[f]! + heights[f + 1]! + heights[f + 2]!) / 3
      const b = h < 0.02 ? 0 : h < 0.25 ? 1 : h < 0.5 ? 2 : 3
      c.copy(bands[b]!).offsetHSL(0, 0, (Math.random() - 0.5) * 0.04)
      for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], (f + k) * 3)
    }
    geo.attributes.color!.needsUpdate = true
  }
  const planetMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.15, flatShading: true })
  planet.add(new THREE.Mesh(geo, planetMat))

  // "City lights": glowing dots scattered over the land.
  const lightPos: number[] = []
  for (let i = 0; i < pos.count && lightPos.length < 1500 * 3; i += 3) {
    if (heights[i]! > 0.05 && heights[i]! < 0.45 && Math.random() < 0.07) {
      v.fromBufferAttribute(pos, i).multiplyScalar(1.004)
      lightPos.push(v.x, v.y, v.z)
    }
  }
  const lightsGeo = new THREE.BufferGeometry()
  lightsGeo.setAttribute('position', new THREE.Float32BufferAttribute(lightPos, 3))
  const lightsMat = new THREE.PointsMaterial({ color: '#ddd6fe', size: 0.028, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  planet.add(new THREE.Points(lightsGeo, lightsMat))

  const wireMat = new THREE.LineBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.35 })
  const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.75, 2)), wireMat)
  planet.add(wire)

  // Fresnel atmosphere glow.
  const atmoMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: VIOLET.clone() }, uPower: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV;
      void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uColor; uniform float uPower; varying vec3 vN; varying vec3 vV;
      void main() { float f = pow(1.0 - abs(dot(vN, vV)), 3.5);
        gl_FragColor = vec4(uColor, f * uPower); }`,
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  world.add(new THREE.Mesh(new THREE.SphereGeometry(2.3, 48, 48), atmoMat))

  // Dust ring: two-tone particles in bands with gaps, Saturn-style.
  const RING = 14000
  const ringPos = new Float32Array(RING * 3)
  const ringCol = new Float32Array(RING * 3)
  const ringA = new THREE.Color('#a1a1aa'), ringB = new THREE.Color('#c4b5fd'), rc = new THREE.Color()
  for (let i = 0; i < RING; i++) {
    const a = Math.random() * Math.PI * 2
    let r = 2.35 + Math.random() * 1.5
    if (r > 3.0 && r < 3.12) r += 0.15 // Cassini-like gap
    ringPos.set([Math.cos(a) * r, (Math.random() - 0.5) * 0.04, Math.sin(a) * r], i * 3)
    rc.lerpColors(ringA, ringB, (r - 2.35) / 1.65).multiplyScalar(0.5 + Math.random() * 0.4)
    ringCol.set([rc.r, rc.g, rc.b], i * 3)
  }
  const ringGeo = new THREE.BufferGeometry()
  ringGeo.setAttribute('position', new THREE.BufferAttribute(ringPos, 3))
  ringGeo.setAttribute('color', new THREE.BufferAttribute(ringCol, 3))
  const ringMat = new THREE.PointsMaterial({ vertexColors: true, size: 0.022, transparent: true, opacity: 0.9, depthWrite: false })
  const ring = new THREE.Points(ringGeo, ringMat)
  ring.rotation.set(1.15, 0, 0.35)
  world.add(ring)

  // Click pulse: an expanding glowing ring around the planet.
  const pulseMat = new THREE.MeshBasicMaterial({ color: VIOLET, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
  const pulse = new THREE.Mesh(new THREE.RingGeometry(0.97, 1, 96), pulseMat)
  pulse.rotation.copy(ring.rotation)
  pulse.rotateX(Math.PI / 2)
  world.add(pulse)
  let pulseT = 1

  // --- Moons (projects) ---------------------------------------------------
  interface MoonObj { data: Moon, pivot: InstanceType<typeof THREE.Group>, body: InstanceType<typeof THREE.Mesh>, hit: InstanceType<typeof THREE.Mesh>, orbit: InstanceType<typeof THREE.LineLoop>, speed: number }
  const moons: MoonObj[] = []
  const moonGeo = new THREE.IcosahedronGeometry(1, 1)
  const hitGeo = new THREE.SphereGeometry(1, 8, 8)
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  const maxStars = Math.max(1, ...props.moons.map(m => m.stars))
  props.moons.forEach((data, i) => {
    const radius = 2.9 + i * 0.32
    const pivot = new THREE.Group()
    pivot.rotation.set((Math.random() - 0.5) * 0.9, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.6)
    world.add(pivot)

    const pts = Array.from({ length: 129 }, (_, k) => {
      const a = (k / 128) * Math.PI * 2
      return new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius)
    })
    const orbit = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: VIOLET, transparent: true, opacity: 0.12 }),
    )
    pivot.add(orbit)

    const size = 0.05 + 0.09 * Math.sqrt(data.stars / maxStars)
    const color = new THREE.Color().lerpColors(new THREE.Color('#a78bfa'), new THREE.Color('#e4e4e7'), i / Math.max(1, props.moons.length - 1))
    const body = new THREE.Mesh(moonGeo, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.12, flatShading: true }))
    body.scale.setScalar(size)
    body.position.set(radius, 0, 0)
    const hit = new THREE.Mesh(hitGeo, hitMat)
    hit.scale.setScalar(Math.max(0.3, size * 2.5))
    body.add(hit)
    hit.scale.divideScalar(size)
    pivot.add(body)
    pivot.rotateY(Math.random() * Math.PI * 2)
    moons.push({ data, pivot, body, hit, orbit, speed: (0.12 + Math.random() * 0.1) / Math.sqrt(radius) })
  })

  // --- Stars --------------------------------------------------------------
  const STARS = 4000
  const starPos = new Float32Array(STARS * 3)
  for (let i = 0; i < STARS; i++) {
    v.randomDirection().multiplyScalar(25 + Math.random() * 60)
    starPos.set([v.x, v.y, v.z], i * 3)
  }
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  const starMat = new THREE.PointsMaterial({ size: 0.14, transparent: true, depthWrite: false })
  const stars = new THREE.Points(starGeo, starMat)
  scene.add(stars)

  // Nebulae: large soft additive sprites far behind the planet.
  const glowTex = (() => {
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')!
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.4, 'rgba(255,255,255,0.35)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
    return new THREE.CanvasTexture(c)
  })()
  const nebulae = [
    { color: '#7c3aed', pos: [6, 3, -30], scale: 34 },
    { color: '#4f46e5', pos: [-14, -6, -36], scale: 40 },
  ].map(({ color, pos: p, scale }) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }))
    s.position.set(p[0]!, p[1]!, p[2]!)
    s.scale.setScalar(scale)
    scene.add(s)
    return s
  })

  // Meteors: glowing head + long fading tail, launched at random intervals.
  const COMETS = 4
  const cometGeo = new THREE.BufferGeometry()
  const cometPos = new Float32Array(COMETS * 6)
  const cometCol = new Float32Array(COMETS * 6)
  for (let i = 0; i < COMETS; i++) cometCol.set([1, 0.97, 1, 0, 0, 0], i * 6)
  cometGeo.setAttribute('position', new THREE.BufferAttribute(cometPos, 3))
  cometGeo.setAttribute('color', new THREE.BufferAttribute(cometCol, 3))
  const cometMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
  scene.add(new THREE.LineSegments(cometGeo, cometMat))
  const headMat = new THREE.SpriteMaterial({ map: glowTex, color: '#f5f3ff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
  const comets = Array.from({ length: COMETS }, () => {
    const head = new THREE.Sprite(headMat)
    head.scale.setScalar(0.9)
    head.visible = false
    scene.add(head)
    return { p: new THREE.Vector3(), d: new THREE.Vector3(), t: -1 - Math.random() * 8, head }
  })
  const launch = (c: typeof comets[number]) => {
    c.p.set((Math.random() - 0.5) * 50, 14 + Math.random() * 8, -18 - Math.random() * 14)
    c.d.set((Math.random() - 0.5) * 0.9, -1, (Math.random() - 0.5) * 0.3).normalize().multiplyScalar(14 + Math.random() * 10)
    c.t = 0
  }

  // Asteroids: tumbling low-poly rocks drifting through the scene; the cursor shoves them.
  const ROCKS = 46
  const rockGeo = new THREE.IcosahedronGeometry(1, 1)
  {
    const rp = rockGeo.attributes.position!
    for (let i = 0; i < rp.count; i++) {
      v.fromBufferAttribute(rp, i)
      // Deterministic per position so shared corners stay welded.
      const k = Math.sin(v.x * 12.9 + v.y * 78.2 + v.z * 37.7) * 43758.5
      v.multiplyScalar(0.75 + (k - Math.floor(k)) * 0.45)
      rp.setXYZ(i, v.x, v.y, v.z)
    }
    rockGeo.computeVertexNormals()
  }
  const rockMat = new THREE.MeshStandardMaterial({ color: '#6b6385', roughness: 0.95, metalness: 0.05, flatShading: true })
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, ROCKS)
  scene.add(rocks)
  const rockData = Array.from({ length: ROCKS }, () => {
    const near = Math.random() < 0.2
    return {
      p: new THREE.Vector3((Math.random() - 0.5) * 34, (Math.random() - 0.5) * 18, near ? 1 + Math.random() * 3 : -4 - Math.random() * 14),
      v: new THREE.Vector3(0.15 + Math.random() * 0.35, (Math.random() - 0.5) * 0.1, 0),
      push: new THREE.Vector3(),
      q: new THREE.Quaternion().random(),
      axis: new THREE.Vector3().randomDirection(),
      spin: (Math.random() - 0.5) * 0.8,
      s: new THREE.Vector3(1, 0.6 + Math.random() * 0.5, 0.7 + Math.random() * 0.4).multiplyScalar(near ? 0.12 + Math.random() * 0.12 : 0.1 + Math.random() * 0.35),
    }
  })
  const rockM = new THREE.Matrix4(), rockQ = new THREE.Quaternion(), closest = new THREE.Vector3()

  // --- Lights -------------------------------------------------------------
  const ambient = new THREE.AmbientLight('#ffffff', 0.35)
  const sun = new THREE.DirectionalLight('#ffffff', 2.4)
  sun.position.set(-5, 4, 6)
  const rim = new THREE.PointLight('#a78bfa', 14, 20)
  rim.position.set(4, -1, -4)
  scene.add(ambient, sun, rim)

  // --- Post-processing: bloom makes emissive bits glow (dark theme only) ---
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.35, 0.4, 0.6)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  // --- Theme --------------------------------------------------------------
  const applyTheme = () => {
    const dark = isDark()
    scene.background = new THREE.Color(dark ? '#06060a' : '#f5f3ff')
    starMat.color.set(dark ? '#e9e5ff' : '#7c3aed')
    starMat.opacity = dark ? 0.9 : 0.35
    atmoMat.uniforms.uPower!.value = dark ? 0.45 : 0.4
    paintTerrain(dark)
    wireMat.opacity = dark ? 0.3 : 0.45
    ringMat.opacity = dark ? 0.5 : 0.6
    lightsMat.opacity = dark ? 0.55 : 0
    cometMat.opacity = dark ? 0.7 : 0
    rockMat.color.set(dark ? '#6b6385' : '#b4aed0')
    for (const n of nebulae) n.material.opacity = dark ? 0.1 : 0.06
    bloom.enabled = dark
  }
  applyTheme()
  const stopTheme = watch(() => colorMode.value, applyTheme)

  // --- Layout: planet to the right on wide screens, low and behind on phones.
  const anchor = new THREE.Vector3()
  const layout = () => {
    const wide = innerWidth >= 1024
    anchor.set(wide ? 3.2 : 1.3, wide ? 0 : -2.2, 0)
    world.scale.setScalar(wide ? 1 : 0.8)
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(innerWidth, innerHeight)
    composer.setPixelRatio(renderer.getPixelRatio())
    composer.setSize(innerWidth, innerHeight)
  }
  layout()

  // --- Input --------------------------------------------------------------
  const pointer = new THREE.Vector2(0, 0) // NDC
  const look = { x: 0, y: 0 }
  let overScene = false
  let drag: { x: number, y: number, moved: number } | null = null
  const spin = { x: 0, y: 0 } // angular velocity from dragging
  const raycaster = new THREE.Raycaster()
  let hoverMoon: MoonObj | null = null

  // Pointer is "on the background" when it is not over page content.
  const isBackground = (t: EventTarget | null) => {
    const n = t as HTMLElement | null
    if (!n || !n.closest) return false
    return !n.closest('a,button,input,article,header,footer,h1,h2,p,dl,[data-solid]')
  }

  const onMove = (e: PointerEvent) => {
    pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1)
    overScene = isBackground(e.target)
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y
      drag.moved += Math.abs(dx) + Math.abs(dy)
      spin.y = dx * 0.005
      spin.x = dy * 0.005
      drag.x = e.clientX
      drag.y = e.clientY
    }
  }
  const onDown = (e: PointerEvent) => {
    if (!isBackground(e.target) || e.button !== 0) return
    drag = { x: e.clientX, y: e.clientY, moved: 0 }
  }
  const onUp = () => {
    if (drag && drag.moved < 6) {
      if (hoverMoon) window.open(hoverMoon.data.url, '_blank', 'noopener')
      else { pulseT = 0; spin.y += 0.06 } // tap on empty space: shockwave + kick
    }
    drag = null
  }
  addEventListener('pointermove', onMove, { passive: true })
  addEventListener('pointerdown', onDown)
  addEventListener('pointerup', onUp)
  addEventListener('pointercancel', onUp)
  addEventListener('resize', layout)

  // --- Loop ---------------------------------------------------------------
  let last = performance.now()
  const screen = new THREE.Vector3()
  renderer.setAnimationLoop(() => {
    const now = performance.now()
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    const motion = reduce.matches ? 0 : 1

    // Scroll flies the camera past the planet.
    const s = Math.min(scrollY / innerHeight, 4)
    world.position.set(anchor.x - s * 0.6, anchor.y + s * 1.6, -s * 1.2)

    // Spin: idle rotation + drag inertia.
    planet.rotation.y += 0.06 * motion * dt + spin.y
    world.rotation.x = THREE.MathUtils.clamp(world.rotation.x + spin.x, -0.8, 0.8)
    ring.rotation.z += (0.02 * motion) * dt + spin.y * 0.5
    if (!drag) { spin.x *= 0.92; spin.y *= 0.92 }
    else { spin.x *= 0.5; spin.y *= 0.5 }

    for (const m of moons) m.pivot.rotateY(m.speed * dt * motion)
    stars.rotation.y += 0.003 * dt * motion

    // Shockwave.
    if (pulseT < 1) {
      pulseT = Math.min(1, pulseT + dt * 0.8)
      pulse.scale.setScalar(1.8 + pulseT * 5)
      pulseMat.opacity = (1 - pulseT) ** 2 * (isDark() ? 1 : 0.6)
    }

    // Meteors.
    comets.forEach((c, i) => {
      c.t += dt * motion
      if (c.t > 2.6) { c.t = -2 - Math.random() * 7 }
      else if (c.t > 0 && c.t - dt * motion <= 0) launch(c)
      const live = c.t > 0 && isDark()
      const head = c.p.clone().addScaledVector(c.d, Math.max(0, c.t))
      const tail = head.clone().addScaledVector(c.d, -0.3)
      c.head.visible = live
      c.head.position.copy(head)
      cometPos.set(live ? [head.x, head.y, head.z, tail.x, tail.y, tail.z] : [0, 0, -500, 0, 0, -500], i * 6)
    })
    cometGeo.attributes.position!.needsUpdate = true

    // Asteroids drift, tumble, wrap around and get shoved by the cursor ray.
    raycaster.setFromCamera(pointer, camera)
    rockData.forEach((r, i) => {
      if (overScene) {
        raycaster.ray.closestPointToPoint(r.p, closest)
        const d = closest.distanceTo(r.p)
        if (d < 1.6) r.push.addScaledVector(closest.sub(r.p).normalize(), -(1.6 - d) * 6 * dt)
      }
      r.push.multiplyScalar(0.96)
      r.p.addScaledVector(r.v, dt * motion).addScaledVector(r.push, dt)
      if (r.p.x > 18) r.p.x = -18
      if (r.p.x < -18) r.p.x = 18
      r.p.y = THREE.MathUtils.clamp(r.p.y, -10, 10)
      r.q.multiply(rockQ.setFromAxisAngle(r.axis, (r.spin * motion + r.push.length() * 0.6) * dt))
      rocks.setMatrixAt(i, rockM.compose(r.p, r.q, r.s))
    })
    rocks.instanceMatrix.needsUpdate = true

    // Camera follows the cursor.
    look.x += (pointer.x * 0.9 - look.x) * 0.04
    look.y += (pointer.y * 0.6 - look.y) * 0.04
    camera.position.x = look.x
    camera.position.y = look.y
    camera.lookAt(0, 0, 0)

    // Hover a moon.
    let next: MoonObj | null = null
    if (overScene || drag) {
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(moons.map(m => m.hit), false)[0]
      next = hit ? moons.find(m => m.hit === hit.object) ?? null : null
    }
    if (next !== hoverMoon) {
      if (hoverMoon) {
        (hoverMoon.orbit.material as InstanceType<typeof THREE.LineBasicMaterial>).opacity = 0.12
        ;(hoverMoon.body.material as InstanceType<typeof THREE.MeshStandardMaterial>).emissiveIntensity = 0.12
      }
      hoverMoon = next
      hovered.value = next?.data ?? null
      if (next) {
        (next.orbit.material as InstanceType<typeof THREE.LineBasicMaterial>).opacity = 0.6
        ;(next.body.material as InstanceType<typeof THREE.MeshStandardMaterial>).emissiveIntensity = 0.8
      }
      document.documentElement.style.cursor = next ? 'pointer' : ''
    }
    if (hoverMoon && label.value) {
      hoverMoon.body.getWorldPosition(screen).project(camera)
      label.value.style.transform = `translate(${(screen.x + 1) / 2 * innerWidth + 14}px, ${(1 - screen.y) / 2 * innerHeight - 14}px)`
    }

    composer.render()
  })

  cleanup = () => {
    renderer.setAnimationLoop(null)
    removeEventListener('pointermove', onMove)
    removeEventListener('pointerdown', onDown)
    removeEventListener('pointerup', onUp)
    removeEventListener('pointercancel', onUp)
    removeEventListener('resize', layout)
    stopTheme()
    document.documentElement.style.cursor = ''
    composer.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  }
})
</script>

<template>
  <div ref="host" class="space-bg fixed inset-0 -z-10" aria-hidden="true">
    <div
      v-show="hovered"
      ref="label"
      class="pointer-events-none fixed left-0 top-0 z-10 rounded-lg border border-default bg-default/90 px-3 py-1.5 font-mono text-xs text-highlighted shadow-lg backdrop-blur"
    >
      {{ hovered?.name }} <span class="text-muted">★ {{ hovered?.stars }}</span>
    </div>
  </div>
</template>

<style scoped>
.space-bg {
  background: radial-gradient(60% 60% at 75% 45%, rgb(139 92 246 / 0.25), transparent 70%), var(--ui-bg);
}
.space-bg :deep(canvas) {
  display: block;
}
</style>
