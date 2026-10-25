import { ApplicationSource } from '../../../common/enums/application-source.enum.js';
import { ApplicationStatus } from '../../../common/enums/application-status.enum.js';

const S = ApplicationStatus;

export type DemoStep = [to: ApplicationStatus, at: string, by: string, reason?: string];
export type DemoNote = [by: string, at: string, content: string];

export interface DemoApplication {
  candidate: string;
  cv: string;
  job: string;
  source: ApplicationSource;
  appliedAt: string;
  uploadedBy?: string;
  ai: 'DONE' | 'PENDING' | 'FAILED';
  steps: DemoStep[];
  notes: DemoNote[];
}

const PUBLIC = ApplicationSource.PublicForm;
const HR = ApplicationSource.HrUpload;

export const ANONYMIZED = { candidate: 'anon', at: '2026-10-06 09:40', by: 'admin' };

export const APPLICATIONS: DemoApplication[] = [
  {
    candidate: 'nam',
    cv: 'nam-1',
    job: 'backend',
    source: PUBLIC,
    appliedAt: '2026-09-12 21:14',
    ai: 'DONE',
    steps: [
      [S.Screening, '2026-09-15 09:20', 'hr.ha'],
      [S.Interview, '2026-09-19 14:00', 'hr.ha'],
    ],
    notes: [
      [
        'hr.ha',
        '2026-09-15 09:25',
        'Hồ sơ mạnh, đúng stack NestJS + PostgreSQL. Đã gọi điện, ứng viên có thể đi làm sau 30 ngày.',
      ],
      [
        'hm.eng',
        '2026-09-24 17:10',
        'Vòng kỹ thuật 1: thiết kế API tốt, hiểu index và transaction. Đề xuất vòng 2 với CTO.',
      ],
      ['hr.ha', '2026-10-01 10:05', 'Đã hẹn vòng 2 lúc 9h ngày 23/10 tại văn phòng Hà Nội.'],
    ],
  },
  {
    candidate: 'hang',
    cv: 'hang-1',
    job: 'backend',
    source: PUBLIC,
    appliedAt: '2026-09-18 08:47',
    ai: 'DONE',
    steps: [[S.Screening, '2026-09-22 10:05', 'hr.ha']],
    notes: [
      [
        'hr.ha',
        '2026-09-22 10:10',
        'Kinh nghiệm NestJS mới khoảng 1,5 năm, thấp hơn yêu cầu. Nhờ anh Long xem có hợp vị trí junior không.',
      ],
      [
        'hm.eng',
        '2026-09-25 16:30',
        'Có thể cân nhắc cho vị trí junior nếu đợt này không đủ người. Tạm giữ hồ sơ.',
      ],
    ],
  },
  {
    candidate: 'huy',
    cv: 'huy-1',
    job: 'backend',
    source: PUBLIC,
    appliedAt: '2026-09-20 22:31',
    ai: 'DONE',
    steps: [
      [
        S.Rejected,
        '2026-09-23 11:00',
        'hr.ha',
        'Chưa có kinh nghiệm NestJS và TypeScript, hồ sơ hợp vị trí Java hơn',
      ],
    ],
    notes: [
      ['hr.ha', '2026-09-23 11:05', 'Đã gợi ý ứng viên nộp vào vị trí Senior Java Developer.'],
    ],
  },
  {
    candidate: 'khoi',
    cv: 'khoi-1',
    job: 'backend',
    source: PUBLIC,
    appliedAt: '2026-10-22 07:52',
    ai: 'PENDING',
    steps: [],
    notes: [],
  },
  {
    candidate: 'huy',
    cv: 'huy-1',
    job: 'java',
    source: PUBLIC,
    appliedAt: '2026-09-23 20:15',
    ai: 'DONE',
    steps: [
      [S.Screening, '2026-09-24 09:00', 'hr.mai'],
      [S.Interview, '2026-09-26 10:30', 'hr.mai'],
      [S.Offer, '2026-10-14 16:00', 'hr.mai'],
    ],
    notes: [
      [
        'hm.eng',
        '2026-10-08 18:20',
        'Phỏng vấn kỹ thuật rất tốt, có kinh nghiệm đối soát với ngân hàng, đúng phần team đang thiếu.',
      ],
      ['hr.mai', '2026-10-14 16:05', 'Đã gửi offer 45 triệu gross, chờ phản hồi trước 24/10.'],
    ],
  },
  {
    candidate: 'thang',
    cv: 'thang-1',
    job: 'java',
    source: PUBLIC,
    appliedAt: '2026-09-05 19:40',
    ai: 'DONE',
    steps: [[S.Screening, '2026-09-08 09:30', 'hr.mai']],
    notes: [
      [
        'hr.mai',
        '2026-09-08 09:35',
        'Hệ thống loại một bằng chứng Kafka vì không có trong CV. Cần hỏi lại khi phỏng vấn.',
      ],
    ],
  },
  {
    candidate: 'ngocanh',
    cv: 'ngocanh-1',
    job: 'frontend',
    source: PUBLIC,
    appliedAt: '2026-09-08 12:10',
    ai: 'DONE',
    steps: [
      [S.Screening, '2026-09-10 09:00', 'hr.ha'],
      [S.Interview, '2026-09-16 15:00', 'hr.ha'],
    ],
    notes: [
      [
        'hm.eng',
        '2026-09-23 11:40',
        'Bài test giao diện làm tốt, code sạch. Cần hỏi thêm về tối ưu render ở vòng sau.',
      ],
    ],
  },
  {
    candidate: 'manh',
    cv: 'manh-1',
    job: 'frontend',
    source: HR,
    uploadedBy: 'hr.ha',
    appliedAt: '2026-10-17 10:20',
    ai: 'DONE',
    steps: [],
    notes: [['hr.ha', '2026-10-17 10:22', 'CV nhận qua email, do anh Long giới thiệu.']],
  },
  {
    candidate: 'tung',
    cv: 'tung-1',
    job: 'frontend',
    source: PUBLIC,
    appliedAt: '2026-09-10 23:05',
    ai: 'DONE',
    steps: [
      [S.Screening, '2026-09-12 10:00', 'hr.ha'],
      [S.Interview, '2026-09-17 09:30', 'hr.ha'],
      [S.Rejected, '2026-09-24 17:00', 'hr.ha', 'Kết quả phỏng vấn kỹ thuật React chưa đạt'],
    ],
    notes: [
      [
        'hm.eng',
        '2026-09-24 15:45',
        'Kiến thức React còn mỏng, nhưng phần Flutter khá ổn. Gợi ý chuyển sang vị trí Mobile.',
      ],
    ],
  },
  {
    candidate: 'tung',
    cv: 'tung-2',
    job: 'flutter',
    source: PUBLIC,
    appliedAt: '2026-09-25 20:40',
    ai: 'DONE',
    steps: [
      [S.Screening, '2026-09-26 09:15', 'hr.bao'],
      [S.Interview, '2026-10-02 14:00', 'hr.bao'],
    ],
    notes: [
      [
        'hm.mobile',
        '2026-10-09 17:30',
        'Kinh nghiệm Flutter chưa đủ 2 năm nhưng tư duy tốt, đã tự làm CI/CD. Đề xuất vòng cuối.',
      ],
    ],
  },
  {
    candidate: 'kimngan',
    cv: 'kimngan-1',
    job: 'flutter',
    source: PUBLIC,
    appliedAt: '2026-09-18 10:05',
    ai: 'DONE',
    steps: [
      [S.Screening, '2026-09-19 08:45', 'hr.bao'],
      [S.Interview, '2026-09-23 10:00', 'hr.bao'],
      [S.Offer, '2026-10-10 11:00', 'hr.bao'],
    ],
    notes: [
      ['hm.mobile', '2026-09-30 16:20', 'Rất phù hợp, có thể dẫn dắt nhóm mobile 3 người.'],
      [
        'hr.bao',
        '2026-10-10 11:05',
        'Ứng viên mong muốn 38 triệu, đã được duyệt ngân sách. Gửi offer qua email.',
      ],
    ],
  },
  {
    candidate: 'long',
    cv: 'long-1',
    job: 'qa',
    source: PUBLIC,
    appliedAt: '2026-09-11 08:30',
    ai: 'DONE',
    steps: [
      [S.Screening, '2026-09-12 14:00', 'hr.mai'],
      [S.Interview, '2026-09-18 09:00', 'hr.mai'],
    ],
    notes: [
      [
        'hm.qa',
        '2026-09-25 10:15',
        'Kinh nghiệm Playwright thực tế, trả lời tốt phần thiết kế test. Chờ vòng 2.',
      ],
    ],
  },
  {
    candidate: 'thuphuong',
    cv: 'thuphuong-1',
    job: 'qa',
    source: PUBLIC,
    appliedAt: '2026-09-30 21:50',
    ai: 'DONE',
    steps: [[S.Screening, '2026-10-02 10:20', 'hr.mai']],
    notes: [],
  },
  {
    candidate: 'minhduc',
    cv: 'minhduc-1',
    job: 'devops',
    source: PUBLIC,
    appliedAt: '2026-09-24 22:10',
    ai: 'DONE',
    steps: [
      [S.Screening, '2026-09-25 09:00', 'hr.bao'],
      [S.Interview, '2026-10-03 20:00', 'hr.bao'],
    ],
    notes: [
      [
        'hm.devops',
        '2026-10-06 21:15',
        'Phỏng vấn online buổi tối theo đề nghị của ứng viên. Nắm chắc Kubernetes và quy trình trực sự cố.',
      ],
    ],
  },
  {
    candidate: 'anhtuan',
    cv: 'anhtuan-1',
    job: 'devops',
    source: PUBLIC,
    appliedAt: '2026-10-20 15:35',
    ai: 'FAILED',
    steps: [],
    notes: [
      [
        'hr.bao',
        '2026-10-21 08:50',
        'CV là ảnh scan nên hệ thống không đọc được. Đã email nhờ ứng viên gửi lại bản PDF có chữ.',
      ],
    ],
  },
  {
    candidate: 'lanhuong',
    cv: 'lanhuong-1',
    job: 'data-eng',
    source: PUBLIC,
    appliedAt: '2026-09-28 09:12',
    ai: 'DONE',
    steps: [[S.Screening, '2026-09-30 10:00', 'hr.ha']],
    notes: [
      [
        'hm.data',
        '2026-10-03 14:00',
        'Kinh nghiệm Spark tốt. Hẹn phỏng vấn sau khi anh Khải đi công tác về.',
      ],
    ],
  },
  {
    candidate: 'minhquan',
    cv: 'minhquan-2',
    job: 'data-eng',
    source: PUBLIC,
    appliedAt: '2026-10-01 23:30',
    ai: 'DONE',
    steps: [
      [S.Screening, '2026-10-03 09:10', 'hr.ha'],
      [S.Withdrawn, '2026-10-13 10:00', 'hr.ha', 'Ứng viên báo đã nhận việc ở công ty khác'],
    ],
    notes: [],
  },
  {
    candidate: 'minhquan',
    cv: 'minhquan-1',
    job: 'data-analyst',
    source: PUBLIC,
    appliedAt: '2026-07-28 22:00',
    ai: 'DONE',
    steps: [
      [S.Screening, '2026-07-30 09:00', 'hr.ha'],
      [S.Rejected, '2026-08-04 15:00', 'hr.ha', 'Chưa đủ kinh nghiệm SQL và chưa dùng công cụ BI'],
    ],
    notes: [],
  },
  {
    candidate: 'myduyen',
    cv: 'myduyen-1',
    job: 'data-analyst',
    source: PUBLIC,
    appliedAt: '2026-07-23 08:20',
    ai: 'DONE',
    steps: [
      [S.Screening, '2026-07-24 10:00', 'hr.ha'],
      [S.Interview, '2026-07-29 14:00', 'hr.ha'],
      [S.Offer, '2026-08-12 16:00', 'hr.ha'],
      [S.Hired, '2026-08-14 09:30', 'hm.data'],
    ],
    notes: [
      ['hm.data', '2026-08-01 11:00', 'Bài case phân tích tồn kho làm tốt, trình bày rõ ràng.'],
      ['hr.ha', '2026-08-14 09:40', 'Ứng viên đồng ý offer, ngày đi làm 01/09.'],
    ],
  },
  {
    candidate: 'giabao',
    cv: 'giabao-1',
    job: 'po',
    source: HR,
    uploadedBy: 'hr.trang',
    appliedAt: '2026-10-07 14:25',
    ai: 'DONE',
    steps: [[S.Screening, '2026-10-09 09:00', 'hr.trang']],
    notes: [['hr.trang', '2026-10-07 14:30', 'Ứng viên do anh Vinh giới thiệu, gửi CV qua Zalo.']],
  },
  {
    candidate: 'thanhtam',
    cv: 'thanhtam-1',
    job: 'account-manager',
    source: PUBLIC,
    appliedAt: '2026-07-14 20:30',
    ai: 'DONE',
    steps: [
      [S.Screening, '2026-07-15 09:30', 'hr.ha'],
      [S.Interview, '2026-07-22 10:00', 'hr.ha'],
      [S.Offer, '2026-08-05 15:00', 'hr.ha'],
      [S.Rejected, '2026-08-08 10:00', 'hm.sales', 'Mức lương mong muốn vượt ngân sách của vị trí'],
    ],
    notes: [],
  },
  {
    candidate: 'ngochan',
    cv: 'ngochan-1',
    job: 'account-manager',
    source: PUBLIC,
    appliedAt: '2026-07-16 11:00',
    ai: 'DONE',
    steps: [
      [S.Screening, '2026-07-17 09:00', 'hr.ha'],
      [S.Interview, '2026-07-24 14:00', 'hr.ha'],
      [S.Offer, '2026-08-11 10:00', 'hr.ha'],
      [S.Hired, '2026-08-13 15:00', 'hm.sales'],
    ],
    notes: [
      [
        'hm.sales',
        '2026-08-13 15:05',
        'Đã duyệt. Bắt đầu từ 01/09, phụ trách nhóm khách hàng chuỗi F&B.',
      ],
    ],
  },
  {
    candidate: 'thanhtam',
    cv: 'thanhtam-1',
    job: 'sales-b2b',
    source: PUBLIC,
    appliedAt: '2026-10-01 09:40',
    ai: 'DONE',
    steps: [
      [S.Screening, '2026-10-02 08:50', 'hr.mai'],
      [S.Interview, '2026-10-08 10:00', 'hr.mai'],
    ],
    notes: [
      [
        'hm.sales',
        '2026-10-12 17:00',
        'Từng vào vòng offer vị trí Account Manager, lần này mức lương phù hợp hơn. Vòng 1 tốt.',
      ],
    ],
  },
  {
    candidate: 'bichngoc',
    cv: 'bichngoc-1',
    job: 'cs',
    source: PUBLIC,
    appliedAt: '2026-10-08 19:20',
    ai: 'DONE',
    steps: [],
    notes: [],
  },
  {
    candidate: 'vanhieu',
    cv: 'vanhieu-1',
    job: 'cs',
    source: PUBLIC,
    appliedAt: '2026-10-22 06:58',
    ai: 'PENDING',
    steps: [],
    notes: [],
  },
  {
    candidate: 'hongnhung',
    cv: 'hongnhung-1',
    job: 'performance',
    source: PUBLIC,
    appliedAt: '2026-09-15 21:05',
    ai: 'DONE',
    steps: [[S.Screening, '2026-09-17 09:00', 'hr.bao']],
    notes: [
      ['hm.mkt', '2026-09-22 10:30', 'Chưa dùng GA4 nhưng số liệu tối ưu chi phí rất ấn tượng.'],
    ],
  },
  {
    candidate: 'anon',
    cv: 'anon-1',
    job: 'performance',
    source: PUBLIC,
    appliedAt: '2026-09-14 13:30',
    ai: 'DONE',
    steps: [[S.Rejected, '2026-09-16 10:00', 'hr.bao', 'Chưa có kinh nghiệm chạy Facebook Ads']],
    notes: [
      [
        'hr.bao',
        '2026-10-06 09:15',
        'Ứng viên gửi email yêu cầu xoá dữ liệu cá nhân, đã chuyển Admin xử lý.',
      ],
    ],
  },
  {
    candidate: 'thuylinh',
    cv: 'thuylinh-1',
    job: 'content',
    source: PUBLIC,
    appliedAt: '2026-07-18 10:00',
    ai: 'DONE',
    steps: [
      [S.Screening, '2026-07-19 09:00', 'hr.mai'],
      [S.Interview, '2026-07-25 14:00', 'hr.mai'],
      [S.Offer, '2026-08-08 10:00', 'hr.mai'],
      [S.Hired, '2026-08-11 16:00', 'hm.mkt'],
    ],
    notes: [['hm.mkt', '2026-07-28 09:45', 'Bài viết thử chất lượng, hiểu SEO thực tế.']],
  },
  {
    candidate: 'thaovy',
    cv: 'thaovy-1',
    job: 'recruiter',
    source: HR,
    uploadedBy: 'hr.trang',
    appliedAt: '2026-10-14 16:10',
    ai: 'DONE',
    steps: [],
    notes: [['hm.hr', '2026-10-16 11:20', 'Hồ sơ ổn, ưu tiên hẹn phỏng vấn tuần sau.']],
  },
  {
    candidate: 'thu',
    cv: 'thu-1',
    job: 'accountant',
    source: PUBLIC,
    appliedAt: '2026-10-13 20:45',
    ai: 'DONE',
    steps: [[S.Screening, '2026-10-15 09:30', 'hr.trang']],
    notes: [
      [
        'hm.fin',
        '2026-10-17 14:10',
        'Kinh nghiệm phù hợp. Chưa có chứng chỉ kế toán trưởng nhưng không bắt buộc.',
      ],
    ],
  },
  {
    candidate: 'baotram',
    cv: 'baotram-1',
    job: 'uiux',
    source: PUBLIC,
    appliedAt: '2026-07-05 09:00',
    ai: 'DONE',
    steps: [
      [S.Screening, '2026-07-06 10:00', 'hr.mai'],
      [S.Interview, '2026-07-10 14:00', 'hr.mai'],
      [S.Offer, '2026-07-24 11:00', 'hr.mai'],
      [S.Hired, '2026-07-27 09:00', 'hm.design'],
    ],
    notes: [['hm.design', '2026-07-15 16:00', 'Portfolio rất mạnh, đặc biệt phần design system.']],
  },
];
