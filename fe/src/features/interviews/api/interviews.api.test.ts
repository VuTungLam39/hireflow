import { api } from '@/lib/api-client'
import { interviewsApi } from './interviews.api'

// F-INT-02
describe('interviewsApi.list', () => {
  afterEach(() => vi.restoreAllMocks())

  it('follows nextCursor until the last page and returns every interview', async () => {
    const page = (ids: string[], nextCursor: string | null) => ({
      data: {
        data: ids.map((id) => ({ id })),
        meta: { limit: 200, nextCursor, hasNextPage: !!nextCursor },
      },
    })
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValueOnce(page(['a', 'b'], 'c1'))
      .mockResolvedValueOnce(page(['c'], null))

    const items = await interviewsApi.list({ from: '2026-11-01T00:00:00.000Z' })

    expect(items.map((i) => i.id)).toEqual(['a', 'b', 'c'])
    expect(get).toHaveBeenCalledTimes(2)
    expect(get.mock.calls[0][1]).toMatchObject({ params: { limit: 200, cursor: undefined } })
    expect(get.mock.calls[1][1]).toMatchObject({ params: { limit: 200, cursor: 'c1' } })
  })
})

describe('interviewsApi.suggestQuestions', () => {
  afterEach(() => vi.restoreAllMocks())

  it('BR-INT-04: sends no body, since Express rejects a "null" JSON body with 400', async () => {
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValueOnce({ data: { data: { items: [], cached: false } } })

    await interviewsApi.suggestQuestions('iv-1')

    expect(post.mock.calls[0][1]).toBeUndefined()
  })
})
