import { Schema } from 'koishi'
import pluginApply from './plugin-core'

export const name = 'aris-chat'

export interface Config {
  pokeWindowMs: number
  userPokeCooldownMs: number
  groupCooldownMs: number
  justRepliedMs: number
  pokeAngryThreshold: number
  pokeCounterThreshold: number
  pokeGroupThreshold: number
  gentleInterval: number
  fastInterval: number
  flirtyThreshold: number
  rapidCounterThreshold: number
  rapidInterval: number
  counterMin: number
  counterMax: number
  counterCooldown: number
  muteDuration: number
  enableGroupCounting: boolean
  enableCounterPoke: boolean
  enableMoodDecay: boolean
  enableApiResponse: boolean
  adminIds: string[]
  apiUrl: string
  apiMethod: 'GET' | 'POST'
  apiHeaders: Record<string, string>
  apiTimeout: number
  apiResponsePath: string
  moodDecayIntervalMs: number
  moodLevels: string[]
  persistenceEnable?: boolean
  responsesGentle: string[]
  responsesAnnoyed: string[]
  responsesAngry: string[]
  responsesFurious: string[]
  responsesFlirty: string[]
}

export const Config = Schema.object({
  pokeWindowMs: Schema.number().default(480000),
  userPokeCooldownMs: Schema.number().default(2000),
  groupCooldownMs: Schema.number().default(8000),
  justRepliedMs: Schema.number().default(15000),
  pokeAngryThreshold: Schema.number().default(3),
  pokeCounterThreshold: Schema.number().default(5),
  pokeGroupThreshold: Schema.number().default(5),
  gentleInterval: Schema.number().default(30000),
  fastInterval: Schema.number().default(3000),
  flirtyThreshold: Schema.number().default(5),
  rapidCounterThreshold: Schema.number().default(8),
  rapidInterval: Schema.number().default(1000),
  counterMin: Schema.number().default(2),
  counterMax: Schema.number().default(5),
  counterCooldown: Schema.number().default(30000),
  muteDuration: Schema.number().default(0),
  enableGroupCounting: Schema.boolean().default(true),
  enableCounterPoke: Schema.boolean().default(true),
  enableMoodDecay: Schema.boolean().default(true),
  enableApiResponse: Schema.boolean().default(false),
  adminIds: Schema.array(String).default([]),
  apiUrl: Schema.string().default(''),
  apiMethod: Schema.union(['GET','POST']).default('POST'),
  apiHeaders: Schema.dict(String).default({ 'Content-Type': 'application/json' }),
  apiTimeout: Schema.number().default(5000),
  apiResponsePath: Schema.string().default('data.message'),
  moodDecayIntervalMs: Schema.number().default(300000),
  moodLevels: Schema.array(String).default(['neutral', 'pleasant', 'annoyed', 'angry', 'furious']),
  persistenceEnable: Schema.boolean().default(false),
  responsesGentle: Schema.array(String).default(['嗯...？Sensei找我有事吗']),
  responsesAnnoyed: Schema.array(String).default(['...Sensei，别一直戳了啦']),
  responsesAngry: Schema.array(String).default(['够了...不要再戳了']),
  responsesFurious: Schema.array(String).default(['你们...都给我住手']),
  responsesFlirty: Schema.array(String).default(['唔...Sensei真是的'])
})

export default pluginApply
