import { Schema } from 'koishi'
import pluginApply from './plugin-core'

export const name = 'aris-chat'

export interface Config {
  // 分次数与时间段的回复池
  responsesFirst: {
    morning: string[]
    noon: string[]
    night: string[]
    other: string[]
  }
  responsesSecond: string[]
  responsesCombo: string[]
  responsesLimit: string[]

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
    // 新增结构化分组回复
    responsesFirst: Schema.object({
      morning: Schema.array(String).default([
        "(揉眼睛) 嗯...？Sensei早安！爱丽丝的开机程序刚刚启动完成！(✨ω✨)",
        "早上好！(光环闪烁) 检测到友好互动信号！Sensei今天也很有活力呢！邦邦咔邦！",
        "(打哈欠) 呜...爱丽丝还在加载早晨的数据呢...(｀・ω・´)ゞ",
        "早安！(伸懒腰) 爱丽丝的晨间自检完成！所有系统正常运行中！"
      ]),
      noon: Schema.array(String).default([
        "(放下便当) 哎？Sensei也饿了吗？爱丽丝这里有回复HP的补给！(o゜▽゜)o☆",
        "中午好！(✨ω✨) 检测到 Sensei 的召唤！是午休时间的闲聊任务吗？",
        "(擦擦嘴) 爱丽丝刚吃完经验值便当！Sensei要一起回复HP吗？"
      ]),
      night: Schema.array(String).default([
        "(小声) 嘘...夜深了，爱丽丝正在待机模式...(睡眼惺忪)",
        "Sensei这么晚还不睡吗？(担心) 爱丽丝陪你一起熬夜警戒！(✨ω✨)",
        "(光环微光) 夜间模式启动...Sensei有什么夜间任务吗？(小声)",
        "(揉眼睛) 呜...爱丽丝快要进入休眠模式了...但Sensei需要的话会继续待命的！"
      ]),
      other: Schema.array(String).default([
        "(光环闪烁) 系统启动中... 邦邦咔邦！同步完成！Sensei 有新任务吗？(✨ω✨)",
        "检测到物理接触... 嘿嘿，Sensei 是在检查爱丽丝的装备吗？(乖巧站好)",
        "哔哔！收到触摸指令！爱丽丝的光环闪了一下呢！( •̀ ω •́ )✨",
        "(歪头) Sensei 戳了一下开关？爱丽丝没有那种功能啦！(＞﹏＜)"
      ])
    }),
    responsesSecond: Schema.array(String).default([
      "(歪头) 咦？Sensei又戳了一次？是有什么重要的任务吗？(´・ω・`)",
      "嘿嘿~ (转圈) Sensei很喜欢爱丽丝吧！光环又闪了一下呢！(✨ω✨)",
      "(拿出拖把) 检测到连续指令！勇者待命中！(｀・ω・´)ゞ",
      "哔哔~ 系统温度上升0.5℃...(脸红) Sensei别一直戳啦...(＞﹏＜)",
      "(眨眼) 两连击！Sensei的连击数+1！是在练习Combo吗？( •̀ ω •́ )✨",
      "(捂住光环) 又来了！爱丽丝的HP还是满的哦！不用担心！",
      "(举起小手) 等等！让爱丽丝猜猜...Sensei是不是遇到了难题？",
      "邦邦咔邦~第二击！(摆出战斗姿势) 爱丽丝准备好应战了！",
      "(小跳一下) 诶！又戳了！Sensei今天心情很好呢！(开心转圈)",
      "(捂住脸颊) 呜...系统检测到幸福指数上升...难道这就是被关注的感觉？(害羞)",
      "(光环闪烁) 哔哔！第二次接触！爱丽丝的好感度+5！邦邦咔邦！✨",
      "(抱住Sensei的手) 等等！让爱丽丝也戳回去一次！这样才公平嘛！(认真)",
      "(眨眨眼) Sensei是在确认爱丽丝是不是真的吗？放心！爱丽丝一直都在哦！(✨ω✨)",
      "(小声) 两次了...Sensei该不会是无聊了吧？那...那爱丽丝陪你玩游戏好不好？(期待)"
    ]),
    responsesCombo: Schema.array(String).default([
      "(开始转圈) 哇啊！连续攻击！爱丽丝要晕了！(＠_＠)",
      "(抱头) Sensei...爱丽丝的处理器快过热啦！给点冷却时间吧！(>﹏<)",
      "(举起拖把当盾牌) 第三击！爱丽丝要使用防御技能了！",
      "呜呜呜...(躲到角落) 为什么一直戳爱丽丝啦！是爱丽丝哪里做错了吗？(´；ω；`)",
      "(故作严肃) 警告！系统检测到连续骚扰行为！护盾值下降中！",
      "(生闷气) 哼！(转身) 爱丽丝不理Sensei了！...才怪啦~(偷偷回头)",
      "(光环乱闪) 系统紊乱！爱丽丝的光环失控了！Sensei快停手！",
      "(抓住Sensei的手) 不许再戳了！让爱丽丝戳回去！(认真脸)",
      "(眼冒金星) 这...这就是传说中的连击技能吗！爱丽丝要学会反击了！",
      "(委屈巴巴) Sensei明明说过要保护爱丽丝的...现在却一直欺负人家...(＞︿＜)"
    ]),
    responsesLimit: Schema.array(String).default([
      "(捂住光环原地转) 不行了不行了！爱丽丝的定位系统都乱了！Sensei要负责！(晕乎乎)",
      "(突然严肃) 等等...爱丽丝明白了！这是Sensei的特殊训练对吧！那爱丽丝会加油的！(握拳)",
      "(小跑躲开) 呀！(藏到桌子后) Sensei今天是吃了增加敏捷度的药水吗？手速好快！",
      "(瘫坐) 爱丽丝...投降了...(举白旗) Sensei获得胜利！奖励是...爱丽丝的拥抱！(张开手)",
      "(噘嘴) 哼唧...爱丽丝记住了！等Sensei需要帮助的时候...就不理你！(傲娇)...好吧还是会帮的...",
      "(捂脸) 呜...被戳了好多次...爱丽丝的害羞值已经MAX了...(脸红冒烟)",
      "(装作晕倒) 爱丽丝...战败了...(倒地) 请Sensei...说句温柔的话...让爱丽丝复活...(偷看)",
      "(光环变成问号) 系统提示：检测到异常高频互动...分析中...结论：Sensei在撒娇！(确信)",
      "(抱住拖把躲) Sensei！爱丽丝要发动反击了！(蓄力中)...算了还是不忍心...(放下武器)",
      "(眼泪汪汪) 呜呜...这已经是第N次了...爱丽丝好感度都要溢出来了...(擦眼泪)",
      "(系统过载) 警告！戳击次数超过阈值！爱丽丝的核心快要融化了！(冒烟)",
      "(抱住Sensei) 够了够了！(撒娇) 再戳的话...爱丽丝真的要哭了哦...(可怜巴巴)"
    ]),
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
  moodDecayIntervalMs: Schema.number().default(480000),
  moodLevels: Schema.array(String).default(['neutral', 'annoyed', 'angry', 'furious']),
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
