import { fireEvent, screen, within } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { paths } from '@/routes/paths'
import { allHandlers } from '@/test/msw/handlers'
import { companyState } from '@/test/msw/handlers/company'
import { renderRouteAs } from '@/test/render'
import CompanyPage from './CompanyPage'

const server = setupServer(...allHandlers)
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => server.close())
beforeEach(() => {
  companyState.media = []
})

const png = (name = 'logo.png') =>
  new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], name, { type: 'image/png' })

function renderPage() {
  renderRouteAs(
    'hr@hireflow.dev',
    [{ path: paths.company, element: <CompanyPage /> }],
    paths.company,
  )
}

// F-ORG-01 · BR-ORG-01, BR-ORG-02, BR-MEDIA-01
describe('CompanyPage', () => {
  it('BR-ORG-01: says the public page is hidden until there is a logo, then shows it once uploaded', async () => {
    renderPage()
    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent('Trang công ty chưa hiện công khai')
    expect(status).toHaveTextContent('Logo: còn thiếu')

    const brand = screen.getByRole('region', { name: 'Logo và ảnh bìa' })
    const [logoInput] = brand.querySelectorAll<HTMLInputElement>('input[type="file"]')
    fireEvent.change(logoInput, { target: { files: [png()] } })

    expect(
      await screen.findByText('Trang công ty đang hiện công khai trên trang tuyển dụng'),
    ).toBeInTheDocument()
    expect(within(brand).getByRole('img', { name: 'Logo' })).toHaveAttribute(
      'src',
      expect.stringMatching(/\/api\/v1\/public\/media\/[0-9]{64}\.png$/),
    )
  })

  it('rejects a non-image before uploading and an http:// link before saving (BR-MEDIA-01, BR-ORG-02)', async () => {
    renderPage()
    const brand = await screen.findByRole('region', { name: 'Logo và ảnh bìa' })
    const [logoInput] = brand.querySelectorAll<HTMLInputElement>('input[type="file"]')
    fireEvent.change(logoInput, {
      target: { files: [new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' })] },
    })
    expect(await within(brand).findByRole('alert')).toHaveTextContent(
      'không phải ảnh JPEG, PNG hoặc WebP',
    )
    expect(companyState.media).toHaveLength(0)

    const website = screen.getByLabelText('Website')
    fireEvent.change(website, { target: { value: 'http://insecure.example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thông tin chung' }))
    expect(await screen.findByText('Đường dẫn phải bắt đầu bằng https://')).toBeInTheDocument()
    expect(companyState.profile.website).toBe('https://hireflow.example.com')
  })

  it('adds a gallery image only with a description', async () => {
    renderPage()
    const gallery = await screen.findByRole('region', { name: 'Thư viện ảnh' })
    fireEvent.change(within(gallery).getByLabelText('Ảnh'), {
      target: { files: [png('office.png')] },
    })
    fireEvent.click(within(gallery).getByRole('button', { name: 'Thêm ảnh' }))
    expect(within(gallery).getByRole('alert')).toHaveTextContent('Mô tả ngắn nội dung ảnh')

    fireEvent.change(within(gallery).getByLabelText('Mô tả ảnh'), {
      target: { value: 'Phòng họp tầng 5' },
    })
    fireEvent.click(within(gallery).getByRole('button', { name: 'Thêm ảnh' }))
    expect(
      await within(gallery).findByRole('img', { name: 'Phòng họp tầng 5' }),
    ).toBeInTheDocument()
    expect(companyState.media).toEqual([
      expect.objectContaining({ kind: 'GALLERY', alt: 'Phòng họp tầng 5' }),
    ])
  })

  it('saves the benefits block on its own', async () => {
    renderPage()
    const block = await screen.findByRole('region', { name: 'Phúc lợi' })
    fireEvent.click(within(block).getByRole('button', { name: 'Thêm phúc lợi' }))
    const titles = within(block).getAllByLabelText('Phúc lợi')
    fireEvent.change(titles.at(-1)!, { target: { value: 'Review lương 2 lần/năm' } })
    fireEvent.click(within(block).getByRole('button', { name: 'Lưu phúc lợi' }))
    await vi.waitFor(() =>
      expect(companyState.profile.benefits.map((b) => b.title)).toContain('Review lương 2 lần/năm'),
    )
  })

  it('#4 clears the chosen file after a gallery image is added', async () => {
    renderPage()
    const gallery = await screen.findByRole('region', { name: 'Thư viện ảnh' })
    const input = within(gallery).getByLabelText<HTMLInputElement>('Ảnh')
    const file = png('office.png')
    Object.defineProperty(input, 'value', { value: 'fakepath/office.png', writable: true })
    fireEvent.change(input, { target: { files: [file] } })
    fireEvent.change(within(gallery).getByLabelText('Mô tả ảnh'), { target: { value: 'Sảnh chờ' } })
    fireEvent.click(within(gallery).getByRole('button', { name: 'Thêm ảnh' }))
    await within(gallery).findByRole('img', { name: 'Sảnh chờ' })
    expect(input.value).toBe('')
    expect(within(gallery).getByLabelText('Mô tả ảnh')).toHaveValue('')
  })

  it('#7 asks before removing the logo and warns that the public page will hide', async () => {
    companyState.media = [
      {
        id: 'logo-1',
        kind: 'LOGO',
        url: `/public/media/${'1'.repeat(64)}.png`,
        width: 256,
        height: 256,
        alt: '',
        position: 0,
      },
    ]
    renderPage()
    const brand = await screen.findByRole('region', { name: 'Logo và ảnh bìa' })
    fireEvent.click(within(brand).getByRole('button', { name: 'Gỡ ảnh' }))
    const dialog = await screen.findByRole('dialog', { name: 'Gỡ logo?' })
    expect(dialog).toHaveTextContent('Trang công ty sẽ ẩn khỏi trang tuyển dụng')
    expect(companyState.media).toHaveLength(1)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Gỡ ảnh' }))
    await vi.waitFor(() => expect(companyState.media).toHaveLength(0))
  })

  it('#10 explains a too-short description instead of ignoring it, and swaps order in one step', async () => {
    companyState.media = [0, 1].map((i) => ({
      id: `g-${i}`,
      kind: 'GALLERY' as const,
      url: `/public/media/${String(i).repeat(64)}.png`,
      width: 800,
      height: 600,
      alt: `Ảnh ${i}`,
      position: i,
    }))
    renderPage()
    const gallery = await screen.findByRole('region', { name: 'Thư viện ảnh' })
    const first = within(gallery).getByLabelText('Mô tả ảnh 1')
    fireEvent.change(first, { target: { value: 'A' } })
    fireEvent.blur(first)
    expect(within(gallery).getByRole('alert')).toHaveTextContent('Mô tả ít nhất 2 ký tự')
    expect(first).toHaveAttribute('aria-invalid', 'true')

    fireEvent.click(within(gallery).getByRole('button', { name: 'Đưa ảnh 1 ra sau' }))
    await vi.waitFor(() =>
      expect(companyState.media.map((m) => [m.id, m.position])).toEqual([
        ['g-0', 1],
        ['g-1', 0],
      ]),
    )
  })
})
