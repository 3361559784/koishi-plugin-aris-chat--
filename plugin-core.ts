import { getValueByPath, analyzePokeStyle, countRapidPokes, getAffectionByStyle, getTimeOfDay, getMoodByCount, AFFECTION_CONFIG } from './utils'

export default async function pluginApply(ctx: any, config: any) {
  // Define DB models if Koishi DB is available
  try {
    ctx.model.extend('aris_chat_user', {
      id: 'string', guildId: 'string', userId: 'string', count: 'integer', lastPokeTime: 'integer', lastReplyTime: 'integer', lastCounterTime: 'integer', intervals: 'text', pokeStyle: 'string'
    })
    ctx.model.extend('aris_chat_group', {
      id: 'string', guildId: 'string', count: 'integer', mood: 'string', lastDecayTime: 'integer', intervals: 'text'
    })
  } catch (err) {
    // ignore
  }

  async function safeSendPokeBack(session: any, userId: string) {
    try {
      const platform = (session.platform || '').toLowerCase()
      const internal = (session.bot as any)?.internal
      if (platform === 'onebot' && internal && typeof internal.sendGroupMsg === 'function') {
        await internal.sendGroupMsg(session.guildId, { type: 'poke', data: { qq: userId } })
        return true
      }
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

  async function safeSetGroupBan(session: any, userId: string, seconds: number) {
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

  async function getApiResponse(mood: string, pokeCount: number, userId: string, guildId?: string): Promise<string | null> {
    if (!config.enableApiResponse || !config.apiUrl) return null
    try {
      const requestData = { mood, pokeCount, userId, guildId, timestamp: Date.now() }
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), config.apiTimeout)
      const options: RequestInit = { method: config.apiMethod, headers: config.apiHeaders, signal: controller.signal }
      if (config.apiMethod === 'POST') options.body = JSON.stringify(requestData)
      const url = config.apiMethod === 'GET' ? `${config.apiUrl}?mood=${mood}&pokeCount=${pokeCount}&userId=${userId}${guildId ? `&guildId=${guildId}` : ''}` : config.apiUrl
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

  function getUserKey(session: any): string { return session.guildId ? `${session.guildId}:${session.userId}` : session.userId }
  function randomChoice<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
  const affectionMap = new Map<string, number>()

  function adjustRepliesByStyle(replies: string[], pokeStyle: string): string[] {
    const styleReplies: Record<string, string[]> = {
      gentle: ['(温柔地看着Sensei) 嗯...？好久没有这么温柔的互动了呢...(微笑) 爱丽丝很开心哦！✨', '(安静地靠近) 谢谢Sensei...这样的互动让爱丽丝感觉很温暖...'],
      fast: ['(眼花缭乱) 哇哇哇！这速度！Sensei是开了加速Buff吗！(＠_＠)', '(抱头) 太快了！爱丽丝跟不上啦！(>﹏<)'],
      flirty: ['(害羞) 呜...Sensei一直戳...是在撒娇吗？(脸红)', '(捂脸) 这种节奏...爱丽丝害羞值上升了！(///ω///)'],
      normal: []
    }
    if (styleReplies[pokeStyle] && Math.random() < 0.3) return [...replies, ...styleReplies[pokeStyle]]
    return replies
  }

  async function getUserState(session: any) {
    const id = getUserKey(session)
    const [found] = await ctx.database.get('aris_chat_user', { id })
    if (found) return { count: found.count, lastPokeTime: found.lastPokeTime, lastReplyTime: found.lastReplyTime, lastCounterTime: found.lastCounterTime, intervals: found.intervals ? JSON.parse(found.intervals) : [], pokeStyle: found.pokeStyle || 'normal', windowTimer: null as any }
    return { count: 0, lastPokeTime: 0, lastReplyTime: 0, lastCounterTime: 0, intervals: [], pokeStyle: 'normal', windowTimer: null as any }
  }

  async function saveUserState(session: any, state: any) {
    const id = getUserKey(session); const guildId = session.guildId || ''; const userId = session.userId || ''
    await ctx.database.upsert('aris_chat_user', [{ id, guildId, userId, count: state.count, lastPokeTime: state.lastPokeTime, lastReplyTime: state.lastReplyTime, lastCounterTime: state.lastCounterTime, intervals: JSON.stringify(state.intervals || []), pokeStyle: state.pokeStyle }])
  }

  async function getGroupState(guildId: string) {
    const [found] = await ctx.database.get('aris_chat_group', { id: guildId })
    if (found) return { count: found.count, mood: found.mood, lastDecayTime: found.lastDecayTime, intervals: found.intervals ? JSON.parse(found.intervals) : [], decayTimer: null as any }
    return { count: 0, mood: 'neutral', lastDecayTime: Date.now(), intervals: [], decayTimer: null as any }
  }

  async function saveGroupState(guildId: string, state: any) {
    await ctx.database.upsert('aris_chat_group', [{ id: guildId, guildId, count: state.count, mood: state.mood, lastDecayTime: state.lastDecayTime, intervals: JSON.stringify(state.intervals || []) }])
  }

  async function startMoodDecay(guildId: string) {
    if (!config.enableMoodDecay) return
    const groupState = await getGroupState(guildId)
    if (groupState.decayTimer) clearTimeout(groupState.decayTimer)
    groupState.decayTimer = setTimeout(async () => {
      const currentState = await getGroupState(guildId)
      if (currentState.count > 0) {
        currentState.count = Math.max(0, currentState.count - 1)
        currentState.mood = getMoodByCount(currentState.count)
        currentState.lastDecayTime = Date.now()
        await saveGroupState(guildId, currentState)
        if (currentState.count > 0) await startMoodDecay(guildId)
      }
    }, config.moodDecayIntervalMs)
  }

  ctx.on('notice/poke', async (session: any) => {
    if (session.targetId !== session.bot.selfId) return
    const now = Date.now(); const userKey = getUserKey(session)
    const userState = await getUserState(session)
    if (now - userState.lastPokeTime < config.userPokeCooldownMs) return
    userState.lastPokeTime = now
    if (userState.windowTimer) clearTimeout(userState.windowTimer)
    userState.count++
    await saveUserState(session, userState)
    userState.windowTimer = setTimeout(async () => { userState.count = 0; await saveUserState(session, userState) }, config.pokeWindowMs)
    let groupState: any = null
    if (config.enableGroupCounting && session.guildId) {
      groupState = await getGroupState(session.guildId)
      if (now - userState.lastReplyTime < config.groupCooldownMs) return
      groupState.count++
      await saveGroupState(session.guildId, groupState)
      groupState.mood = getMoodByCount(groupState.count)
      startMoodDecay(session.guildId)
    }
    const justReplied = now - userState.lastReplyTime < config.justRepliedMs
    let responseText: string
    let shouldCounterPoke = false
    let counterCount = 0
    let moodType = 'gentle'
    if (groupState) {
      if (groupState.mood === 'furious') { moodType = 'furious'; responseText = randomChoice(config.responsesFurious); shouldCounterPoke = config.enableCounterPoke; counterCount = Math.floor(Math.random() * (config.counterMax - config.counterMin + 1)) + config.counterMin }
      else if (groupState.mood === 'angry') responseText = randomChoice(config.responsesAngry)
      else if (groupState.mood === 'annoyed') responseText = randomChoice(config.responsesAnnoyed)
      else responseText = randomChoice(config.responsesGentle)
    } else {
      const pokeCount = userState.count; const timeOfDay = getTimeOfDay(new Date()); const pokeStyle = userState.pokeStyle || 'normal'
      let pokeReplies: string[] = []
      const rapidPokeCount = countRapidPokes(userState.intervals, config.rapidInterval)
      const timeSinceLastCounter = now - (userState.lastCounterTime || 0)
      if (rapidPokeCount >= config.rapidCounterThreshold && timeSinceLastCounter > config.counterCooldown) {
        pokeReplies = [ '够了够了', '系统警告', '哇啊啊' ]
        shouldCounterPoke = true; counterCount = Math.floor(Math.random() * (config.counterMax - config.counterMin + 1)) + config.counterMin; userState.lastCounterTime = now; await saveUserState(session, userState); userState.count = 0
      } else if (pokeCount >= config.pokeCounterThreshold) { pokeReplies = ['受够了！看我反击！']; shouldCounterPoke = true; counterCount = 1; userState.count = 0 }
      else if (pokeCount >= config.pokeAngryThreshold) { pokeReplies = ['不许再戳了！'] }
      else {
        if (pokeCount === 1) { pokeReplies = config.responsesGentle }
        else if (pokeCount === 2) { pokeReplies = config.responsesGentle }
        else if (pokeCount <= 5) { pokeReplies = config.responsesAnnoyed }
        else { pokeReplies = config.responsesAngry }
      }
      responseText = randomChoice(adjustRepliesByStyle(pokeReplies.length ? pokeReplies : config.responsesGentle, pokeStyle))
    }
    if (config.enableApiResponse) { const apiResponse = await getApiResponse(moodType, userState.count, session.userId, session.guildId); if (apiResponse) responseText = apiResponse }
    await session.send(responseText)
    userState.lastReplyTime = now; await saveUserState(session, userState)
    try { const affectionKey = getUserKey(session); const current = affectionMap.get(affectionKey) || 0; const delta = getAffectionByStyle(userState.pokeStyle || 'normal'); affectionMap.set(affectionKey, current + delta); ctx.logger('aris-chat').debug(`[好感度] ${affectionKey}: ${current} -> ${current + delta} (+${delta})`) } catch (err) { ctx.logger('aris-chat').warn('更新好感度失败', err) }
    if (shouldCounterPoke && counterCount > 0) {
      const cooldownOk = now - userState.lastCounterTime >= config.counterCooldown
      if (cooldownOk) {
        userState.lastCounterTime = now; await saveUserState(session, userState)
        for (let i = 0; i < counterCount; i++) {
          let delay: number = userState.count >= config.rapidCounterThreshold ? i * config.rapidInterval : i * config.fastInterval
          setTimeout(async () => { try { await safeSendPokeBack(session, session.userId) } catch (error) { ctx.logger('aris-chat').warn('反击戳失败:', error) } }, delay)
        }
      }
    }
    if (shouldCounterPoke && config.muteDuration && config.muteDuration > 0 && session.guildId) { try { const seconds = Math.max(0, Math.floor(config.muteDuration)); const ok = await safeSetGroupBan(session, session.userId, seconds); if (ok) ctx.logger('aris-chat').info(`已对 ${session.userId} 禁言 ${seconds}s`) } catch (err) { ctx.logger('aris-chat').warn('尝试禁言失败:', err) } }
  })

  ctx.command('poke.reset', '重置戳一戳状态').alias('重置戳戳').action(async ({ session }: any) => {
    if (!session) return '无法获取会话信息'
    const userKey = getUserKey(session)
    await ctx.database.remove('aris_chat_user', { id: userKey })
    if (session.guildId) await ctx.database.remove('aris_chat_group', { id: session.guildId })
    return '已重置戳一戳状态'
  })

  ctx.command('poke.status', '查看当前戳一戳状态').alias('戳戳状态').action(async ({ session }: any) => {
    if (!session) return '无法获取会话信息'
    const userState = await getUserState(session)
    let result = `个人戳次数: ${userState.count}`
    const affectionKey = getUserKey(session)
    const currentAff = affectionMap.get(affectionKey) || 0
    result += `\n好感度: ${currentAff}`
    if (config.enableGroupCounting && session.guildId) { const groupState = await getGroupState(session.guildId); result += `\n群组戳次数: ${groupState.count}`; result += `\n群组情绪: ${groupState.mood}` }
    return result
  })

  ctx.command('poke.affection', '查看本人的好感度').alias('查看好感度').action(({ session }: any) => { if (!session) return '无法获取会话信息'; const key = getUserKey(session); return `好感度: ${affectionMap.get(key) || 0}` })
}
