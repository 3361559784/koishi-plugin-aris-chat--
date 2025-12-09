import { describe, it, expect } from 'vitest'
import { getValueByPath, getTimeOfDay, getMoodByCount, countRapidPokes, getAffectionByStyle, analyzePokeStyle } from '../utils'
import type { Config } from '../index'

describe('utility functions', () => {
  it('getValueByPath should extract nested value', () => {
    const obj = { data: { message: 'hello' } }
    expect(getValueByPath(obj, 'data.message')).toBe('hello')
    expect(getValueByPath({ a: { b: 123 } }, 'a.b')).toBe('123')
    expect(getValueByPath({ a: {} }, 'a.b')).toBe(null)
  })

  it('getTimeOfDay should return correct day part', () => {
    // Use explicit timezone offsets to guarantee deterministic behavior across CI environments
    expect(getTimeOfDay(new Date('2025-12-09T06:00:00+08:00'))).toBe('morning')
    expect(getTimeOfDay(new Date('2025-12-09T12:00:00+08:00'))).toBe('noon')
    expect(getTimeOfDay(new Date('2025-12-09T15:00:00+08:00'))).toBe('day')
    expect(getTimeOfDay(new Date('2025-12-09T20:00:00+08:00'))).toBe('night')
    expect(getTimeOfDay(new Date('2025-12-09T03:00:00+08:00'))).toBe('midnight')
  })

  it('getMoodByCount should map counts to moods', () => {
    expect(getMoodByCount(0)).toBe('neutral')
    expect(getMoodByCount(1)).toBe('neutral')
    expect(getMoodByCount(2)).toBe('pleasant')
    expect(getMoodByCount(3)).toBe('pleasant')
    expect(getMoodByCount(4)).toBe('annoyed')
    expect(getMoodByCount(5)).toBe('annoyed')
    expect(getMoodByCount(6)).toBe('angry')
    expect(getMoodByCount(8)).toBe('angry')
    expect(getMoodByCount(9)).toBe('furious')
  })

  it('countRapidPokes should count rapid intervals with threshold', () => {
    expect(countRapidPokes(undefined)).toBe(0)
    expect(countRapidPokes([], 1000)).toBe(0)
    expect(countRapidPokes([500], 1000)).toBe(2)
    expect(countRapidPokes([500, 400, 1200], 1000)).toBe(3)
  })

  it('getAffectionByStyle returns adjusted affection', () => {
    expect(getAffectionByStyle('gentle', 5)).toBe(Math.round(5 * 1.5))
    expect(getAffectionByStyle('fast', 5)).toBe(Math.round(5 * 0.8))
    expect(getAffectionByStyle('flirty', 5)).toBe(Math.round(5 * 1.3))
    expect(getAffectionByStyle('normal', 5)).toBe(5)
  })

  it('analyzePokeStyle reacts to intervals & counts', () => {
    const cfg: Partial<Config> = { gentleInterval: 10000, fastInterval: 1000, flirtyThreshold: 3 }
    expect(analyzePokeStyle(cfg, { intervals: [15000, 16000] }, 2)).toBe('gentle')
    expect(analyzePokeStyle(cfg, { intervals: [500, 600] }, 2)).toBe('fast')
    expect(analyzePokeStyle(cfg, { intervals: [1500, 1200] }, 5)).toBe('flirty')
    expect(analyzePokeStyle(cfg, { intervals: [1500, 1200] }, 2)).toBe('normal')
  })
})
