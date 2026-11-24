import { render, screen } from '@testing-library/react'
import { SurfaceProvider } from './surface-provider'
import { APPLICATION_STATUS_LABEL, useJobNoun } from './terms'

function Noun() {
  const noun = useJobNoun()
  return (
    <p>
      {noun.label} · {noun.count}
    </p>
  )
}

describe('module nhãn (GLOSSARY "Thuật ngữ giao diện")', () => {
  it('trạng thái hồ sơ: nhãn nội bộ và công khai theo bảng, không lộ Offer ra ngoài', () => {
    expect(APPLICATION_STATUS_LABEL.OFFER).toEqual({ internal: 'Offer', public: 'Đã có kết quả' })
    expect(APPLICATION_STATUS_LABEL.HIRED).toEqual({
      internal: 'Đã nhận việc',
      public: 'Đã có kết quả',
    })
    expect(APPLICATION_STATUS_LABEL.NEW.public).toBe('Đã nhận hồ sơ')
    for (const l of Object.values(APPLICATION_STATUS_LABEL)) expect(l.public).not.toMatch(/Offer/)
  })

  it('DL-11: danh từ việc làm lấy từ SurfaceContext, mặc định nội bộ', () => {
    const { unmount } = render(<Noun />)
    expect(screen.getByText('Tin tuyển dụng · tin')).toBeInTheDocument()
    unmount()
    render(
      <SurfaceProvider value="public">
        <Noun />
      </SurfaceProvider>,
    )
    expect(screen.getByText('Việc làm · vị trí')).toBeInTheDocument()
  })
})
