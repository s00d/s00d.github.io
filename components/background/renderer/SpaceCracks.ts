import { MathUtils } from '../utils/math'

export class SpaceCracks {
  segments: { x1: number, y1: number, x2: number, y2: number, width: number, alpha: number }[] = []
  active: boolean = false
  life: number = 0

  generate(cx: number, cy: number, width: number, height: number) {
    this.segments = []
    this.active = true
    this.life = 1.0

    // 1. Рандомное количество основных трещин (было фиксировано 7)
    const numCracks = Math.floor(MathUtils.randomRange(5, 12))

    // 2. Глобальный поворот (чтобы первая трещина не всегда смотрела вправо)
    const globalRotation = Math.random() * Math.PI * 2

    for (let i = 0; i < numCracks; i++) {
      // Базовый угол + глобальный поворот + джиттер
      let angle = globalRotation + (Math.PI * 2 * i) / numCracks + MathUtils.randomRange(-0.4, 0.4)

      let currentX = cx
      let currentY = cy

      // Не рисуем до самого края каждый раз, делаем рандомную длину
      const maxDist = Math.max(width, height) * MathUtils.randomRange(0.5, 0.9)
      let distTraveled = 0

      while (distTraveled < maxDist) {
        // Рандомная длина сегмента (зигзага)
        const step = MathUtils.randomRange(40, 120)

        // Изменяем угол для зигзага
        angle += MathUtils.randomRange(-0.6, 0.6)

        const nextX = currentX + Math.cos(angle) * step
        const nextY = currentY + Math.sin(angle) * step

        this.segments.push({
          x1: currentX, y1: currentY,
          x2: nextX, y2: nextY,
          width: Math.max(1, 6 - (distTraveled / 150)), // Толщина падает быстрее
          alpha: MathUtils.randomRange(0.4, 1.0) // Разная яркость сегментов
        })

        // Шанс ответвления (маленькая трещинка вбок)
        if (Math.random() < 0.3) {
          const branchAngle = angle + MathUtils.randomRange(0.5, 1.5) * (Math.random() > 0.5 ? 1 : -1)
          const branchLen = MathUtils.randomRange(30, 60)
          this.segments.push({
            x1: currentX, y1: currentY,
            x2: currentX + Math.cos(branchAngle) * branchLen,
            y2: currentY + Math.sin(branchAngle) * branchLen,
            width: 1,
            alpha: 0.5
          })
        }

        currentX = nextX
        currentY = nextY
        distTraveled += step
      }
    }
  }

  update(isReforming: boolean) {
    if (!this.active) return

    if (isReforming) {
      this.life -= 0.015
    } else {
      // Мерцание при взрыве
      this.life = 1.0 - Math.random() * 0.1
    }

    if (this.life <= 0) {
      this.active = false
      this.segments = []
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (!this.active) return

    ctx.save()
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#a5f3fc' // Cyan светящийся

    ctx.beginPath()
    for (let i = 0; i < this.segments.length; i++) {
      const s = this.segments[i]
      if (!s) continue
      if (this.life * s.alpha > 0.05) {
        // Динамическая ширина зависит от жизни (эффект затягивания)
        ctx.lineWidth = s.width * this.life
        ctx.moveTo(s.x1, s.y1)
        ctx.lineTo(s.x2, s.y2)
      }
    }
    ctx.globalAlpha = this.life
    ctx.stroke()
    ctx.restore()
  }
}

