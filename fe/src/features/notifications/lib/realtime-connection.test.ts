import { useAuthStore } from '@/stores/auth.store'
import type { RealtimeEvent } from '../types'
import { connectRealtime } from './realtime-connection'

vi.mock('@/lib/api-client', () => ({
  refreshAccessToken: vi.fn(async () => {
    useAuthStore.getState().setAccessToken('fresh-token')
    return 'fresh-token'
  }),
}))

const sse = (blocks: string[]) =>
  new Response(
    new ReadableStream({
      start(controller) {
        for (const b of blocks) controller.enqueue(new TextEncoder().encode(b))
        controller.close()
      },
    }),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
  )

const notification = {
  notification: {
    id: 'n1',
    type: 'CV_SCORED',
    readAt: null,
    createdAt: '2026-10-27T10:00:00Z',
    application: null,
  },
  unreadCount: 2,
}

// F-NOTI-01
describe('connectRealtime', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('parses events split across chunks, ignores keep-alive comments and sends the token', async () => {
    useAuthStore.getState().setAccessToken('t1')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        sse([
          'event: ready\ndata: {"unreadCount":1}\n\n: ping\n\nevent: notif',
          `ication\ndata: ${JSON.stringify(notification)}\n\n`,
        ]),
      )
      .mockImplementation(() => new Promise(() => {}))
    vi.stubGlobal('fetch', fetchMock)

    const events: RealtimeEvent[] = []
    const status: boolean[] = []
    const close = connectRealtime({
      onEvent: (e) => events.push(e),
      onStatus: (c) => status.push(c),
    })

    await vi.waitFor(() => expect(events).toHaveLength(2))
    expect(events[0]).toEqual({ event: 'ready', data: { unreadCount: 1 } })
    expect(events[1]).toMatchObject({ event: 'notification', data: { unreadCount: 2 } })
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Bearer t1' })
    await vi.waitFor(() => expect(status).toEqual([true, false]))

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2), { timeout: 3000 })
    close()
    expect(status.at(-1)).toBe(false)
  })

  it('refreshes the access token once on 401, then reconnects with the new one', async () => {
    useAuthStore.getState().setAccessToken('expired')
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(sse(['event: ready\ndata: {"unreadCount":0}\n\n']))
      .mockImplementation(() => new Promise(() => {}))
    vi.stubGlobal('fetch', fetchMock)

    const events: RealtimeEvent[] = []
    const close = connectRealtime({ onEvent: (e) => events.push(e), onStatus: () => {} })
    await vi.waitFor(() => expect(events).toHaveLength(1))
    expect(fetchMock.mock.calls[1][1].headers).toMatchObject({
      Authorization: 'Bearer fresh-token',
    })
    close()
  })
})
