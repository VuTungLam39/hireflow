import { JobStatus } from '../../../modules/jobs/entities/job.entity.js';
import { RequirementType } from '../../../modules/jobs/entities/job-requirement.entity.js';

const M = RequirementType.Must;
const N = RequirementType.Nice;

export type DemoRequirement = [
  label: string,
  type: RequirementType,
  weight: 1 | 2 | 3,
  minYears: number | null,
  keywords: string[],
];

export interface DemoJob {
  key: string;
  department: string;
  title: string;
  location: string;
  status: JobStatus;
  createdBy: string;
  createdAt: string;
  publishedAt?: string;
  closedAt?: string;
  jd: string[];
  versions: { savedAt: string; requirements: DemoRequirement[] }[];
}

const BENEFITS =
  'Quyền lợi: lương tháng 13 và thưởng theo kết quả kinh doanh; review lương 2 lần mỗi năm; bảo hiểm sức khoẻ cho bản thân và gia đình; 15 ngày phép mỗi năm; làm việc hybrid 2 ngày ở nhà mỗi tuần.';

export const JOBS: DemoJob[] = [
  {
    key: 'backend',
    department: 'ENG',
    title: 'Backend Developer (NestJS)',
    location: 'Hà Nội',
    status: JobStatus.Open,
    createdBy: 'hr.ha',
    createdAt: '2026-09-01 09:15',
    publishedAt: '2026-09-03 10:00',
    jd: [
      'Chúng tôi tìm Backend Developer tham gia đội xây dựng nền tảng quản lý đơn hàng cho chuỗi bán lẻ với hơn 300 cửa hàng trên toàn quốc.',
      'Mô tả công việc: thiết kế và phát triển REST API bằng NestJS; tối ưu truy vấn PostgreSQL cho các bảng hàng chục triệu dòng; viết unit test và tham gia review code; phối hợp với Frontend và QA trong các sprint 2 tuần.',
      'Yêu cầu: tối thiểu 2 năm làm NestJS; thành thạo TypeScript và PostgreSQL. Ưu tiên ứng viên đã dùng Redis làm cache hoặc hàng đợi, biết đóng gói dịch vụ bằng Docker.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-09-02 16:40',
        requirements: [
          ['NestJS', M, 3, 2, ['nestjs', 'nest.js']],
          ['PostgreSQL', M, 2, null, ['postgresql', 'postgres']],
          ['Redis', N, 1, null, ['redis']],
          ['Docker', N, 1, null, ['docker']],
        ],
      },
      {
        savedAt: '2026-09-10 11:20',
        requirements: [
          ['NestJS', M, 3, 2, ['nestjs', 'nest.js']],
          ['TypeScript', M, 2, 1, ['typescript']],
          ['PostgreSQL', M, 2, null, ['postgresql', 'postgres']],
          ['Redis', N, 1, null, ['redis']],
          ['Docker', N, 1, null, ['docker']],
        ],
      },
    ],
  },
  {
    key: 'java',
    department: 'ENG',
    title: 'Senior Java Developer',
    location: 'Hồ Chí Minh',
    status: JobStatus.Open,
    createdBy: 'hr.mai',
    createdAt: '2026-08-20 14:00',
    publishedAt: '2026-08-22 09:00',
    jd: [
      'Tham gia phát triển hệ thống thanh toán xử lý khoảng 2 triệu giao dịch mỗi ngày cho đối tác ngân hàng.',
      'Mô tả công việc: phát triển và bảo trì các microservice bằng Java 21 và Spring Boot; thiết kế luồng xử lý bất đồng bộ qua Kafka; hướng dẫn 2–3 lập trình viên junior.',
      'Yêu cầu: từ 4 năm kinh nghiệm Java, từ 3 năm với Spring Boot. Ưu tiên ứng viên đã làm kiến trúc microservices và Kafka.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-08-21 10:30',
        requirements: [
          ['Java', M, 3, 4, ['java']],
          ['Spring Boot', M, 3, 3, ['spring boot', 'spring']],
          ['Microservices', N, 2, null, ['microservices', 'microservice']],
          ['Kafka', N, 2, null, ['kafka']],
        ],
      },
    ],
  },
  {
    key: 'frontend',
    department: 'ENG',
    title: 'Frontend Developer (React)',
    location: 'Hà Nội',
    status: JobStatus.Open,
    createdBy: 'hr.ha',
    createdAt: '2026-09-05 08:45',
    publishedAt: '2026-09-06 09:00',
    jd: [
      'Xây dựng giao diện quản trị cho nền tảng bán lẻ đa kênh, phục vụ khoảng 2.000 nhân viên cửa hàng mỗi ngày.',
      'Mô tả công việc: phát triển các màn hình bằng React và TypeScript; xây dựng thư viện component dùng chung trên Tailwind CSS; viết test cho component và hook.',
      'Yêu cầu: từ 2 năm kinh nghiệm React, từ 1 năm TypeScript. Ưu tiên ứng viên đã dùng Tailwind CSS và viết test bằng Vitest hoặc Jest.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-09-05 15:10',
        requirements: [
          ['React', M, 3, 2, ['react', 'reactjs']],
          ['TypeScript', M, 2, 1, ['typescript']],
          ['Tailwind CSS', N, 1, null, ['tailwind', 'tailwind css']],
          ['Kiểm thử frontend', N, 1, null, ['vitest', 'jest', 'testing library']],
        ],
      },
    ],
  },
  {
    key: 'flutter',
    department: 'MOBILE',
    title: 'Mobile Developer (Flutter)',
    location: 'Đà Nẵng',
    status: JobStatus.Open,
    createdBy: 'hr.bao',
    createdAt: '2026-09-15 10:20',
    publishedAt: '2026-09-16 08:30',
    jd: [
      'Phát triển ứng dụng tích điểm khách hàng thân thiết trên iOS và Android, hiện có khoảng 500.000 người dùng hoạt động mỗi tháng.',
      'Mô tả công việc: phát triển tính năng mới bằng Flutter; tích hợp Firebase cho thông báo đẩy và theo dõi lỗi; tự động hoá quy trình phát hành lên App Store và Google Play.',
      'Yêu cầu: từ 2 năm kinh nghiệm Flutter, nắm chắc Dart. Ưu tiên ứng viên đã dùng Firebase và Fastlane hoặc Codemagic.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-09-15 16:00',
        requirements: [
          ['Flutter', M, 3, 2, ['flutter']],
          ['Dart', M, 2, null, ['dart']],
          ['Firebase', N, 1, null, ['firebase']],
          ['CI/CD cho mobile', N, 1, null, ['fastlane', 'codemagic']],
        ],
      },
    ],
  },
  {
    key: 'qa',
    department: 'QA',
    title: 'QA Automation Engineer',
    location: 'Hà Nội',
    status: JobStatus.Open,
    createdBy: 'hr.mai',
    createdAt: '2026-09-08 09:00',
    publishedAt: '2026-09-09 09:00',
    jd: [
      'Đảm bảo chất lượng cho hệ thống quản lý đơn hàng và ứng dụng tích điểm, phát hành mỗi 2 tuần.',
      'Mô tả công việc: xây dựng và duy trì bộ kiểm thử tự động giao diện và API; tích hợp kiểm thử vào pipeline CI; phân tích lỗi cùng đội phát triển.',
      'Yêu cầu: từ 2 năm kinh nghiệm kiểm thử tự động với Selenium, Playwright hoặc Cypress; kiểm thử API bằng Postman. Ưu tiên ứng viên viết được SQL và có chứng chỉ ISTQB.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-09-08 14:30',
        requirements: [
          ['Kiểm thử tự động', M, 3, 2, ['selenium', 'playwright', 'cypress']],
          ['Kiểm thử API', M, 2, null, ['postman', 'rest assured', 'kiem thu api']],
          ['SQL', N, 1, null, ['sql']],
          ['ISTQB', N, 1, null, ['istqb']],
        ],
      },
    ],
  },
  {
    key: 'devops',
    department: 'DEVOPS',
    title: 'DevOps Engineer',
    location: 'Remote',
    status: JobStatus.Open,
    createdBy: 'hr.bao',
    createdAt: '2026-09-20 10:00',
    publishedAt: '2026-09-22 08:00',
    jd: [
      'Vận hành hạ tầng cho khoảng 40 dịch vụ chạy trên Kubernetes, kết hợp AWS và máy chủ tại chỗ.',
      'Mô tả công việc: quản lý cụm Kubernetes; xây dựng pipeline CI/CD; quản lý hạ tầng bằng Terraform; trực sự cố theo lịch luân phiên.',
      'Yêu cầu: từ 1 năm vận hành Kubernetes; đã xây dựng pipeline bằng GitHub Actions, GitLab CI hoặc Jenkins. Ưu tiên ứng viên có kinh nghiệm AWS và Terraform.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-09-21 09:45',
        requirements: [
          ['Kubernetes', M, 3, 1, ['kubernetes', 'k8s']],
          ['CI/CD', M, 2, null, ['github actions', 'gitlab ci', 'jenkins']],
          ['AWS', N, 2, null, ['aws']],
          ['Terraform', N, 1, null, ['terraform']],
        ],
      },
    ],
  },
  {
    key: 'data-eng',
    department: 'DATA',
    title: 'Data Engineer',
    location: 'Hà Nội',
    status: JobStatus.Open,
    createdBy: 'hr.ha',
    createdAt: '2026-09-25 09:30',
    publishedAt: '2026-09-26 09:00',
    jd: [
      'Xây dựng kho dữ liệu tập trung cho dữ liệu bán hàng, tồn kho và khách hàng thân thiết, phục vụ đội phân tích và đội AI.',
      'Mô tả công việc: phát triển pipeline ETL bằng Python và Spark; lập lịch và giám sát luồng dữ liệu bằng Airflow; tối ưu truy vấn SQL trên kho dữ liệu.',
      'Yêu cầu: từ 2 năm lập trình Python cho xử lý dữ liệu; thành thạo SQL. Ưu tiên ứng viên đã dùng Spark và Airflow.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-09-25 15:20',
        requirements: [
          ['Python', M, 3, 2, ['python']],
          ['SQL', M, 2, null, ['sql']],
          ['Apache Spark', N, 2, null, ['spark', 'pyspark']],
          ['Airflow', N, 1, null, ['airflow']],
        ],
      },
    ],
  },
  {
    key: 'ai-llm',
    department: 'AI',
    title: 'AI Engineer (LLM)',
    location: 'Hồ Chí Minh',
    status: JobStatus.Draft,
    createdBy: 'hr.trang',
    createdAt: '2026-10-20 15:30',
    jd: [
      'Xây dựng trợ lý AI cho nhân viên cửa hàng: tra cứu chính sách, tồn kho và hướng dẫn quy trình bằng tiếng Việt.',
      'Mô tả công việc: thiết kế pipeline RAG; đánh giá chất lượng câu trả lời; tối ưu chi phí gọi mô hình ngôn ngữ lớn.',
      'Yêu cầu: kinh nghiệm Python, đã triển khai ứng dụng dùng LLM vào thực tế; hiểu về vector database và đánh giá mô hình.',
      BENEFITS,
    ],
    versions: [],
  },
  // US-10: demo
  {
    key: 'fullstack',
    department: 'ENG',
    title: 'Fullstack Developer (NestJS + React)',
    location: 'Hà Nội',
    status: JobStatus.Draft,
    createdBy: 'hr.ha',
    createdAt: '2026-10-24 14:00',
    jd: [
      'Tham gia đội phát triển cổng thông tin cho đối tác bán hàng: một người làm trọn tính năng từ API tới giao diện.',
      'Mô tả công việc: viết API bằng NestJS và PostgreSQL; xây màn hình bằng React; đóng gói dịch vụ bằng Docker.',
      'Yêu cầu: tối thiểu 1 năm NestJS và có kinh nghiệm React. Ưu tiên ứng viên biết PostgreSQL, Docker.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-10-24 16:30',
        requirements: [
          ['NestJS', M, 3, 1, ['nestjs', 'nest.js']],
          ['React', M, 2, null, ['react', 'reactjs']],
          ['PostgreSQL', N, 1, null, ['postgresql', 'postgres']],
          ['Docker', N, 1, null, ['docker']],
        ],
      },
    ],
  },
  {
    key: 'po',
    department: 'PRODUCT',
    title: 'Product Owner',
    location: 'Hà Nội',
    status: JobStatus.Open,
    createdBy: 'hr.trang',
    createdAt: '2026-10-01 10:00',
    publishedAt: '2026-10-02 09:00',
    jd: [
      'Phụ trách sản phẩm ứng dụng tích điểm khách hàng thân thiết, làm việc cùng một đội Scrum 7 người.',
      'Mô tả công việc: quản lý và sắp xếp ưu tiên backlog; viết user story kèm tiêu chí nghiệm thu; phân tích số liệu sử dụng để đề xuất cải tiến.',
      'Yêu cầu: từ 2 năm làm Product Owner hoặc BA trong môi trường Scrum. Ưu tiên ứng viên tự viết được SQL và dùng Figma để phác thảo luồng.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-10-01 16:15',
        requirements: [
          ['Quản lý backlog', M, 3, 2, ['product owner', 'backlog', 'scrum']],
          [
            'Phân tích nghiệp vụ',
            M,
            2,
            null,
            ['business analysis', 'phan tich nghiep vu', 'user story'],
          ],
          ['SQL', N, 1, null, ['sql']],
          ['Figma', N, 1, null, ['figma']],
        ],
      },
    ],
  },
  {
    key: 'uiux',
    department: 'DESIGN',
    title: 'UI/UX Designer',
    location: 'Hồ Chí Minh',
    status: JobStatus.Closed,
    createdBy: 'hr.mai',
    createdAt: '2026-07-01 09:00',
    publishedAt: '2026-07-02 09:00',
    closedAt: '2026-08-15 17:00',
    jd: [
      'Thiết kế trải nghiệm cho ứng dụng tích điểm và trang quản trị cửa hàng.',
      'Mô tả công việc: thiết kế giao diện trên Figma; xây dựng và duy trì design system; tổ chức phỏng vấn người dùng và kiểm thử khả dụng.',
      'Yêu cầu: từ 2 năm thiết kế sản phẩm số bằng Figma. Ưu tiên ứng viên đã xây dựng design system và có kinh nghiệm user research.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-07-01 15:00',
        requirements: [
          ['Figma', M, 3, 2, ['figma']],
          ['Design system', N, 2, null, ['design system']],
          [
            'User research',
            N,
            2,
            null,
            ['user research', 'usability test', 'phong van nguoi dung'],
          ],
        ],
      },
    ],
  },
  {
    key: 'security',
    department: 'SEC',
    title: 'Chuyên viên An toàn thông tin',
    location: 'Hà Nội',
    status: JobStatus.Draft,
    createdBy: 'hr.bao',
    createdAt: '2026-10-15 09:20',
    jd: [
      'Bảo vệ hệ thống thanh toán và dữ liệu khách hàng theo tiêu chuẩn PCI DSS.',
      'Mô tả công việc: kiểm thử xâm nhập định kỳ cho ứng dụng web và mobile; rà soát mã nguồn theo OWASP; phối hợp xử lý sự cố bảo mật.',
      'Yêu cầu: từ 2 năm kinh nghiệm pentest; nắm vững OWASP Top 10. Ưu tiên ứng viên có chứng chỉ CEH hoặc OSCP.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-10-15 14:00',
        requirements: [
          ['Kiểm thử xâm nhập', M, 3, 2, ['pentest', 'penetration testing']],
          ['OWASP', M, 2, null, ['owasp']],
          ['Chứng chỉ bảo mật', N, 1, null, ['ceh', 'oscp']],
        ],
      },
    ],
  },
  {
    key: 'sales-b2b',
    department: 'SALES',
    title: 'Chuyên viên kinh doanh B2B (phần mềm)',
    location: 'Hà Nội',
    status: JobStatus.Open,
    createdBy: 'hr.mai',
    createdAt: '2026-09-28 08:30',
    publishedAt: '2026-09-29 09:00',
    jd: [
      'Phát triển khách hàng doanh nghiệp cho giải pháp phần mềm quản lý bán lẻ tại khu vực miền Bắc.',
      'Mô tả công việc: tìm kiếm và chăm sóc khách hàng doanh nghiệp; tư vấn, trình bày giải pháp và đàm phán hợp đồng; cập nhật cơ hội bán hàng trên CRM.',
      'Yêu cầu: từ 2 năm bán hàng B2B. Ưu tiên ứng viên đã dùng Salesforce hoặc HubSpot, tiếng Anh giao tiếp tốt (TOEIC từ 650).',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-09-28 15:00',
        requirements: [
          ['Bán hàng B2B', M, 3, 2, ['b2b', 'ban hang doanh nghiep']],
          ['CRM', N, 1, null, ['crm', 'salesforce', 'hubspot']],
          ['Tiếng Anh', N, 1, null, ['toeic', 'ielts', 'tieng anh']],
        ],
      },
    ],
  },
  {
    key: 'account-manager',
    department: 'SALES',
    title: 'Account Manager',
    location: 'Hồ Chí Minh',
    status: JobStatus.Closed,
    createdBy: 'hr.ha',
    createdAt: '2026-07-10 09:00',
    publishedAt: '2026-07-11 09:00',
    closedAt: '2026-09-05 17:30',
    jd: [
      'Quản lý nhóm khách hàng chuỗi bán lẻ lớn đang dùng giải pháp của công ty tại khu vực phía Nam.',
      'Mô tả công việc: duy trì quan hệ với khách hàng hiện có; đàm phán gia hạn và bán thêm dịch vụ; phối hợp đội triển khai xử lý yêu cầu.',
      'Yêu cầu: từ 3 năm quản lý khách hàng doanh nghiệp; kỹ năng đàm phán tốt.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-07-10 16:00',
        requirements: [
          [
            'Quản lý khách hàng',
            M,
            3,
            3,
            ['account management', 'key account', 'quan ly khach hang'],
          ],
          ['Đàm phán', M, 2, null, ['dam phan', 'negotiation']],
        ],
      },
    ],
  },
  {
    key: 'cs',
    department: 'CS',
    title: 'Chuyên viên Chăm sóc khách hàng',
    location: 'Đà Nẵng',
    status: JobStatus.Open,
    createdBy: 'hr.trang',
    createdAt: '2026-10-05 08:00',
    publishedAt: '2026-10-06 08:30',
    jd: [
      'Hỗ trợ chủ cửa hàng sử dụng phần mềm quản lý bán hàng qua điện thoại, chat và email.',
      'Mô tả công việc: tiếp nhận và xử lý yêu cầu hỗ trợ; hướng dẫn khách hàng sử dụng tính năng mới; ghi nhận phản hồi gửi đội sản phẩm.',
      'Yêu cầu: từ 1 năm chăm sóc khách hàng. Ưu tiên ứng viên đã dùng Zendesk hoặc Freshdesk và giao tiếp được bằng tiếng Anh.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-10-05 14:20',
        requirements: [
          [
            'Chăm sóc khách hàng',
            M,
            3,
            1,
            ['cham soc khach hang', 'customer service', 'customer support'],
          ],
          ['Công cụ helpdesk', N, 1, null, ['zendesk', 'freshdesk']],
          ['Tiếng Anh', N, 1, null, ['toeic', 'ielts', 'tieng anh']],
        ],
      },
    ],
  },
  {
    key: 'performance',
    department: 'MKT',
    title: 'Performance Marketing Specialist',
    location: 'Hà Nội',
    status: JobStatus.Open,
    createdBy: 'hr.bao',
    createdAt: '2026-09-12 09:00',
    publishedAt: '2026-09-13 09:00',
    jd: [
      'Quản lý ngân sách quảng cáo khoảng 1,5 tỷ đồng mỗi tháng cho ứng dụng tích điểm và các chiến dịch khuyến mãi.',
      'Mô tả công việc: lên kế hoạch và tối ưu chiến dịch Facebook Ads, Google Ads; theo dõi chuyển đổi trên Google Analytics 4; báo cáo hiệu quả hằng tuần.',
      'Yêu cầu: từ 1 năm chạy Facebook Ads với ngân sách lớn; đã chạy Google Ads. Ưu tiên ứng viên thành thạo GA4.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-09-12 15:30',
        requirements: [
          ['Facebook Ads', M, 3, 1, ['facebook ads', 'meta ads']],
          ['Google Ads', M, 2, null, ['google ads']],
          ['Google Analytics', N, 1, null, ['google analytics', 'ga4']],
        ],
      },
    ],
  },
  {
    key: 'content',
    department: 'MKT',
    title: 'Content Marketing Executive',
    location: 'Remote',
    status: JobStatus.Closed,
    createdBy: 'hr.mai',
    createdAt: '2026-07-15 09:00',
    publishedAt: '2026-07-16 09:00',
    closedAt: '2026-08-30 17:00',
    jd: [
      'Sản xuất nội dung cho blog, fanpage và email marketing hướng tới chủ cửa hàng bán lẻ.',
      'Mô tả công việc: lên kế hoạch và viết bài; tối ưu SEO cho blog; phối hợp thiết kế làm ấn phẩm.',
      'Yêu cầu: từ 1 năm viết content marketing. Ưu tiên ứng viên có kinh nghiệm SEO.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-07-15 14:00',
        requirements: [
          ['Viết nội dung', M, 3, 1, ['content', 'copywriting', 'viet bai']],
          ['SEO', N, 2, null, ['seo']],
        ],
      },
    ],
  },
  {
    key: 'recruiter',
    department: 'HR',
    title: 'Chuyên viên Tuyển dụng IT',
    location: 'Hà Nội',
    status: JobStatus.Open,
    createdBy: 'hr.ha',
    createdAt: '2026-10-08 09:00',
    publishedAt: '2026-10-09 09:00',
    jd: [
      'Tuyển dụng cho khối công nghệ với kế hoạch khoảng 40 vị trí trong năm 2027.',
      'Mô tả công việc: tìm kiếm ứng viên qua LinkedIn và cộng đồng IT; sàng lọc hồ sơ, sắp xếp phỏng vấn; xây dựng thương hiệu tuyển dụng.',
      'Yêu cầu: từ 1 năm tuyển dụng vị trí IT. Ưu tiên ứng viên giỏi sourcing trên LinkedIn.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-10-08 15:00',
        requirements: [
          ['Tuyển dụng IT', M, 3, 1, ['tuyen dung', 'recruitment', 'headhunt']],
          ['Sourcing', N, 2, null, ['linkedin', 'sourcing']],
        ],
      },
    ],
  },
  {
    key: 'accountant',
    department: 'FIN',
    title: 'Kế toán tổng hợp',
    location: 'Hà Nội',
    status: JobStatus.Open,
    createdBy: 'hr.trang',
    createdAt: '2026-10-10 10:00',
    publishedAt: '2026-10-12 08:00',
    jd: [
      'Phụ trách sổ sách kế toán của công ty và 2 công ty con, quy mô khoảng 400 nhân sự.',
      'Mô tả công việc: hạch toán, kiểm tra chứng từ; lập báo cáo tài chính và báo cáo thuế; làm việc với kiểm toán độc lập.',
      'Yêu cầu: từ 3 năm kế toán tổng hợp; sử dụng thành thạo MISA. Ưu tiên ứng viên có chứng chỉ kế toán trưởng hoặc ACCA.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-10-10 16:00',
        requirements: [
          ['Kế toán tổng hợp', M, 3, 3, ['ke toan tong hop']],
          ['MISA', N, 2, null, ['misa']],
          ['Chứng chỉ kế toán', N, 1, null, ['ke toan truong', 'acca', 'cpa']],
        ],
      },
    ],
  },
  {
    key: 'data-analyst',
    department: 'DATA',
    title: 'Data Analyst',
    location: 'Hà Nội',
    status: JobStatus.Closed,
    createdBy: 'hr.ha',
    createdAt: '2026-07-20 09:00',
    publishedAt: '2026-07-21 09:00',
    closedAt: '2026-09-10 17:00',
    jd: [
      'Phân tích dữ liệu bán hàng và hành vi khách hàng để hỗ trợ đội kinh doanh và marketing ra quyết định.',
      'Mô tả công việc: viết truy vấn SQL; xây dựng dashboard trên Power BI; trình bày kết quả phân tích cho các phòng ban.',
      'Yêu cầu: từ 1 năm phân tích dữ liệu bằng SQL. Ưu tiên ứng viên đã dùng Power BI hoặc Tableau và thành thạo Excel.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-07-20 15:00',
        requirements: [
          ['SQL', M, 3, 1, ['sql']],
          ['Công cụ BI', N, 2, null, ['power bi', 'tableau']],
          ['Excel', N, 1, null, ['excel']],
        ],
      },
    ],
  },
  {
    key: 'legal',
    department: 'LEGAL',
    title: 'Chuyên viên Pháp chế',
    location: 'Hà Nội',
    status: JobStatus.Draft,
    createdBy: 'hr.trang',
    createdAt: '2026-10-18 10:30',
    jd: [
      'Tư vấn pháp lý cho hoạt động kinh doanh phần mềm và xử lý dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP.',
      'Mô tả công việc: soạn thảo, rà soát hợp đồng với khách hàng và đối tác; theo dõi thay đổi pháp luật liên quan; hỗ trợ các phòng ban về tuân thủ.',
      'Yêu cầu: tốt nghiệp Luật, từ 2 năm kinh nghiệm pháp chế doanh nghiệp. Ưu tiên ứng viên hiểu về bảo vệ dữ liệu cá nhân.',
      BENEFITS,
    ],
    versions: [
      {
        savedAt: '2026-10-18 16:00',
        requirements: [
          ['Pháp chế doanh nghiệp', M, 3, 2, ['phap che', 'legal']],
          ['Soạn thảo hợp đồng', M, 2, null, ['hop dong', 'contract']],
          ['Bảo vệ dữ liệu cá nhân', N, 1, null, ['du lieu ca nhan', 'nghi dinh 13']],
        ],
      },
    ],
  },
];
