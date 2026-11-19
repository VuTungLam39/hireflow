import type { ReactNode } from 'react'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { SITE_NAME } from '@/prerender/shared'
import { DemoNotice } from '../components/DemoNotice'

export const PRIVACY_CONTACT = 'wdonglin39@gmail.com'
const GEMINI_TERMS = 'https://aistudio.google.com/docs/terms'

const RIGHTS = [
  'được biết',
  'đồng ý hoặc không đồng ý',
  'rút lại đồng ý',
  'xem, chỉnh sửa',
  'yêu cầu cung cấp dữ liệu',
  'yêu cầu xoá',
  'yêu cầu hạn chế xử lý',
  'phản đối xử lý',
  'khiếu nại, tố cáo, khởi kiện và yêu cầu bồi thường theo quy định',
]

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="type-heading text-lg">{title}</h2>
      <div className="type-body space-y-2">{children}</div>
    </section>
  )
}

// Rà soát production Phase 6 · hướng A (15/11/2026)
export default function PrivacyPolicyPage() {
  useDocumentTitle(`Chính sách dữ liệu ứng viên – ${SITE_NAME}`)
  return (
    <article className="max-w-2xl space-y-8">
      <header className="space-y-3">
        <h1 className="type-display">Chính sách dữ liệu ứng viên</h1>
        <p className="type-caption">Cập nhật 19/11/2026 · Áp dụng cho bản demo HireFlow</p>
        <DemoNotice />
        <p className="type-body">
          Nếu bạn đã lỡ gửi CV hoặc thông tin thật, hãy liên hệ theo mục 8 để chúng tôi xoá.
        </p>
      </header>

      <Section title="1. Đơn vị vận hành">
        <p>Đơn vị vận hành: Nhóm thực tập phát triển và vận hành bản demo HireFlow.</p>
        <p>
          Đầu mối liên hệ về dữ liệu cá nhân:{' '}
          <a className="text-brand underline" href={`mailto:${PRIVACY_CONTACT}`}>
            {PRIVACY_CONTACT}
          </a>
          .
        </p>
        <p>
          HireFlow là sàn của nhiều công ty, nhưng đây là bản demo: các công ty trên sàn là công ty
          mẫu hoặc công ty tự đăng ký để thử nghiệm, đã cam kết không dùng sàn cho tuyển dụng thật
          (mục 9). Vì vậy nhóm vận hành chịu trách nhiệm cho toàn bộ dữ liệu trên bản demo, kể cả dữ
          liệu nằm trong không gian riêng của từng công ty.
        </p>
        <p>
          Mọi yêu cầu về dữ liệu cá nhân, dù bạn nộp hồ sơ vào công ty nào, đều gửi về một đầu mối ở
          trên. Bạn không cần liên hệ riêng từng công ty.
        </p>
      </Section>

      <Section title="2. Dữ liệu được xử lý">
        <ul className="list-disc space-y-1 pl-5">
          <li>Bạn cung cấp: họ tên, email, số điện thoại, file CV, thời điểm đồng ý.</li>
          <li>
            Công ty tải lên thay bạn: người tuyển dụng có thể tải CV bạn gửi cho họ qua kênh khác
            (email, hội chợ việc làm). Khi đó họ phải xác nhận đã thông báo cho bạn và được bạn đồng
            ý với chính sách này; hồ sơ được ghi rõ nguồn là &quot;công ty tải lên&quot;.
          </li>
          <li>
            Hệ thống tạo ra từ CV: nội dung chữ, kỹ năng và kinh nghiệm do trí tuệ nhân tạo trích
            xuất kèm đoạn trích dẫn, điểm và thứ hạng mức phù hợp với từng vị trí, các đoạn CV và
            vector dùng để tìm kiếm.
          </li>
          <li>
            Người tuyển dụng tạo ra: trạng thái hồ sơ, ghi chú, lịch và phiếu đánh giá phỏng vấn.
          </li>
        </ul>
        <p>
          Chúng tôi không yêu cầu ảnh, ngày sinh, giới tính, dân tộc, tôn giáo, tình trạng sức khoẻ
          hay hôn nhân. Nếu CV có các thông tin này, hệ thống không dùng chúng làm tiêu chí chấm
          điểm.
        </p>
      </Section>

      <Section title="3. Mục đích">
        <ul className="list-disc space-y-1 pl-5">
          <li>Xét hồ sơ cho vị trí bạn ứng tuyển.</li>
          <li>
            Gợi ý hồ sơ của bạn cho vị trí khác phù hợp của cùng công ty, trong thời gian lưu trữ
            (mục 6).
          </li>
          <li>
            Gửi email xác nhận đã nhận hồ sơ tới email bạn khai khi nộp. Email có link theo dõi để
            bạn xem trạng thái rút gọn của hồ sơ và tự rút hồ sơ.
          </li>
        </ul>
      </Section>

      <Section title="4. Cách trí tuệ nhân tạo được dùng">
        <p>
          Nội dung chữ của CV được gửi tới Google Gemini (dự phòng: Groq) để trích xuất kỹ năng,
          kinh nghiệm và đoạn trích dẫn. Điểm phù hợp được tính bằng công thức cố định từ các tiêu
          chí của vị trí (kỹ năng, số năm kinh nghiệm, trọng số do người tuyển dụng đặt); hệ thống
          kiểm mỗi trích dẫn có thật trong CV. Điểm dùng để sắp xếp và tham khảo. Hệ thống không tự
          loại, nhận hay đổi trạng thái hồ sơ; người tuyển dụng xem CV gốc và bằng chứng rồi quyết
          định.
        </p>
        <p>
          Trước khi gửi, hệ thống che họ tên, email và số điện thoại. Việc che này giảm dữ liệu được
          chia sẻ nhưng không làm CV trở thành ẩn danh: nơi làm việc, trường học, dự án vẫn có thể
          giúp nhận ra bạn.
        </p>
        <p>
          Bản demo dùng gói miễn phí của Google Gemini. Theo{' '}
          <a className="text-brand underline" href={GEMINI_TERMS} target="_blank" rel="noreferrer">
            điều khoản của Google
          </a>{' '}
          cho gói này, nội dung gửi lên và kết quả trả về có thể được Google dùng để cải thiện sản
          phẩm, và có thể được người kiểm duyệt của Google đọc. Google cũng khuyến cáo không gửi
          thông tin cá nhân vào gói miễn phí. Groq (dự phòng) theo tài liệu của họ mặc định không
          lưu nội dung yêu cầu.
        </p>
        <p>
          Bản demo hiện chưa có lựa chọn từ chối xử lý bằng trí tuệ nhân tạo. Cùng với điều khoản
          trên, đây là lý do bạn không nên gửi CV thật.
        </p>
      </Section>

      <Section title="5. Lưu ở đâu, ai xem được">
        <p>
          Dữ liệu được lưu và xử lý trên dịch vụ thuê ở nước ngoài: Render, Neon (máy chủ ứng dụng
          và cơ sở dữ liệu), Backblaze B2 (file CV), Vercel (giao diện web), Google và Groq (trí tuệ
          nhân tạo), Mailjet (gửi email tài khoản cho nhà tuyển dụng và email xác nhận nộp hồ sơ cho
          ứng viên).
        </p>
        <p>
          HireFlow là sàn của nhiều công ty. Hồ sơ chỉ hiển thị cho công ty đăng vị trí bạn nộp. Nếu
          bạn nộp vào hai công ty, mỗi công ty giữ một bản riêng và không thấy hồ sơ của nhau. Quản
          trị sàn chỉ xem thông tin công ty và số liệu tổng, không xem hồ sơ ứng viên.
        </p>
        <p>
          Trong công ty đó, chỉ tài khoản tuyển dụng, quản lý phòng ban có vị trí tuyển, người được
          phân công phỏng vấn và quản trị viên xem được hồ sơ, theo phân quyền. Mỗi lần mở file CV
          gốc và mỗi lần xuất danh sách hồ sơ đều được ghi nhật ký.
        </p>
      </Section>

      <Section title="6. Lưu bao lâu">
        <p>
          Tối đa 12 tháng kể từ lần nộp gần nhất. Hết hạn, hoặc khi bạn yêu cầu xoá, hệ thống ẩn
          danh: xoá file CV, dữ liệu trích xuất từ CV, vector tìm kiếm, ghi chú và nhận xét phỏng
          vấn; thay họ tên, email, số điện thoại. Bản sao lưu cơ sở dữ liệu tự hết hạn theo chu kỳ
          của nhà cung cấp.
        </p>
        <p>
          Link theo dõi hồ sơ hết hạn sau 90 ngày kể từ ngày nộp. Ai có link đều xem được trạng thái
          rút gọn và rút được hồ sơ, nên đừng chuyển tiếp email này. Khi hồ sơ bị ẩn danh, link bị
          xoá ngay cùng bản ghi email đã gửi.
        </p>
        <p>
          Nếu công ty bạn nộp hồ sơ bị Quản trị sàn khoá hoặc từ chối, tin tuyển dụng của công ty
          không còn hiển thị công khai và tài khoản của công ty không đăng nhập được. Hồ sơ của bạn
          vẫn được lưu theo đúng thời hạn trên, và bạn vẫn yêu cầu xoá được bất cứ lúc nào.
        </p>
      </Section>

      <Section title="7. Quyền của bạn">
        <p>Theo Luật Bảo vệ dữ liệu cá nhân, bạn có quyền:</p>
        <ul className="list-disc space-y-1 pl-5">
          {RIGHTS.map((r) => (
            <li key={r}>{r};</li>
          ))}
        </ul>
      </Section>

      <Section title="8. Liên hệ">
        <p>
          Gửi yêu cầu tới{' '}
          <a className="text-brand underline" href={`mailto:${PRIVACY_CONTACT}`}>
            {PRIVACY_CONTACT}
          </a>
          , ghi họ tên và email đã dùng khi nộp. Chúng tôi xác minh và phản hồi theo thời hạn pháp
          luật quy định cho từng loại yêu cầu.
        </p>
      </Section>

      <Section title="9. Nhà tuyển dụng và điều khoản sử dụng sàn (bản demo)">
        <p>Khi đăng ký công ty, chúng tôi xử lý:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Thông tin công ty: tên, mã số thuế, website. Quản trị sàn dùng để duyệt, khoá hoặc mở
            khoá công ty.
          </li>
          <li>
            Tài khoản người đăng ký: họ tên, email công việc, mật khẩu (chỉ lưu dạng băm). Email
            dùng để xác minh tài khoản và báo kết quả duyệt; email được gửi qua Mailjet.
          </li>
          <li>
            Địa chỉ IP: dùng để giới hạn số lần đăng ký, đăng nhập; đồng thời được ghi kèm vào nhật
            ký thao tác.
          </li>
          <li>
            Nhật ký thao tác trong công ty và các quyết định duyệt, khoá của Quản trị sàn, ghi theo
            nguyên tắc chỉ ghi thêm (không sửa được) để truy vết.
          </li>
        </ul>
        <p>
          Dữ liệu tài khoản được giữ đến khi tài khoản bị xoá hoặc bản demo được dọn dữ liệu; nhật
          ký thao tác được giữ cùng dữ liệu của công ty. Yêu cầu về dữ liệu này gửi về đầu mối ở mục
          8.
        </p>
        <p>Khi đăng ký, công ty đồng ý với các điều khoản sau:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Chỉ dùng sàn để thử nghiệm, không dùng cho tuyển dụng thật.</li>
          <li>
            Không tải CV của người khác lên nếu chưa thông báo và được họ đồng ý với chính sách này.
          </li>
          <li>
            Quản trị sàn có quyền từ chối hoặc khoá công ty vi phạm các điều trên, và có thể xoá dữ
            liệu demo bất cứ lúc nào.
          </li>
        </ul>
      </Section>

      <p className="type-caption">
        Căn cứ: Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15, Nghị định 356/2025/NĐ-CP và văn bản
        liên quan.
      </p>
    </article>
  )
}
