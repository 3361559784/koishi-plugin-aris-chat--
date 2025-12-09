import { Context, Schema, Session } from 'koishi'

export const name = 'aris-chat'

// 配置接口
export interface Config {
  // 窗口期配置
  pokeWindowMs: number           // 连续戳计数窗口 (默认8分钟)
  userPokeCooldownMs: number     // 单用户戳冷却期 (防刷屏)
  groupCooldownMs: number        // 群组响应冷却期
  justRepliedMs: number          // "刚回复过"的时间阈值
  
  // 阈值配置
  pokeAngryThreshold: number     // 触发生气的阈值
  pokeCounterThreshold: number   // 触发反击的阈值
  pokeGroupThreshold: number     // 群组累计戳阈值
  
  // 风格配置
  gentleInterval: number         // 温柔模式响应间隔
  fastInterval: number           // 快速响应间隔
  flirtyThreshold: number        // 撒娇模式阈值
  rapidCounterThreshold: number  // 快速反击阈值
  rapidInterval: number          // 快速反击间隔
  counterMin: number             // 最小反击次数
  counterMax: number             // 最大反击次数
  counterCooldown: number        // 反击冷却期
  muteDuration: number           // 反击后禁言时间 (秒, 0 表示不禁言)
  
  // 功能开关
  enableGroupCounting: boolean   // 启用群组计数
  enableCounterPoke: boolean     // 启用反击戳
  enableMoodDecay: boolean       // 启用情绪衰减
  enableApiResponse: boolean     // 启用 API 动态回复
  adminIds: string[]             // 管理员 ID 列表，允许运行管理命令
  
  // API 配置
  apiUrl: string                 // API 端点地址
  apiMethod: 'GET' | 'POST'      // 请求方法
  apiHeaders: Record<string, string>  // 请求头
  apiTimeout: number             // 超时时间
  apiResponsePath: string        // 响应数据路径 (例如: data.message)
  
  // 情绪系统配置
  moodDecayIntervalMs: number    // 情绪衰减间隔
  moodLevels: string[]           // 情绪等级

  // 持久化配置
  persistenceEnable?: boolean
  // persistenceBackend, persistenceRedisUrl, persistenceSqlitePath removed - use Koishi DB (ctx.database)
  
  // 回复文本配置
  responsesGentle: string[]      // 温柔回复
  responsesAnnoyed: string[]     // 不耐烦回复
  responsesAngry: string[]       // 生气回复
  responsesFurious: string[]     // 暴怒回复
  responsesFlirty: string[]      // 撒娇回复
}

export default apply

// 默认配置
export const Config = Schema.object({
  // 窗口期配置
  pokeWindowMs: Schema.number().default(480000).description('连续戳计数窗口时间 (毫秒, 默认8分钟)'),
  userPokeCooldownMs: Schema.number().default(2000).description('单用户戳冷却期 (毫秒, 防刷屏)'),
  groupCooldownMs: Schema.number().default(8000).description('群组响应冷却期 (毫秒)'),
  justRepliedMs: Schema.number().default(15000).description('刚回复过的时间阈值 (毫秒)'),
  
  // 阈值配置
  pokeAngryThreshold: Schema.number().default(3).description('触发生气的戳次数'),
  pokeCounterThreshold: Schema.number().default(5).description('触发反击的戳次数'),
  pokeGroupThreshold: Schema.number().default(5).description('群组累计戳阈值'),
  
  // 风格配置
  gentleInterval: Schema.number().default(30000).description('温柔模式响应间隔 (毫秒)'),
  fastInterval: Schema.number().default(3000).description('快速响应间隔 (毫秒)'),
  flirtyThreshold: Schema.number().default(5).description('撒娇模式阈值'),
  rapidCounterThreshold: Schema.number().default(8).description('快速反击阈值'),
  rapidInterval: Schema.number().default(1000).description('快速反击间隔 (毫秒)'),
  counterMin: Schema.number().default(2).description('最小反击次数'),
  counterMax: Schema.number().default(5).description('最大反击次数'),
  counterCooldown: Schema.number().default(30000).description('反击冷却期 (毫秒)'),
  muteDuration: Schema.number().default(0).description('反击后禁言时间 (秒, 0 表示不禁言)'),
  
  // 功能开关
  enableGroupCounting: Schema.boolean().default(true).description('启用群组计数'),
  enableCounterPoke: Schema.boolean().default(true).description('启用反击戳'),
  enableMoodDecay: Schema.boolean().default(true).description('启用情绪衰减'),
  enableApiResponse: Schema.boolean().default(false).description('启用 API 动态回复 (开启后将调用外部 API 生成回复)'),
  adminIds: Schema.array(String).default([]).description('管理员 ID 列表，允许运行管理命令'),
  
  // API 配置
  apiUrl: Schema.string().default('').description('API 端点地址 (例如: http://localhost:3000/api/poke)'),
  apiMethod: Schema.union(['GET', 'POST']).default('POST').description('HTTP 请求方法'),
  apiHeaders: Schema.dict(String).default({ 'Content-Type': 'application/json' }).description('请求头配置'),
  apiTimeout: Schema.number().default(5000).description('API 请求超时时间 (毫秒)'),
  apiResponsePath: Schema.string().default('data.message').description('响应数据路径 (支持点号分隔, 例如: data.message 或 result.text)'),
  
  // 情绪系统配置（5 段情绪，衰减间隔默认 5 分钟）
  moodDecayIntervalMs: Schema.number().default(300000).description('情绪衰减间隔 (毫秒, 默认5分钟)'),
  moodLevels: Schema.array(String).default(['neutral', 'pleasant', 'annoyed', 'angry', 'furious']).description('情绪等级（5 段）'),
  persistenceEnable: Schema.boolean().default(false).description('启用持久化（Redis/SQLite）'),
  // persistenceBackend and related fields removed to enforce using Koishi database service
  
  // 回复文本配置
  responsesGentle: Schema.array(String).default([
    '嗯...？Sensei找我有事吗',
    '怎么了呢，Sensei',
    '...在',
    '唔...怎么啦',
    '有什么指示吗，Sensei',
    '...需要我做什么',
    '诶...Sensei戳我干什么',
    '系统待机中...Sensei有任务吗'
  ]).description('温柔回复文本列表'),
  
  
  responsesAnnoyed: Schema.array(String).default([
    '...Sensei，别一直戳了啦',
    '已经戳很多次了...有点烦',
    '唔...能不能不要一直戳',
    '...系统有点过载了',
    '再戳下去我要生气了哦',
    '别闹了...Sensei'
  ]).description('不耐烦回复文本列表'),
  
  
  responsesAngry: Schema.array(String).default([
    '够了...不要再戳了',
    '...真的生气了',
    'Sensei是故意的吗...',
    '别再这样了...',
    '...讨厌，真的讨厌',
    '系统警告...请停止',
    '不许再戳了...'
  ]).description('生气回复文本列表'),
  
  
  responsesFurious: Schema.array(String).default([
    '你们...都给我住手',
    '...整个群都在欺负我吗',
    '太过分了...真的太过分了',
    '系统即将过载...',
    '...受不了了',
    '不要再戳了...求你们了',
  ]).description('暴怒回复文本列表 (群组模式)'),
  
  
  responsesFlirty: Schema.array(String).default([
    '唔...Sensei真是的',
    '...好啦好啦，知道啦',
    '就知道欺负我',
    '真拿你没办法呢，Sensei',
    '...哼，坏Sensei',
    '...知道了知道了'
  ]).description('撒娇回复文本列表')
})

// 用户戳一戳状态
interface UserPokeState {
  count: number                  // 戳次数
  lastPokeTime: number           // 最后一次戳的时间
  lastReplyTime: number          // 最后一次回复的时间
  lastCounterTime: number        // 最后一次反击的时间
  windowTimer?: ReturnType<typeof setTimeout>   // 窗口计时器
  intervals?: number[]           // 最近戳击间隔数组(毫秒)
  pokeStyle?: string             // 当前戳一戳节奏类型
}

// 群组戳一戳状态
interface GroupPokeState {
  count: number                  // 群组累计戳次数
  mood: string                   // 当前情绪
  lastDecayTime: number          // 最后一次衰减时间
  decayTimer?: ReturnType<typeof setTimeout>    // 衰减计时器
  intervals?: number[]           // 群内戳击间隔
}

export async function apply(ctx: Context, config: Config) {
  // Define DB models if Koishi DB is available
  try {
    // Smart poke user table
    ctx.model.extend('aris_chat_user', {
      id: 'string',             // primary key: guildId:userId or userId
      guildId: 'string',
      userId: 'string',
      count: 'integer',
      lastPokeTime: 'integer',
      lastReplyTime: 'integer',
      lastCounterTime: 'integer',
      intervals: 'text',        // JSON string
      pokeStyle: 'string',
    });

    // Smart poke group table
    ctx.model.extend('aris_chat_group', {
      id: 'string',             // primary key: guildId
      guildId: 'string',
      count: 'integer',
      mood: 'string',
      lastDecayTime: 'integer',
      intervals: 'text',        // JSON string
    });
  } catch (err) {
    // ignore if ctx.model not supported
  }
  // Koishi database service is required (declared in package.json)
  // No more in-memory Map - we use database directly with lazy loading

  // Adapter helpers placed here to ensure ctx is available
  async function safeSendPokeBack(session: Session, userId: string) {
    try {
      const platform = (session.platform || '').toLowerCase()
      const internal = (session.bot as any)?.internal
      if (platform === 'onebot' && internal && typeof internal.sendGroupMsg === 'function') {
        await internal.sendGroupMsg(session.guildId, { type: 'poke', data: { qq: userId } })
        return true
      }
      // fallback to a visible text response for non-onebot platforms
      if (session.send && typeof session.send === 'function') {
        await session.send('(反击尝试) 无法在当前平台执行原生戳，已用文本替代')
        return true
      }
      return false
    } catch (err) {
      ctx.logger('aris-chat').warn('safeSendPokeBack failed', err)
      return false
    }
  }

  async function safeSetGroupBan(session: Session, userId: string, seconds: number) {
    try {
      const platform = (session.platform || '').toLowerCase()
      const internal = (session.bot as any)?.internal
      if (platform === 'onebot' && internal && typeof internal.set_group_ban === 'function') {
        await internal.set_group_ban({ group_id: Number(session.guildId), user_id: Number(userId), duration: seconds })
        return true
      }
      if ((session.bot as any)?.setGroupBan && typeof (session.bot as any).setGroupBan === 'function') {
        await (session.bot as any).setGroupBan(session.guildId, userId, seconds)
        return true
      }
      if (session.send && typeof session.send === 'function') {
        await session.send(`(提示) 本平台不支持程序化禁言，无法禁言 ${userId}`)
      }
      return false
    } catch (err) {
      ctx.logger('aris-chat').warn('safeSetGroupBan failed', err)
      return false
    }
  }
  
  // 辅助函数: 从对象路径获取值 (例如: 'data.message' -> obj.data.message)
  function getValueByPath(obj: any, path: string): string | null {
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
  
  // 辅助函数: 调用外部 API 获取动态回复
  async function getApiResponse(mood: string, pokeCount: number, userId: string, guildId?: string): Promise<string | null> {
    if (!config.enableApiResponse || !config.apiUrl) return null
    
    try {
      const requestData = {
        mood,
        pokeCount,
        userId,
        guildId,
        timestamp: Date.now()
      }
      
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), config.apiTimeout)
      
      const options: RequestInit = {
        method: config.apiMethod,
        headers: config.apiHeaders,
        signal: controller.signal
      }
      
      if (config.apiMethod === 'POST') {
        options.body = JSON.stringify(requestData)
      }
      
      const url = config.apiMethod === 'GET' 
        ? `${config.apiUrl}?mood=${mood}&pokeCount=${pokeCount}&userId=${userId}${guildId ? `&guildId=${guildId}` : ''}`
        : config.apiUrl
      
      const response = await fetch(url, options)
      clearTimeout(timeout)
      
      if (!response.ok) return null
      
      const data = await response.json()
      const message = getValueByPath(data, config.apiResponsePath)
      
      return message
    } catch (error) {
      ctx.logger('aris-chat').warn('API 调用失败:', error)
      return null
    }
  }
  
  // 辅助函数: 生成用户唯一键
  function getUserKey(session: Session): string {
    return session.guildId ? `${session.guildId}:${session.userId}` : session.userId
  }
  
  // 辅助函数: 随机选择回复
  function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
  }
  


  // 好感度 map (内存版)
  const affectionMap = new Map<string, number>()
  const AFFECTION_CONFIG = { GAIN: { POKE: 5 } }

  // 分析戳一戳节奏: gentle | fast | flirty | normal
  function analyzePokeStyle(pokeStat: { intervals?: number[], count?: number }, currentCount: number): 'gentle'|'fast'|'flirty'|'normal' {
    const intervals = pokeStat.intervals || []
    if (intervals.length < 2) return 'normal'
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    if (avgInterval > config.gentleInterval) return 'gentle'
    if (avgInterval < config.fastInterval) return 'fast'
    if (currentCount >= config.flirtyThreshold && avgInterval >= config.fastInterval && avgInterval <= config.gentleInterval) return 'flirty'
    return 'normal'
  }

  // 统计快速戳次数（间隔 < rapidInterval）
  function countRapidPokes(intervals?: number[]): number {
    if (!intervals || intervals.length === 0) return 0
    return intervals.filter(i => i < config.rapidInterval).length + 1
  }

  // 根据 pokeStyle 调整回复数组（30% 概率加入特殊回复）
  function adjustRepliesByStyle(replies: string[], pokeStyle: string): string[] {
    const styleReplies: Record<string, string[]> = {
      gentle: [
        '(温柔地看着Sensei) 嗯...？好久没有这么温柔的互动了呢...(微笑) 爱丽丝很开心哦！✨',
        '(安静地靠近) 谢谢Sensei...这样的互动让爱丽丝感觉很温暖...'
      ],
      fast: [
        '(眼花缭乱) 哇哇哇！这速度！Sensei是开了加速Buff吗！(＠_＠)',
        '(抱头) 太快了！爱丽丝跟不上啦！(>﹏<)'
      ],
      flirty: [
        '(害羞) 呜...Sensei一直戳...是在撒娇吗？(脸红)',
        '(捂脸) 这种节奏...爱丽丝害羞值上升了！(///ω///)'
      ],
      normal: []
    }
    if (styleReplies[pokeStyle] && Math.random() < 0.3) {
      return [...replies, ...styleReplies[pokeStyle]]
    }
    return replies
  }

  // 根据 pokeStyle 调整好感度
  function getAffectionByStyle(pokeStyle: string, baseAffection = AFFECTION_CONFIG.GAIN.POKE): number {
    const styleMultiplier: Record<string, number> = {
      gentle: 1.5,
      fast: 0.8,
      flirty: 1.3,
      normal: 1.0
    }
    return Math.round(baseAffection * (styleMultiplier[pokeStyle] || 1.0))
  }

  // 时间段检测（基于本地时区）
  function getTimeOfDay(date = new Date()): 'morning' | 'noon' | 'day' | 'night' | 'midnight' {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour === 12) return 'noon'
    if (hour > 12 && hour < 18) return 'day'
    if (hour >= 18 && hour < 24) return 'night'
    return 'midnight'
  }
  


  // ========== 核心数据库交互函数 (使用正确的 Minato API) ==========
  
  // 获取用户状态 (按需从数据库读取 - Lazy Load)
  async function getUserState(session: Session): Promise<UserPokeState> {
    const id = getUserKey(session)
    
    // 使用正确的 Minato API: ctx.database.get(table, query)
    const [found] = await ctx.database.get('aris_chat_user', { id })
    
    if (found) {
      return {
        count: found.count,
        lastPokeTime: found.lastPokeTime,
        lastReplyTime: found.lastReplyTime,
        lastCounterTime: found.lastCounterTime,
        intervals: found.intervals ? JSON.parse(found.intervals) : [],
        pokeStyle: found.pokeStyle || 'normal'
      }
    }

    // 没找到则返回初始状态
    return {
      count: 0,
      lastPokeTime: 0,
      lastReplyTime: 0,
      lastCounterTime: 0,
      intervals: [],
      pokeStyle: 'normal'
    }
  }

  // 保存用户状态 (使用 upsert: 有则更新,无则插入)
  async function saveUserState(session: Session, state: UserPokeState) {
    const id = getUserKey(session)
    const guildId = session.guildId || ''
    const userId = session.userId || ''

    // 使用正确的 Minato API: ctx.database.upsert(table, [rows])
    await ctx.database.upsert('aris_chat_user', [{
      id: id,
      guildId: guildId,
      userId: userId,
      count: state.count,
      lastPokeTime: state.lastPokeTime,
      lastReplyTime: state.lastReplyTime,
      lastCounterTime: state.lastCounterTime,
      intervals: JSON.stringify(state.intervals || []),
      pokeStyle: state.pokeStyle
    }])
  }

  // 获取群组状态 (按需从数据库读取)
  async function getGroupState(guildId: string): Promise<GroupPokeState> {
    const [found] = await ctx.database.get('aris_chat_group', { id: guildId })
    
    if (found) {
      return {
        count: found.count,
        mood: found.mood,
        lastDecayTime: found.lastDecayTime,
        intervals: found.intervals ? JSON.parse(found.intervals) : []
      }
    }
    
    return {
      count: 0,
      mood: 'neutral',
      lastDecayTime: Date.now(),
      intervals: []
    }
  }

  // 保存群组状态 (使用 upsert)
  async function saveGroupState(guildId: string, state: GroupPokeState) {
    await ctx.database.upsert('aris_chat_group', [{
      id: guildId,
      guildId: guildId,
      count: state.count,
      mood: state.mood,
      lastDecayTime: state.lastDecayTime,
      intervals: JSON.stringify(state.intervals || [])
    }])
  }
  
  // 辅助函数: 根据计数获取情绪等级
  function getMoodByCount(count: number): string {
    // 5 段情绪：neutral -> pleasant -> annoyed -> angry -> furious
    // 阈值分配（可调）：
    // 0..1 => neutral
    // 2..3 => pleasant
    // 4..5 => annoyed
    // 6..8 => angry
    // >=9 => furious
    if (count < 2) return 'neutral'
    if (count < 4) return 'pleasant'
    if (count < 6) return 'annoyed'
    if (count < 9) return 'angry'
    return 'furious'
  }
  
  // 辅助函数: 启动情绪衰减计时器
  async function startMoodDecay(guildId: string) {
    if (!config.enableMoodDecay) return
    
    // ✅ 异步获取群组状态
    const groupState = await getGroupState(guildId)
    
    // 清除旧计时器
    if (groupState.decayTimer) {
      clearTimeout(groupState.decayTimer)
    }
    
    // 启动新计时器
    groupState.decayTimer = setTimeout(async () => {
      const currentState = await getGroupState(guildId)
      if (currentState.count > 0) {
        currentState.count = Math.max(0, currentState.count - 1)
        currentState.mood = getMoodByCount(currentState.count)
        currentState.lastDecayTime = Date.now()
        
        // ✅ 保存更新后的状态
        await saveGroupState(guildId, currentState)
        
        // 如果还有计数，继续衰减
        if (currentState.count > 0) {
          await startMoodDecay(guildId)
        }
      }
    }, config.moodDecayIntervalMs)
  }
  
  // 监听戳一戳事件
  ctx.on('notice/poke', async (session: Session) => {
    // 只响应戳机器人的事件
    if (session.targetId !== session.bot.selfId) return
    
    const now = Date.now()
    const userKey = getUserKey(session)
    // ✅ 异步读取用户状态
    const userState = await getUserState(session)
    
    // 检查用户冷却
    if (now - userState.lastPokeTime < config.userPokeCooldownMs) {
      return
    }
    
    // 更新最后戳时间
    userState.lastPokeTime = now
    
    // 清除旧的窗口计时器
    if (userState.windowTimer) {
      clearTimeout(userState.windowTimer)
    }
    
    // 增加戳次数
    userState.count++
    // ✅ 异步保存用户状态
    await saveUserState(session, userState)
    
    // 启动新的窗口计时器 (窗口期结束后重置计数)
    userState.windowTimer = setTimeout(async () => {
      userState.count = 0
      await saveUserState(session, userState)
    }, config.pokeWindowMs)
    
    // 群组戳计数
    let groupState: GroupPokeState | null = null
    if (config.enableGroupCounting && session.guildId) {
      // ✅ 异步读取群组状态
      groupState = await getGroupState(session.guildId)
      
      // 检查群组冷却
      if (now - userState.lastReplyTime < config.groupCooldownMs) {
        return
      }
      
      groupState.count++
      // ✅ 异步保存群组状态
      await saveGroupState(session.guildId, groupState)
      groupState.mood = getMoodByCount(groupState.count)
      
      // 启动情绪衰减
      startMoodDecay(session.guildId)
    }
    
    // 判断是否"刚回复过"
    const justReplied = now - userState.lastReplyTime < config.justRepliedMs
    
    // 决定响应策略
    let responseText: string
    let shouldCounterPoke = false
    let counterCount = 0
    let moodType = 'gentle'
    
    // 优先级1: 群组模式优先处理
    if (groupState) {
      if (groupState.mood === 'furious') {
      moodType = 'furious'
      responseText = randomChoice(config.responsesFurious)
      shouldCounterPoke = config.enableCounterPoke
      counterCount = Math.floor(Math.random() * (config.counterMax - config.counterMin + 1)) + config.counterMin
      } else if (groupState.mood === 'angry') {
        responseText = randomChoice(config.responsesAngry)
      } else if (groupState.mood === 'annoyed') {
        responseText = randomChoice(config.responsesAnnoyed)
      } else {
        responseText = randomChoice(config.responsesGentle)
      }
      // group handling done
    }
    // per-user模式（当没有群组计数时）
    else {
      const pokeCount = userState.count
      const timeOfDay = getTimeOfDay(new Date())
      const pokeStyle = userState.pokeStyle || 'normal'
      let pokeReplies: string[] = []
      
      // 计算快速戳和特殊触发
      const rapidPokeCount = countRapidPokes(userState.intervals)
      const timeSinceLastCounter = now - (userState.lastCounterTime || 0)
      
      // 快速连击反击逻辑
      if (rapidPokeCount >= config.rapidCounterThreshold && timeSinceLastCounter > config.counterCooldown) {
        pokeReplies = [
          '够了够了！(╬▔皿▔)╯ 你这是在玩打地鼠游戏吗！看爱丽丝的连击反击！',
          '系统警告：检测到恶意刷屏！(▼皿▼#) 启动自动防御程序——连续反戳模式！',
          '哇啊啊！(抱头乱转) 手速这么快！爱丽丝要用最高速度反击回去！邦邦咔邦×N！'
        ]
        shouldCounterPoke = true
        counterCount = Math.floor(Math.random() * (config.counterMax - config.counterMin + 1)) + config.counterMin
        userState.lastCounterTime = now
        await saveUserState(session, userState)
        userState.count = 0
      }
      // 五连戳反击
      else if (pokeCount >= config.pokeCounterThreshold) {
        pokeReplies = [
          '受够了！看我反击！(╬▔皿▔)╯ 光之剑——发动！',
          '警告无效！(怒) 爱丽丝的反击模式启动！邦邦咔邦——反弹伤害！',
          '系统过载！(▼皿▼#) 强制反击程序执行！Sensei 你完蛋了！'
        ]
        shouldCounterPoke = true
        counterCount = 1
        userState.count = 0
      }
      // 三连戳: 生气
      else if (pokeCount >= config.pokeAngryThreshold) {
        pokeReplies = [
          '不许再戳了！(▼へ▼メ) 爱丽丝的忍耐值快要归零了！',
          '(鼓起脸颊) 呜...再戳的话爱丽丝真的要生气了哦！(｀へ´)',
          'Sensei！(捂住光环) 这样一直戳，爱丽丝的系统会死机的！'
        ]
      }
      else {
        // 根据戳数选择更细粒度的回复
        if (pokeCount === 1) {
          if (timeOfDay === 'morning') {
            pokeReplies = [
              '(揉眼睛) 嗯...？Sensei早安！爱丽丝的开机程序刚刚启动完成！(✨ω✨)',
              '早上好！(光环闪烁) 检测到友好互动信号！Sensei今天也很有活力呢！邦邦咔邦！',
              '(打哈欠) 呜...爱丽丝还在加载早晨的数据呢...(｀・ω・´)ゞ',
              '早安！(伸懒腰) 爱丽丝的晨间自检完成！所有系统正常运行中！'
            ]
          } else if (timeOfDay === 'night' || timeOfDay === 'midnight') {
            pokeReplies = [
              '(小声) 嘘...夜深了，爱丽丝正在待机模式...(睡眼惺忪)',
              'Sensei这么晚还不睡吗？(担心) 爱丽丝陪你一起熬夜警戒！(✨ω✨)',
              '(光环微光) 夜间模式启动...Sensei有什么夜间任务吗？(小声)',
              '(揉眼睛) 呜...爱丽丝快要进入休眠模式了...但Sensei需要的话会继续待命的！'
            ]
          } else if (timeOfDay === 'noon') {
            pokeReplies = [
              '(放下便当) 哎？Sensei也饿了吗？爱丽丝这里有回复HP的补给！(o゜▽゜)o☆',
              '中午好！(✨ω✨) 检测到 Sensei 的召唤！是午休时间的闲聊任务吗？',
              '(擦擦嘴) 爱丽丝刚吃完经验值便当！Sensei要一起回复HP吗？'
            ]
          } else {
            pokeReplies = [
              '(光环闪烁) 系统启动中... 邦邦咔邦！同步完成！Sensei 有新任务吗？(✨ω✨)',
              '检测到物理接触... 嘿嘿，Sensei 是在检查爱丽丝的装备吗？(乖巧站好)',
              '哔哔！收到触摸指令！爱丽丝的光环闪了一下呢！( •̀ ω •́ )✨',
              '(歪头) Sensei 戳了一下开关？爱丽丝没有那种功能啦！(＞﹏＜)'
            ]
          }
        } else if (pokeCount === 2) {
          pokeReplies = [
            '(歪头) 咦？Sensei又戳了一次？是有什么重要的任务吗？(´・ω・`)',
            '嘿嘿~ (转圈) Sensei很喜欢爱丽丝吧！光环又闪了一下呢！(✨ω✨)',
            '(拿出拖把) 检测到连续指令！勇者待命中！(｀・ω・´)ゞ',
            '哔哔~ 系统温度上升0.5℃...(脸红) Sensei别一直戳啦...(＞﹏＜)'
          ]
        } else if (pokeCount <= 5) {
          pokeReplies = [
            '(开始转圈) 哇啊！连续攻击！爱丽丝要晕了！(＠_＠)',
            '(抱头) Sensei...爱丽丝的处理器快过热啦！给点冷却时间吧！(>﹏<)',
            '(举起拖把当盾牌) 第三击！爱丽丝要使用防御技能了！'
          ]
        } else {
          pokeReplies = [
            '(捂住光环原地转) 不行了不行了！爱丽丝的定位系统都乱了！Sensei要负责！(晕乎乎)',
            '(突然严肃) 等等...爱丽丝明白了！这是Sensei的特殊训练对吧！那爱丽丝会加油的！(握拳)',
            '(小跑躲开) 呀！(藏到桌子后) Sensei今天是吃了增加敏捷度的药水吗？手速好快！'
          ]
        }
      }

      // 根据 pokeStyle 混合回复
      responseText = randomChoice(adjustRepliesByStyle(pokeReplies.length ? pokeReplies : config.responsesGentle, pokeStyle))
    }
    // (per-user replies handled earlier in the per-user branch)
    
    // 尝试使用 API 获取动态回复
    if (config.enableApiResponse) {
      const apiResponse = await getApiResponse(moodType, userState.count, session.userId, session.guildId)
      if (apiResponse) {
        responseText = apiResponse
      }
    }
    
    // 发送回复
    await session.send(responseText)
    userState.lastReplyTime = now
    await saveUserState(session, userState)

    // 更新内存好感度(根据 pokeStyle)
    try {
      const affectionKey = getUserKey(session)
      const current = affectionMap.get(affectionKey) || 0
      const delta = getAffectionByStyle(userState.pokeStyle || 'normal')
      affectionMap.set(affectionKey, current + delta)
      ctx.logger('aris-chat').debug(`[好感度] ${affectionKey}: ${current} -> ${current + delta} (+${delta})`)
    } catch (err) {
      ctx.logger('aris-chat').warn('更新好感度失败', err)
    }
    
    // 执行反击戳
    if (shouldCounterPoke && counterCount > 0) {
      const cooldownOk = now - userState.lastCounterTime >= config.counterCooldown
      
      if (cooldownOk) {
        userState.lastCounterTime = now
        await saveUserState(session, userState)
        
        for (let i = 0; i < counterCount; i++) {
          // 计算延迟
          let delay: number
          if (userState.count >= config.rapidCounterThreshold) {
            delay = i * config.rapidInterval
          } else {
            delay = i * config.fastInterval
          }
          
          // 延迟戳回去
          setTimeout(async () => {
            try {
              await safeSendPokeBack(session, session.userId)
            } catch (error) {
              ctx.logger('aris-chat').warn('反击戳失败:', error)
            }
          }, delay)
        }
      }
    }

    // 如果配置了 mutes，尝试禁言（兼容 OneBot set_group_ban）
    if (shouldCounterPoke && config.muteDuration && config.muteDuration > 0 && session.guildId) {
      try {
        const seconds = Math.max(0, Math.floor(config.muteDuration))
        // OneBot / 常见 adapter: set_group_ban 群号 / user_id / duration
        const ok = await safeSetGroupBan(session, session.userId, seconds)
        if (ok) ctx.logger('aris-chat').info(`已对 ${session.userId} 禁言 ${seconds}s`) 
      } catch (err) {
        ctx.logger('aris-chat').warn('尝试禁言失败:', err)
      }
    }
  })
  
  // 清理命令 (管理员使用) - 使用数据库删除
  ctx.command('poke.reset', '重置戳一戳状态')
    .alias('重置戳戳')
    .action(async ({ session }: { session?: Session }) => {
      if (!session) return '无法获取会话信息'
      
      const userKey = getUserKey(session)
      // ✅ 从数据库中删除用户状态
      await ctx.database.remove('aris_chat_user', { id: userKey })
      
      if (session.guildId) {
        // ✅ 从数据库中删除群组状态
        await ctx.database.remove('aris_chat_group', { id: session.guildId })
      }
      
      return '已重置戳一戳状态'
    })
  
  // 查看状态命令
  ctx.command('poke.status', '查看当前戳一戳状态')
    .alias('戳戳状态')
    .action(async ({ session }: { session?: Session }) => {
      if (!session) return '无法获取会话信息'
      
      // ✅ 异步读取用户状态
      const userState = await getUserState(session)
      
      let result = `个人戳次数: ${userState.count}`
      const affectionKey = getUserKey(session)
      const currentAff = affectionMap.get(affectionKey) || 0
      result += `\n好感度: ${currentAff}`
      
      if (config.enableGroupCounting && session.guildId) {
        // ✅ 异步读取群组状态
        const groupState = await getGroupState(session.guildId)
        result += `\n群组戳次数: ${groupState.count}`
        result += `\n群组情绪: ${groupState.mood}`
      }
      
      return result
    })
    
  // 好感度命令
  ctx.command('poke.affection', '查看本人的好感度')
    .alias('查看好感度')
    .action(({ session }: { session?: Session }) => {
      if (!session) return '无法获取会话信息'
      const key = getUserKey(session)
      return `好感度: ${affectionMap.get(key) || 0}`
    })

}