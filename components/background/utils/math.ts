export class MathUtils {
  static dist(e1: {x: number, y: number}, e2: {x: number, y: number}): number {
    const dx = e1.x - e2.x
    const dy = e1.y - e2.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  static angle(from: {x: number, y: number}, to: {x: number, y: number}): number {
    return Math.atan2(to.y - from.y, to.x - from.x)
  }

  static randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min
  }

  static randomChoice<T>(arr: T[]): T {
    if (arr.length === 0) throw new Error('Array is empty')
    return arr[Math.floor(Math.random() * arr.length)]!
  }

  static normalizeAngle(angle: number): number {
    let a = angle
    while (a < -Math.PI) a += Math.PI * 2
    while (a > Math.PI) a -= Math.PI * 2
    return a
  }

  static randomColor(): string {
    const hue = Math.floor(Math.random() * 360)
    const sat = Math.floor(Math.random() * 30) + 70 // 70-100%
    const light = Math.floor(Math.random() * 40) + 40 // 40-80%
    return `hsl(${hue}, ${sat}%, ${light}%)`
  }
}

