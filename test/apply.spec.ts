import { describe, it, expect, vi } from 'vitest'
import apply from '../plugin-core'
import type { Config } from '../index'

describe('apply plugin registration', () => {
  it('should register events and commands', async () => {
    const handlers: Record<string, Function> = {}

    const createCommandMock = () => {
      const cmd: any = {}
      cmd.alias = vi.fn(() => cmd)
      cmd.action = vi.fn(() => cmd)
      return cmd
    }

    const mockCtx: any = {
      model: { extend: vi.fn() },
      database: {
        rows: {} as Record<string, any>,
        get: vi.fn(async (table: string, query: any) => {
          const row = (mockCtx.database.rows[query.id])
          return row ? [row] : []
        }),
        upsert: vi.fn(async (table: string, rows: any[]) => {
          for (const r of rows) mockCtx.database.rows[r.id] = r
          return rows
        }),
        remove: vi.fn(async (table: string, query: any) => {
          delete mockCtx.database.rows[query.id]
        }),
      },
      on: vi.fn((ev: string, handler: Function) => { handlers[ev] = handler }),
      command: vi.fn(() => createCommandMock()),
      logger: () => ({ debug: vi.fn(), warn: vi.fn(), info: vi.fn() }),
    }

    const cfg: Partial<Config> = {
      pokeWindowMs: 480000,
      userPokeCooldownMs: 2000,
      groupCooldownMs: 8000,
      justRepliedMs: 15000,
      pokeAngryThreshold: 3,
      pokeCounterThreshold: 5,
      pokeGroupThreshold: 5,
      gentleInterval: 30000,
      fastInterval: 3000,
      flirtyThreshold: 5,
      rapidCounterThreshold: 8,
      rapidInterval: 1000,
      counterMin: 2,
      counterMax: 3,
      counterCooldown: 30000,
      muteDuration: 0,
      enableGroupCounting: true,
      enableCounterPoke: true,
      enableMoodDecay: true,
      enableApiResponse: false,
      adminIds: [],
      apiUrl: '',
      apiMethod: 'POST',
      apiHeaders: { 'Content-Type': 'application/json' },
      apiTimeout: 5000,
      apiResponsePath: 'data.message',
      moodDecayIntervalMs: 480000,
      moodLevels: ['neutral','annoyed','angry','furious'],
      responsesFirst: {
        morning: ['hi'],
        noon: ['hi'],
        night: ['hi'],
        other: ['hi']
      },
      responsesSecond: ['second'],
      responsesCombo: ['combo'],
      responsesLimit: ['limit'],
      responsesGentle: ['hi'],
      responsesAnnoyed: ['stop'],
      responsesAngry: ['angry'],
      responsesFurious: ['furious'],
      responsesFlirty: ['flirty']
    } as Config

    // call apply to register handlers
    await apply(mockCtx, cfg)
    expect(mockCtx.on).toHaveBeenCalled()
    expect(handlers['notice/poke']).toBeDefined()
    expect(mockCtx.command).toHaveBeenCalled()

    // simulate a poke event
    const session: any = {
      targetId: 'bot',
      userId: '1001',
      guildId: '2001',
      platform: 'test',
      bot: { selfId: 'bot' },
      send: vi.fn(async (msg: string) => msg)
    }

    // set the db initial state
    await mockCtx.database.upsert('aris_chat_user', [{ id: '2001:1001', guildId: '2001', userId: '1001', count: 0, lastPokeTime: 0, lastReplyTime: 0, lastCounterTime: 0, intervals: '[]', pokeStyle: 'normal' }])
    await handlers['notice/poke'](session)

    expect(session.send).toHaveBeenCalled()
    // user row should have been saved/updated
    const [row] = await mockCtx.database.get('aris_chat_user', { id: '2001:1001' })
    expect(row).toBeDefined()
  })
})
