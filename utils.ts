// Utility functions are isolated here so they can be tested without Koishi runtime
export const AFFECTION_CONFIG = { GAIN: { POKE: 5 } }

export function getValueByPath(obj: any, path: string): string | null {
  try {
    const keys = path.split('.')
    let value = obj
    for (const key of keys) {
      value = value[key]
      if (value === undefined) return null
    }
    return typeof value === 'string' ? value : String(value)
  } catch {
    return null
  }
}

export type StyleConfig = { gentleInterval?: number; fastInterval?: number; flirtyThreshold?: number }

export function analyzePokeStyle(config: StyleConfig, pokeStat: { intervals?: number[], count?: number }, currentCount: number): 'gentle'|'fast'|'flirty'|'normal' {
  const intervals = pokeStat.intervals || []
  if (intervals.length < 2) return 'normal'
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
  if ((config.gentleInterval || 30000) && avgInterval > (config.gentleInterval as number)) return 'gentle'
  if ((config.fastInterval || 3000) && avgInterval < (config.fastInterval as number)) return 'fast'
  if (currentCount >= (config.flirtyThreshold || 5) && avgInterval >= (config.fastInterval as number) && avgInterval <= (config.gentleInterval as number)) return 'flirty'
  return 'normal'
}

export function countRapidPokes(intervals?: number[], threshold = 1000): number {
  if (!intervals || intervals.length === 0) return 0
  return intervals.filter(i => i < threshold).length + 1
}

export function getAffectionByStyle(pokeStyle: string, baseAffection = AFFECTION_CONFIG.GAIN.POKE): number {
  const styleMultiplier: Record<string, number> = {
    gentle: 1.5,
    fast: 0.8,
    flirty: 1.3,
    normal: 1.0
  }
  return Math.round(baseAffection * (styleMultiplier[pokeStyle] || 1.0))
}

export function getTimeOfDay(date = new Date()): 'morning' | 'noon' | 'day' | 'night' | 'midnight' {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour === 12) return 'noon'
  if (hour > 12 && hour < 18) return 'day'
  if (hour >= 18 && hour < 24) return 'night'
  return 'midnight'
}

export function getMoodByCount(count: number): string {
  if (count <= 2) return 'neutral'
  if (count <= 4) return 'annoyed'
  if (count <= 7) return 'angry'
  return 'furious'
}
