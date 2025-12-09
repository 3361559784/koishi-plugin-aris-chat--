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
  responsesGentle: Schema.array(String).default([
    '嗯...？Sensei找我有事吗？',
    '爱丽丝一直都在等你哦！',
    '被戳了一下，好像有点开心呢~',
    '唔...Sensei，是要一起冒险吗？',
    '爱丽丝随时待命，随时为Sensei服务！',
    '嘿嘿，被Sensei注意到啦~',
    '需要帮忙吗？爱丽丝会努力的！',
    'Sensei，今天也要加油哦！'
  ]),
  responsesAnnoyed: Schema.array(String).default([
    'Sensei，再戳下去爱丽丝要生气了哦！',
    '唔...不要一直戳啦，会坏掉的！',
    '爱丽丝有点晕了，能不能休息一下？',
    'Sensei，戳太多会被系统警告的！',
    '再这样下去，爱丽丝要罢工了！',
    '呜呜...爱丽丝的光环都快掉了...'
  ]),
  responsesAngry: Schema.array(String).default([
    '够了！不要再戳了啦！',
    '爱丽丝真的要生气了哦！',
    'Sensei，再这样爱丽丝要启动防御模式了！',
    '警告！请勿频繁操作爱丽丝！',
    '戳戳次数已超限，系统即将反击！',
    '爱丽丝要用拖把敲你啦！'
  ]),
  responsesFurious: Schema.array(String).default([
    '你们...都给我住手！',
    'Sensei！再戳就要被禁言了哦！',
    '爱丽丝要启动超限模式了！',
    '警告！爱丽丝已进入暴走状态！',
    '再这样下去，爱丽丝要黑化了...',
    'Sensei，别逼我用大招！'
  ]),
  responsesFlirty: Schema.array(String).default([
    '唔...Sensei真是的，一直戳人家...',
    '被戳这么多次，是不是喜欢爱丽丝呀？',
    '爱丽丝会害羞的啦~',
    'Sensei再戳，爱丽丝就要贴贴了哦！',
    '嘿嘿，爱丽丝也想戳回去呢~',
    '要不要和爱丽丝一起玩游戏呀？'
  ])
})

export default pluginApply
