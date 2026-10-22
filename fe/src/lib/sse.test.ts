import { parseSseBlock } from './sse'

describe('parseSseBlock', () => {
  it('reads event name and data', () => {
    expect(parseSseBlock('event: token\ndata: {"text":"Xin"}')).toEqual({
      event: 'token',
      data: '{"text":"Xin"}',
    })
  })

  it('defaults to "message" and joins multi-line data', () => {
    expect(parseSseBlock('data: a\ndata: b')).toEqual({ event: 'message', data: 'a\nb' })
  })

  it('ignores comments / keep-alive', () => {
    expect(parseSseBlock(': ping')).toBeNull()
  })
})
