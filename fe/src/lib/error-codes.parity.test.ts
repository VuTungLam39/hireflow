import { ERROR_MESSAGES } from './error-codes'

interface BackendErrorCodeEnum {
  ErrorCode: Record<string, string>
}

const modules = import.meta.glob('../../../be/src/common/exceptions/error-code.enum.ts', {
  eager: true,
})
const backend = Object.values(modules)[0] as BackendErrorCodeEnum | undefined

// API Contract 5, Frontend Architecture 7.2
describe('mã lỗi FE khớp BE', () => {
  it('tìm thấy enum mã lỗi của backend', () => {
    expect(backend?.ErrorCode).toBeDefined()
  })

  it('mọi mã lỗi BE có câu tiếng Việt ở FE', () => {
    const missing = Object.values(backend!.ErrorCode).filter((code) => !ERROR_MESSAGES[code])
    expect(missing).toEqual([])
  })

  it('FE không giữ mã lỗi BE không còn trả', () => {
    const known = new Set(Object.values(backend!.ErrorCode))
    expect(Object.keys(ERROR_MESSAGES).filter((code) => !known.has(code))).toEqual([])
  })
})
