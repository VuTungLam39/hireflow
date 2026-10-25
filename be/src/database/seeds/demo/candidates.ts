export type DemoSkill = [name: string, years: number | null, evidence: string];

export interface DemoExperience {
  title: string;
  company: string;
  from: string;
  to: string | null;
  lines: string[];
}

export interface DemoCv {
  key: string;
  fileName: string;
  headline: string;
  summary: string;
  experiences: DemoExperience[];
  skillLines: string[];
  education: { school: string; degree: string; year: number };
  skills: DemoSkill[];
  hallucinated?: DemoSkill[];
  scanned?: boolean;
}

export interface DemoCandidate {
  key: string;
  fullName: string;
  email: string;
  phone: string | null;
  city: string;
  cvs: DemoCv[];
}

const HUST = 'Đại học Bách khoa Hà Nội';
const UET = 'Trường Đại học Công nghệ – ĐHQG Hà Nội';
const HCMUS = 'Trường Đại học Khoa học Tự nhiên – ĐHQG TP.HCM';
const HCMUT = 'Trường Đại học Bách khoa – ĐHQG TP.HCM';
const PTIT = 'Học viện Công nghệ Bưu chính Viễn thông';
const DUT = 'Trường Đại học Bách khoa – Đại học Đà Nẵng';
const NEU = 'Đại học Kinh tế Quốc dân';
const FTU = 'Trường Đại học Ngoại thương';
const UEH = 'Đại học Kinh tế TP.HCM';
const AOF = 'Học viện Tài chính';

export const CANDIDATES: DemoCandidate[] = [
  {
    key: 'nam',
    fullName: 'Nguyễn Hoàng Nam',
    email: 'nam.nguyenhoang@gmail.com',
    phone: '0912458731',
    city: 'Hà Nội',
    cvs: [
      {
        key: 'nam-1',
        fileName: 'CV_NguyenHoangNam_Backend.docx',
        headline: 'Backend Developer – NestJS, PostgreSQL',
        summary:
          'Hơn 4 năm phát triển backend cho hệ thống thương mại điện tử và logistics. Mong muốn tham gia sản phẩm có lượng người dùng lớn, nơi được tối ưu hiệu năng và thiết kế hệ thống.',
        experiences: [
          {
            title: 'Backend Developer',
            company: 'Công ty Cổ phần Giao vận Nhanh Việt',
            from: '2023-03',
            to: null,
            lines: [
              '3 năm phát triển REST API bằng NestJS cho hệ thống điều phối giao hàng, phục vụ khoảng 80.000 đơn mỗi ngày.',
              'Thiết kế lại schema PostgreSQL và thêm index, giảm thời gian truy vấn báo cáo từ 12 giây xuống dưới 1 giây.',
              'Đóng gói các dịch vụ bằng Docker và viết pipeline triển khai lên môi trường staging.',
            ],
          },
          {
            title: 'Lập trình viên Node.js',
            company: 'Công ty TNHH Phần mềm Sao Mai',
            from: '2021-07',
            to: '2023-02',
            lines: [
              'Xây dựng API cho website bán hàng bằng Express và TypeScript.',
              'Viết unit test bằng Jest, nâng độ phủ test của module thanh toán lên 75%.',
            ],
          },
        ],
        skillLines: [
          'Ngôn ngữ: TypeScript (4 năm), JavaScript, SQL.',
          'Framework: NestJS, Express. Cơ sở dữ liệu: PostgreSQL (3 năm), MongoDB.',
          'Công cụ: Docker, Git, GitHub Actions.',
        ],
        education: { school: HUST, degree: 'Kỹ sư Công nghệ thông tin', year: 2021 },
        skills: [
          [
            'NestJS',
            3,
            '3 năm phát triển REST API bằng NestJS cho hệ thống điều phối giao hàng, phục vụ khoảng 80.000 đơn mỗi ngày.',
          ],
          ['TypeScript', 4, 'Ngôn ngữ: TypeScript (4 năm), JavaScript, SQL.'],
          [
            'PostgreSQL',
            3,
            'Framework: NestJS, Express. Cơ sở dữ liệu: PostgreSQL (3 năm), MongoDB.',
          ],
          [
            'Docker',
            2,
            'Đóng gói các dịch vụ bằng Docker và viết pipeline triển khai lên môi trường staging.',
          ],
          ['Jest', 2, 'Viết unit test bằng Jest, nâng độ phủ test của module thanh toán lên 75%.'],
        ],
      },
    ],
  },
  {
    key: 'hang',
    fullName: 'Trần Thị Thu Hằng',
    email: 'hangtran.dev@gmail.com',
    phone: '0386214597',
    city: 'Hà Nội',
    cvs: [
      {
        key: 'hang-1',
        fileName: 'TranThuHang_CV.docx',
        headline: 'Lập trình viên Backend',
        summary:
          'Lập trình viên backend 2 năm kinh nghiệm, chuyển từ PHP sang Node.js. Đang tìm môi trường dùng NestJS bài bản để phát triển lên Senior.',
        experiences: [
          {
            title: 'Backend Developer',
            company: 'Công ty Cổ phần Công nghệ Hoa Sen',
            from: '2025-04',
            to: null,
            lines: [
              'Hơn 1 năm làm NestJS: xây dựng module quản lý kho và đồng bộ tồn kho giữa các chi nhánh.',
              'Viết truy vấn và migration PostgreSQL cho các bảng tồn kho, phiếu nhập, phiếu xuất.',
              'Sử dụng Docker Compose để dựng môi trường phát triển cho cả nhóm 6 người.',
            ],
          },
          {
            title: 'PHP Developer',
            company: 'Công ty TNHH Giải pháp Web Minh Phát',
            from: '2024-06',
            to: '2025-03',
            lines: ['Phát triển website bán hàng bằng Laravel và MySQL cho khách hàng SME.'],
          },
        ],
        skillLines: [
          'TypeScript (2 năm), PHP, SQL.',
          'NestJS, Laravel, PostgreSQL, MySQL, Docker.',
        ],
        education: { school: PTIT, degree: 'Kỹ sư Công nghệ thông tin', year: 2024 },
        skills: [
          [
            'NestJS',
            1.5,
            'Hơn 1 năm làm NestJS: xây dựng module quản lý kho và đồng bộ tồn kho giữa các chi nhánh.',
          ],
          ['TypeScript', 2, 'TypeScript (2 năm), PHP, SQL.'],
          [
            'PostgreSQL',
            1.5,
            'Viết truy vấn và migration PostgreSQL cho các bảng tồn kho, phiếu nhập, phiếu xuất.',
          ],
          [
            'Docker',
            1,
            'Sử dụng Docker Compose để dựng môi trường phát triển cho cả nhóm 6 người.',
          ],
          ['Laravel', 1, 'Phát triển website bán hàng bằng Laravel và MySQL cho khách hàng SME.'],
        ],
      },
    ],
  },
  {
    key: 'huy',
    fullName: 'Phạm Quang Huy',
    email: 'huy.pq.java@gmail.com',
    phone: '0903771245',
    city: 'Hồ Chí Minh',
    cvs: [
      {
        key: 'huy-1',
        fileName: 'PhamQuangHuy-Senior-Java.docx',
        headline: 'Senior Java Developer – Thanh toán & Ngân hàng',
        summary:
          '6 năm làm việc với Java trong lĩnh vực ngân hàng và ví điện tử. Thế mạnh là thiết kế microservice, xử lý giao dịch đồng thời và hướng dẫn thành viên mới.',
        experiences: [
          {
            title: 'Senior Java Developer',
            company: 'Công ty Cổ phần Ví điện tử An Phú',
            from: '2022-01',
            to: null,
            lines: [
              '5 năm phát triển hệ thống bằng Java, hiện phụ trách module đối soát giao dịch với 4 ngân hàng đối tác.',
              '4 năm dùng Spring Boot xây dựng các dịch vụ thanh toán, xử lý trung bình 1,2 triệu giao dịch mỗi ngày.',
              'Tách hệ thống monolith thành 9 microservices, giảm thời gian phát hành từ 2 tuần xuống 3 ngày.',
              'Dùng Kafka cho luồng sự kiện giao dịch và thông báo biến động số dư.',
            ],
          },
          {
            title: 'Java Developer',
            company: 'Công ty TNHH Phần mềm Ngân hàng Việt Tín',
            from: '2020-03',
            to: '2021-12',
            lines: ['Bảo trì core banking viết bằng Java và Oracle cho 2 ngân hàng thương mại.'],
          },
        ],
        skillLines: [
          'Java 17/21, Spring Boot, Spring Cloud, Hibernate.',
          'PostgreSQL (5 năm), Oracle, Redis, Kafka.',
        ],
        education: { school: HCMUT, degree: 'Kỹ sư Khoa học máy tính', year: 2019 },
        skills: [
          [
            'Java',
            5,
            '5 năm phát triển hệ thống bằng Java, hiện phụ trách module đối soát giao dịch với 4 ngân hàng đối tác.',
          ],
          [
            'Spring Boot',
            4,
            '4 năm dùng Spring Boot xây dựng các dịch vụ thanh toán, xử lý trung bình 1,2 triệu giao dịch mỗi ngày.',
          ],
          [
            'Microservices',
            3,
            'Tách hệ thống monolith thành 9 microservices, giảm thời gian phát hành từ 2 tuần xuống 3 ngày.',
          ],
          ['Kafka', 2, 'Dùng Kafka cho luồng sự kiện giao dịch và thông báo biến động số dư.'],
          ['PostgreSQL', 5, 'PostgreSQL (5 năm), Oracle, Redis, Kafka.'],
        ],
      },
    ],
  },
  {
    key: 'khoi',
    fullName: 'Đỗ Minh Khôi',
    email: 'khoi.dominh@outlook.com',
    phone: '0977302158',
    city: 'Hà Nội',
    cvs: [
      {
        key: 'khoi-1',
        fileName: 'CV-Do-Minh-Khoi.docx',
        headline: 'Fullstack Developer (NestJS, React)',
        summary:
          'Fullstack developer 3 năm kinh nghiệm, quen làm việc trong đội nhỏ và chủ động từ thiết kế API đến triển khai.',
        experiences: [
          {
            title: 'Fullstack Developer',
            company: 'Công ty Cổ phần Công nghệ Giáo dục Bình Minh',
            from: '2023-08',
            to: null,
            lines: [
              '2 năm phát triển API bằng NestJS cho nền tảng học trực tuyến khoảng 30.000 học viên.',
              'Dùng Redis để lưu phiên làm bài thi và bảng xếp hạng theo thời gian thực.',
              'Xây dựng trang quản trị bằng React và TypeScript.',
            ],
          },
        ],
        skillLines: ['TypeScript, NestJS, React, PostgreSQL, Redis, Docker.'],
        education: { school: UET, degree: 'Cử nhân Công nghệ thông tin', year: 2023 },
        skills: [],
      },
    ],
  },
  {
    key: 'thang',
    fullName: 'Lê Văn Thắng',
    email: 'thang.levan93@gmail.com',
    phone: '0935810266',
    city: 'Hồ Chí Minh',
    cvs: [
      {
        key: 'thang-1',
        fileName: 'LeVanThang_JavaDeveloper.docx',
        headline: 'Java Developer',
        summary:
          'Java developer 3 năm kinh nghiệm trong mảng bảo hiểm và bán lẻ. Mong muốn làm sản phẩm có tải lớn và học thêm về hệ thống phân tán.',
        experiences: [
          {
            title: 'Java Developer',
            company: 'Công ty Cổ phần Bảo hiểm số Hưng Thịnh',
            from: '2023-09',
            to: null,
            lines: [
              '3 năm lập trình Java, phát triển hệ thống quản lý hợp đồng bảo hiểm trực tuyến.',
              'Xây dựng các dịch vụ bằng Spring Boot trong 3 năm, tích hợp cổng thanh toán và chữ ký số.',
              'Tham gia chuyển đổi hệ thống sang kiến trúc microservices cùng đội 8 người.',
            ],
          },
        ],
        skillLines: ['Java, Spring Boot, MySQL, RabbitMQ, Docker.'],
        education: { school: HCMUS, degree: 'Cử nhân Công nghệ thông tin', year: 2023 },
        skills: [
          [
            'Java',
            3,
            '3 năm lập trình Java, phát triển hệ thống quản lý hợp đồng bảo hiểm trực tuyến.',
          ],
          [
            'Spring Boot',
            3,
            'Xây dựng các dịch vụ bằng Spring Boot trong 3 năm, tích hợp cổng thanh toán và chữ ký số.',
          ],
          [
            'Microservices',
            1,
            'Tham gia chuyển đổi hệ thống sang kiến trúc microservices cùng đội 8 người.',
          ],
        ],
        hallucinated: [
          ['Kafka', 2, 'Thiết kế luồng xử lý sự kiện bằng Kafka cho hệ thống bồi thường bảo hiểm.'],
        ],
      },
    ],
  },
  {
    key: 'ngocanh',
    fullName: 'Vũ Thị Ngọc Anh',
    email: 'ngocanh.vu.fe@gmail.com',
    phone: '0868123904',
    city: 'Hà Nội',
    cvs: [
      {
        key: 'ngocanh-1',
        fileName: 'VuThiNgocAnh_Frontend.docx',
        headline: 'Frontend Developer – React, TypeScript',
        summary:
          'Frontend developer 4 năm kinh nghiệm, yêu thích xây dựng giao diện dễ dùng và thư viện component dùng chung.',
        experiences: [
          {
            title: 'Frontend Developer',
            company: 'Công ty Cổ phần Thương mại điện tử Chợ Xanh',
            from: '2022-05',
            to: null,
            lines: [
              '3 năm phát triển giao diện bằng React cho trang bán hàng và trang quản trị người bán.',
              'Chuyển toàn bộ dự án sang TypeScript, giảm khoảng 40% lỗi phát sinh ở môi trường production.',
              'Viết test cho component bằng Vitest và Testing Library, độ phủ đạt 70%.',
            ],
          },
          {
            title: 'Web Developer',
            company: 'Công ty TNHH Truyền thông Ánh Dương',
            from: '2021-03',
            to: '2022-04',
            lines: [
              'Cắt giao diện landing page bằng HTML, SCSS và jQuery cho các chiến dịch quảng cáo.',
            ],
          },
        ],
        skillLines: ['React, Next.js, TypeScript (3 năm), Redux Toolkit, TanStack Query.'],
        education: { school: NEU, degree: 'Cử nhân Hệ thống thông tin quản lý', year: 2020 },
        skills: [
          [
            'React',
            3,
            '3 năm phát triển giao diện bằng React cho trang bán hàng và trang quản trị người bán.',
          ],
          ['TypeScript', 3, 'React, Next.js, TypeScript (3 năm), Redux Toolkit, TanStack Query.'],
          ['Vitest', 2, 'Viết test cho component bằng Vitest và Testing Library, độ phủ đạt 70%.'],
        ],
      },
    ],
  },
  {
    key: 'manh',
    fullName: 'Bùi Đức Mạnh',
    email: 'manhbui.dev@gmail.com',
    phone: '0329547180',
    city: 'Bắc Ninh',
    cvs: [
      {
        key: 'manh-1',
        fileName: 'BuiDucManh_CV_Frontend.docx',
        headline: 'Junior Frontend Developer',
        summary:
          'Junior frontend developer, đã có 1 năm làm React ở công ty outsource. Muốn được làm sản phẩm lâu dài và học hỏi từ đội ngũ có kinh nghiệm.',
        experiences: [
          {
            title: 'Frontend Developer',
            company: 'Công ty TNHH Phần mềm Kinh Bắc',
            from: '2025-09',
            to: null,
            lines: [
              '1 năm phát triển các màn hình quản lý bằng React cho khách hàng Nhật Bản.',
              'Dùng TypeScript trong toàn bộ dự án, đọc hiểu tài liệu đặc tả tiếng Nhật cơ bản.',
              'Viết unit test bằng Jest cho các hàm xử lý dữ liệu.',
            ],
          },
        ],
        skillLines: ['React, TypeScript, Ant Design, Git.'],
        education: { school: PTIT, degree: 'Kỹ sư Công nghệ thông tin', year: 2025 },
        skills: [
          ['React', 1, '1 năm phát triển các màn hình quản lý bằng React cho khách hàng Nhật Bản.'],
          [
            'TypeScript',
            1,
            'Dùng TypeScript trong toàn bộ dự án, đọc hiểu tài liệu đặc tả tiếng Nhật cơ bản.',
          ],
          ['Jest', 1, 'Viết unit test bằng Jest cho các hàm xử lý dữ liệu.'],
        ],
      },
    ],
  },
  {
    key: 'tung',
    fullName: 'Ngô Thanh Tùng',
    email: 'tung.ngothanh@gmail.com',
    phone: '0914336820',
    city: 'Đà Nẵng',
    cvs: [
      {
        key: 'tung-1',
        fileName: 'NgoThanhTung_CV.docx',
        headline: 'Frontend & Mobile Developer',
        summary:
          'Lập trình viên 2 năm kinh nghiệm làm cả web và mobile. Muốn tập trung phát triển sâu một mảng.',
        experiences: [
          {
            title: 'Frontend Developer',
            company: 'Công ty Cổ phần Du lịch số Sơn Trà',
            from: '2024-10',
            to: null,
            lines: [
              'Hơn 1 năm phát triển trang đặt tour bằng React và TypeScript.',
              'Làm thêm ứng dụng đặt phòng bằng Flutter khoảng 1 năm rưỡi.',
            ],
          },
        ],
        skillLines: ['React, TypeScript (1 năm), Flutter, Dart, HTML/CSS.'],
        education: { school: DUT, degree: 'Kỹ sư Công nghệ thông tin', year: 2024 },
        skills: [
          ['React', 1.5, 'Hơn 1 năm phát triển trang đặt tour bằng React và TypeScript.'],
          ['TypeScript', 1, 'React, TypeScript (1 năm), Flutter, Dart, HTML/CSS.'],
          ['Flutter', 1.5, 'Làm thêm ứng dụng đặt phòng bằng Flutter khoảng 1 năm rưỡi.'],
        ],
      },
      {
        key: 'tung-2',
        fileName: 'NgoThanhTung_CV_Mobile.docx',
        headline: 'Mobile Developer (Flutter)',
        summary:
          'Mobile developer tập trung vào Flutter, từng phát hành ứng dụng đặt phòng lên cả App Store và Google Play.',
        experiences: [
          {
            title: 'Mobile Developer',
            company: 'Công ty Cổ phần Du lịch số Sơn Trà',
            from: '2024-10',
            to: null,
            lines: [
              'Phát triển ứng dụng đặt phòng bằng Flutter khoảng 1 năm rưỡi, đạt 4,6 sao trên Google Play.',
              'Viết logic xử lý đặt phòng và thanh toán bằng Dart, áp dụng kiến trúc BLoC.',
              'Tích hợp Firebase Cloud Messaging cho thông báo đẩy và Crashlytics để theo dõi lỗi.',
              'Thiết lập Codemagic tự động build và phát hành bản thử nghiệm mỗi tuần.',
            ],
          },
        ],
        skillLines: ['Flutter, Dart, BLoC, Firebase, Codemagic, React.'],
        education: { school: DUT, degree: 'Kỹ sư Công nghệ thông tin', year: 2024 },
        skills: [
          [
            'Flutter',
            1.5,
            'Phát triển ứng dụng đặt phòng bằng Flutter khoảng 1 năm rưỡi, đạt 4,6 sao trên Google Play.',
          ],
          [
            'Dart',
            1.5,
            'Viết logic xử lý đặt phòng và thanh toán bằng Dart, áp dụng kiến trúc BLoC.',
          ],
          [
            'Firebase',
            1,
            'Tích hợp Firebase Cloud Messaging cho thông báo đẩy và Crashlytics để theo dõi lỗi.',
          ],
          [
            'Codemagic',
            1,
            'Thiết lập Codemagic tự động build và phát hành bản thử nghiệm mỗi tuần.',
          ],
        ],
      },
    ],
  },
  {
    key: 'kimngan',
    fullName: 'Hồ Thị Kim Ngân',
    email: 'kimngan.ho.mobile@gmail.com',
    phone: '0905642713',
    city: 'Đà Nẵng',
    cvs: [
      {
        key: 'kimngan-1',
        fileName: 'HoThiKimNgan_MobileDeveloper.docx',
        headline: 'Mobile Developer – Flutter',
        summary:
          'Mobile developer 4 năm kinh nghiệm, trong đó 3 năm với Flutter. Đã phát hành 5 ứng dụng với tổng hơn 1 triệu lượt tải.',
        experiences: [
          {
            title: 'Senior Mobile Developer',
            company: 'Công ty Cổ phần Fintech Hải Vân',
            from: '2023-02',
            to: null,
            lines: [
              '3 năm phát triển ứng dụng ví điện tử bằng Flutter, hơn 600.000 người dùng.',
              'Viết các package dùng chung bằng Dart cho 3 ứng dụng của công ty.',
              'Dùng Firebase cho Remote Config, Analytics và thông báo đẩy.',
              'Tự động hoá phát hành bằng Fastlane, rút thời gian phát hành từ nửa ngày xuống 20 phút.',
            ],
          },
          {
            title: 'Android Developer',
            company: 'Công ty TNHH Ứng dụng Di động Ngũ Hành',
            from: '2021-06',
            to: '2023-01',
            lines: ['Phát triển ứng dụng Android bằng Kotlin cho chuỗi nhà thuốc.'],
          },
        ],
        skillLines: ['Flutter, Dart (3 năm), Kotlin, Firebase, Fastlane.'],
        education: { school: DUT, degree: 'Kỹ sư Công nghệ thông tin', year: 2021 },
        skills: [
          [
            'Flutter',
            3,
            '3 năm phát triển ứng dụng ví điện tử bằng Flutter, hơn 600.000 người dùng.',
          ],
          ['Dart', 3, 'Flutter, Dart (3 năm), Kotlin, Firebase, Fastlane.'],
          ['Firebase', 3, 'Dùng Firebase cho Remote Config, Analytics và thông báo đẩy.'],
          [
            'Fastlane',
            2,
            'Tự động hoá phát hành bằng Fastlane, rút thời gian phát hành từ nửa ngày xuống 20 phút.',
          ],
          ['Kotlin', 2, 'Phát triển ứng dụng Android bằng Kotlin cho chuỗi nhà thuốc.'],
        ],
      },
    ],
  },
  {
    key: 'long',
    fullName: 'Đặng Văn Long',
    email: 'long.dang.qa@gmail.com',
    phone: '0389015642',
    city: 'Hà Nội',
    cvs: [
      {
        key: 'long-1',
        fileName: 'DangVanLong_QA_Automation.docx',
        headline: 'QA Automation Engineer',
        summary:
          'Kỹ sư kiểm thử 4 năm kinh nghiệm, 3 năm tập trung vào kiểm thử tự động cho web và API.',
        experiences: [
          {
            title: 'QA Automation Engineer',
            company: 'Công ty Cổ phần Phần mềm Thiên Long',
            from: '2023-01',
            to: null,
            lines: [
              '3 năm xây dựng bộ kiểm thử tự động bằng Playwright cho hệ thống quản lý bán hàng, khoảng 1.200 test case.',
              'Kiểm thử API bằng Postman và Newman, tích hợp vào pipeline GitLab CI.',
              'Viết truy vấn SQL để chuẩn bị dữ liệu và đối soát kết quả kiểm thử.',
            ],
          },
          {
            title: 'Manual Tester',
            company: 'Công ty TNHH Dịch vụ Phần mềm Quang Trung',
            from: '2022-01',
            to: '2022-12',
            lines: ['Viết test case và kiểm thử thủ công ứng dụng ngân hàng di động.'],
          },
        ],
        skillLines: ['Playwright, Selenium, Postman, SQL, GitLab CI.'],
        education: { school: HUST, degree: 'Kỹ sư Điện tử viễn thông', year: 2021 },
        skills: [
          [
            'Playwright',
            3,
            '3 năm xây dựng bộ kiểm thử tự động bằng Playwright cho hệ thống quản lý bán hàng, khoảng 1.200 test case.',
          ],
          ['Postman', 3, 'Kiểm thử API bằng Postman và Newman, tích hợp vào pipeline GitLab CI.'],
          ['SQL', 3, 'Viết truy vấn SQL để chuẩn bị dữ liệu và đối soát kết quả kiểm thử.'],
        ],
      },
    ],
  },
  {
    key: 'thuphuong',
    fullName: 'Lý Thu Phương',
    email: 'phuong.lythu@gmail.com',
    phone: '0971284530',
    city: 'Hà Nội',
    cvs: [
      {
        key: 'thuphuong-1',
        fileName: 'LyThuPhuong_Tester.docx',
        headline: 'Tester – đang chuyển sang Automation',
        summary:
          'Tester 3 năm kinh nghiệm kiểm thử thủ công, 1 năm gần đây tự học và áp dụng kiểm thử tự động trong dự án.',
        experiences: [
          {
            title: 'Tester',
            company: 'Công ty Cổ phần Bảo hiểm số Hưng Thịnh',
            from: '2023-04',
            to: null,
            lines: [
              '1 năm viết kịch bản kiểm thử tự động bằng Selenium WebDriver và Java.',
              'Kiểm thử API bằng Postman cho các dịch vụ thanh toán phí bảo hiểm.',
              'Dùng SQL kiểm tra dữ liệu sau mỗi đợt phát hành.',
            ],
          },
        ],
        skillLines: ['Selenium, Postman, SQL, Jira, TestRail.'],
        education: { school: NEU, degree: 'Cử nhân Hệ thống thông tin quản lý', year: 2022 },
        skills: [
          ['Selenium', 1, '1 năm viết kịch bản kiểm thử tự động bằng Selenium WebDriver và Java.'],
          ['Postman', 2, 'Kiểm thử API bằng Postman cho các dịch vụ thanh toán phí bảo hiểm.'],
          ['SQL', 3, 'Dùng SQL kiểm tra dữ liệu sau mỗi đợt phát hành.'],
        ],
      },
    ],
  },
  {
    key: 'minhduc',
    fullName: 'Trịnh Minh Đức',
    email: 'duc.trinh.ops@gmail.com',
    phone: '0398547612',
    city: 'Hải Phòng',
    cvs: [
      {
        key: 'minhduc-1',
        fileName: 'TrinhMinhDuc_DevOps.docx',
        headline: 'DevOps Engineer – Kubernetes, AWS',
        summary:
          'DevOps engineer 4 năm kinh nghiệm vận hành hệ thống thương mại điện tử, quen làm việc từ xa và trực sự cố.',
        experiences: [
          {
            title: 'DevOps Engineer',
            company: 'Công ty Cổ phần Thương mại điện tử Chợ Xanh',
            from: '2022-08',
            to: null,
            lines: [
              '2 năm vận hành 3 cụm Kubernetes với khoảng 60 dịch vụ, đảm bảo uptime 99,95%.',
              'Xây dựng pipeline CI/CD bằng GitHub Actions cho toàn bộ dịch vụ backend và frontend.',
              'Quản lý hạ tầng trên AWS gồm EKS, RDS, S3 và CloudFront.',
            ],
          },
          {
            title: 'System Administrator',
            company: 'Công ty TNHH Viễn thông Duyên Hải',
            from: '2021-01',
            to: '2022-07',
            lines: ['Quản trị máy chủ Linux và hệ thống giám sát Zabbix.'],
          },
        ],
        skillLines: ['Kubernetes, Helm, Docker, GitHub Actions, AWS, Prometheus, Grafana.'],
        education: { school: HUST, degree: 'Kỹ sư Kỹ thuật máy tính', year: 2020 },
        skills: [
          [
            'Kubernetes',
            2,
            '2 năm vận hành 3 cụm Kubernetes với khoảng 60 dịch vụ, đảm bảo uptime 99,95%.',
          ],
          [
            'GitHub Actions',
            3,
            'Xây dựng pipeline CI/CD bằng GitHub Actions cho toàn bộ dịch vụ backend và frontend.',
          ],
          ['AWS', 2, 'Quản lý hạ tầng trên AWS gồm EKS, RDS, S3 và CloudFront.'],
        ],
      },
    ],
  },
  {
    key: 'anhtuan',
    fullName: 'Mai Anh Tuấn',
    email: 'anhtuan.mai88@gmail.com',
    phone: '0915203364',
    city: 'Hà Nội',
    cvs: [
      {
        key: 'anhtuan-1',
        fileName: 'MaiAnhTuan_CV_scan.pdf',
        headline: '',
        summary: '',
        experiences: [],
        skillLines: [],
        education: { school: '', degree: '', year: 2012 },
        skills: [],
        scanned: true,
      },
    ],
  },
  {
    key: 'lanhuong',
    fullName: 'Phan Thị Lan Hương',
    email: 'lanhuong.phan.data@gmail.com',
    phone: '0943578120',
    city: 'Hà Nội',
    cvs: [
      {
        key: 'lanhuong-1',
        fileName: 'PhanThiLanHuong_DataEngineer.docx',
        headline: 'Data Engineer',
        summary:
          'Data engineer 3 năm kinh nghiệm xây dựng pipeline dữ liệu cho ngân hàng và bán lẻ.',
        experiences: [
          {
            title: 'Data Engineer',
            company: 'Công ty Cổ phần Phân tích Dữ liệu Tràng An',
            from: '2023-06',
            to: null,
            lines: [
              '3 năm phát triển pipeline ETL bằng Python, xử lý khoảng 50 triệu bản ghi giao dịch mỗi ngày.',
              'Tối ưu truy vấn SQL trên kho dữ liệu, giảm chi phí tính toán khoảng 30%.',
              'Chuyển các job xử lý theo lô sang Spark, rút thời gian chạy từ 4 giờ xuống 35 phút.',
            ],
          },
        ],
        skillLines: ['Python, SQL, PySpark, dbt, Google BigQuery.'],
        education: { school: HUST, degree: 'Kỹ sư Toán tin', year: 2022 },
        skills: [
          [
            'Python',
            3,
            '3 năm phát triển pipeline ETL bằng Python, xử lý khoảng 50 triệu bản ghi giao dịch mỗi ngày.',
          ],
          ['SQL', 3, 'Tối ưu truy vấn SQL trên kho dữ liệu, giảm chi phí tính toán khoảng 30%.'],
          [
            'Spark',
            2,
            'Chuyển các job xử lý theo lô sang Spark, rút thời gian chạy từ 4 giờ xuống 35 phút.',
          ],
        ],
      },
    ],
  },
  {
    key: 'minhquan',
    fullName: 'Tô Minh Quân',
    email: 'quan.tominh@gmail.com',
    phone: '0367812094',
    city: 'Hà Nội',
    cvs: [
      {
        key: 'minhquan-1',
        fileName: 'ToMinhQuan_CV.docx',
        headline: 'Sinh viên mới tốt nghiệp – Phân tích dữ liệu',
        summary:
          'Mới tốt nghiệp chuyên ngành Thống kê, có 6 tháng thực tập phân tích dữ liệu. Mong muốn bắt đầu sự nghiệp ở vị trí Data Analyst.',
        experiences: [
          {
            title: 'Thực tập sinh Phân tích dữ liệu',
            company: 'Công ty Cổ phần Bán lẻ Phố Hiến',
            from: '2025-12',
            to: '2026-06',
            lines: [
              'Viết truy vấn SQL trích xuất số liệu bán hàng theo tuần trong 6 tháng thực tập.',
              'Làm báo cáo doanh thu theo cửa hàng bằng Excel và Google Sheets.',
            ],
          },
        ],
        skillLines: ['SQL, Excel, Python cơ bản.'],
        education: { school: NEU, degree: 'Cử nhân Thống kê kinh tế', year: 2026 },
        skills: [
          [
            'SQL',
            0.5,
            'Viết truy vấn SQL trích xuất số liệu bán hàng theo tuần trong 6 tháng thực tập.',
          ],
          ['Excel', 0.5, 'Làm báo cáo doanh thu theo cửa hàng bằng Excel và Google Sheets.'],
        ],
      },
      {
        key: 'minhquan-2',
        fileName: 'ToMinhQuan_CV_2026.docx',
        headline: 'Data Analyst / Junior Data Engineer',
        summary: '1 năm làm việc với dữ liệu bán lẻ, đang chuyển hướng sang Data Engineer.',
        experiences: [
          {
            title: 'Data Analyst',
            company: 'Công ty TNHH Siêu thị Mini Hồng Hà',
            from: '2025-10',
            to: null,
            lines: [
              'Khoảng 1 năm dùng SQL để làm báo cáo tồn kho cho 25 cửa hàng.',
              'Viết script Python tự động tổng hợp số liệu bán hàng hằng ngày.',
            ],
          },
        ],
        skillLines: ['SQL, Python, Excel, Looker Studio.'],
        education: { school: NEU, degree: 'Cử nhân Thống kê kinh tế', year: 2026 },
        skills: [
          ['SQL', 1, 'Khoảng 1 năm dùng SQL để làm báo cáo tồn kho cho 25 cửa hàng.'],
          ['Python', 1, 'Viết script Python tự động tổng hợp số liệu bán hàng hằng ngày.'],
        ],
      },
    ],
  },
  {
    key: 'myduyen',
    fullName: 'Lương Thị Mỹ Duyên',
    email: 'myduyen.luong@gmail.com',
    phone: '0827461935',
    city: 'Hà Nội',
    cvs: [
      {
        key: 'myduyen-1',
        fileName: 'LuongThiMyDuyen_DataAnalyst.docx',
        headline: 'Data Analyst',
        summary:
          'Data analyst 2 năm kinh nghiệm trong ngành bán lẻ và chuỗi cung ứng, thích biến số liệu thành đề xuất hành động cụ thể.',
        experiences: [
          {
            title: 'Data Analyst',
            company: 'Công ty Cổ phần Chuỗi Cung ứng Đông Á',
            from: '2024-06',
            to: null,
            lines: [
              '2 năm phân tích dữ liệu tồn kho và vận chuyển bằng SQL trên PostgreSQL.',
              'Xây dựng 12 dashboard trên Power BI cho ban giám đốc và các trưởng kho.',
            ],
          },
        ],
        skillLines: ['SQL, Power BI, Python (pandas), Google Sheets.'],
        education: { school: FTU, degree: 'Cử nhân Kinh tế đối ngoại', year: 2024 },
        skills: [
          ['SQL', 2, '2 năm phân tích dữ liệu tồn kho và vận chuyển bằng SQL trên PostgreSQL.'],
          [
            'Power BI',
            2,
            'Xây dựng 12 dashboard trên Power BI cho ban giám đốc và các trưởng kho.',
          ],
        ],
      },
    ],
  },
  {
    key: 'giabao',
    fullName: 'Đinh Gia Bảo',
    email: 'giabao.dinh.po@gmail.com',
    phone: '0918320476',
    city: 'Hà Nội',
    cvs: [
      {
        key: 'giabao-1',
        fileName: 'DinhGiaBao_ProductOwner.docx',
        headline: 'Product Owner – Loyalty & Ví điện tử',
        summary:
          'Product Owner 3 năm kinh nghiệm với sản phẩm khách hàng thân thiết và ví điện tử, xuất phát điểm là Business Analyst.',
        experiences: [
          {
            title: 'Product Owner',
            company: 'Công ty Cổ phần Fintech Hải Vân',
            from: '2023-07',
            to: null,
            lines: [
              '3 năm làm Product Owner trong đội Scrum 8 người, quản lý backlog cho tính năng tích điểm và đổi quà.',
              'Viết user story và tiêu chí nghiệm thu, phân tích nghiệp vụ cùng đội vận hành và đối tác.',
              'Tự viết SQL để theo dõi tỉ lệ đổi điểm và đề xuất thay đổi chính sách thưởng.',
            ],
          },
        ],
        skillLines: ['Scrum, Jira, Confluence, SQL, Google Analytics.'],
        education: { school: FTU, degree: 'Cử nhân Quản trị kinh doanh', year: 2021 },
        skills: [
          [
            'Product Owner',
            3,
            '3 năm làm Product Owner trong đội Scrum 8 người, quản lý backlog cho tính năng tích điểm và đổi quà.',
          ],
          [
            'User story',
            3,
            'Viết user story và tiêu chí nghiệm thu, phân tích nghiệp vụ cùng đội vận hành và đối tác.',
          ],
          [
            'SQL',
            2,
            'Tự viết SQL để theo dõi tỉ lệ đổi điểm và đề xuất thay đổi chính sách thưởng.',
          ],
        ],
      },
    ],
  },
  {
    key: 'thanhtam',
    fullName: 'Nguyễn Thị Thanh Tâm',
    email: 'thanhtam.sales@gmail.com',
    phone: '0904218655',
    city: 'Hà Nội',
    cvs: [
      {
        key: 'thanhtam-1',
        fileName: 'NguyenThiThanhTam_Sales.docx',
        headline: 'Chuyên viên kinh doanh phần mềm doanh nghiệp',
        summary:
          '5 năm bán giải pháp phần mềm cho doanh nghiệp, từng đạt top 3 doanh số toàn công ty năm 2025.',
        experiences: [
          {
            title: 'Senior Sales Executive',
            company: 'Công ty Cổ phần Giải pháp Doanh nghiệp Thăng Long',
            from: '2021-09',
            to: null,
            lines: [
              '4 năm bán hàng B2B giải pháp ERP và phần mềm quản lý kho cho doanh nghiệp vừa và lớn.',
              'Quản lý khách hàng doanh nghiệp với 35 tài khoản, tỉ lệ gia hạn hợp đồng đạt 92%.',
              'Đàm phán hợp đồng giá trị đến 3 tỷ đồng, phối hợp đội triển khai và pháp chế.',
              'Cập nhật toàn bộ cơ hội bán hàng trên Salesforce.',
            ],
          },
        ],
        skillLines: ['Tiếng Anh: TOEIC 785.', 'Salesforce, HubSpot, Microsoft Excel.'],
        education: { school: FTU, degree: 'Cử nhân Kinh tế quốc tế', year: 2020 },
        skills: [
          [
            'Bán hàng B2B',
            4,
            '4 năm bán hàng B2B giải pháp ERP và phần mềm quản lý kho cho doanh nghiệp vừa và lớn.',
          ],
          [
            'Quản lý khách hàng doanh nghiệp',
            4,
            'Quản lý khách hàng doanh nghiệp với 35 tài khoản, tỉ lệ gia hạn hợp đồng đạt 92%.',
          ],
          [
            'Đàm phán hợp đồng',
            4,
            'Đàm phán hợp đồng giá trị đến 3 tỷ đồng, phối hợp đội triển khai và pháp chế.',
          ],
          ['Salesforce', 3, 'Cập nhật toàn bộ cơ hội bán hàng trên Salesforce.'],
          ['Tiếng Anh (TOEIC 785)', null, 'Tiếng Anh: TOEIC 785.'],
        ],
      },
    ],
  },
  {
    key: 'ngochan',
    fullName: 'Trương Ngọc Hân',
    email: 'ngochan.truong@gmail.com',
    phone: '0938164270',
    city: 'Hồ Chí Minh',
    cvs: [
      {
        key: 'ngochan-1',
        fileName: 'TruongNgocHan_AccountManager.docx',
        headline: 'Key Account Manager',
        summary:
          '6 năm quản lý khách hàng chuỗi bán lẻ và F&B, mạnh về xây dựng quan hệ lâu dài và bán thêm dịch vụ.',
        experiences: [
          {
            title: 'Key Account Manager',
            company: 'Công ty Cổ phần Công nghệ Bán lẻ Nam Việt',
            from: '2021-04',
            to: null,
            lines: [
              '5 năm làm key account cho 12 chuỗi bán lẻ và F&B, doanh thu quản lý khoảng 40 tỷ đồng mỗi năm.',
              'Đàm phán gia hạn và bán thêm dịch vụ, tăng doanh thu từ khách hàng cũ 25% trong năm 2025.',
            ],
          },
          {
            title: 'Sales Executive',
            company: 'Công ty TNHH Thiết bị Văn phòng Sài Gòn',
            from: '2019-08',
            to: '2021-03',
            lines: ['Tư vấn và bán thiết bị văn phòng cho doanh nghiệp tại TP.HCM.'],
          },
        ],
        skillLines: ['Quản lý quan hệ khách hàng, đàm phán, thuyết trình, HubSpot.'],
        education: { school: UEH, degree: 'Cử nhân Marketing', year: 2019 },
        skills: [
          [
            'Key account',
            5,
            '5 năm làm key account cho 12 chuỗi bán lẻ và F&B, doanh thu quản lý khoảng 40 tỷ đồng mỗi năm.',
          ],
          [
            'Đàm phán',
            5,
            'Đàm phán gia hạn và bán thêm dịch vụ, tăng doanh thu từ khách hàng cũ 25% trong năm 2025.',
          ],
        ],
      },
    ],
  },
  {
    key: 'bichngoc',
    fullName: 'Lê Thị Bích Ngọc',
    email: 'bichngoc.le.cs@gmail.com',
    phone: '0796213458',
    city: 'Đà Nẵng',
    cvs: [
      {
        key: 'bichngoc-1',
        fileName: 'LeThiBichNgoc_CSKH.docx',
        headline: 'Chuyên viên Chăm sóc khách hàng',
        summary:
          '2 năm hỗ trợ khách hàng cho phần mềm và ví điện tử, kiên nhẫn và giải thích dễ hiểu cho người dùng không rành công nghệ.',
        experiences: [
          {
            title: 'Chuyên viên chăm sóc khách hàng',
            company: 'Công ty Cổ phần Fintech Hải Vân',
            from: '2024-09',
            to: null,
            lines: [
              '2 năm chăm sóc khách hàng qua hotline, chat và email, xử lý trung bình 60 yêu cầu mỗi ngày.',
              'Soạn bộ câu trả lời mẫu, giảm 20% thời gian xử lý trung bình của cả nhóm.',
            ],
          },
        ],
        skillLines: ['Tiếng Anh giao tiếp (IELTS 6.0).', 'Freshchat, Google Workspace.'],
        education: {
          school: 'Trường Đại học Ngoại ngữ – Đại học Đà Nẵng',
          degree: 'Cử nhân Ngôn ngữ Anh',
          year: 2024,
        },
        skills: [
          [
            'Chăm sóc khách hàng',
            2,
            '2 năm chăm sóc khách hàng qua hotline, chat và email, xử lý trung bình 60 yêu cầu mỗi ngày.',
          ],
          ['Tiếng Anh (IELTS 6.0)', null, 'Tiếng Anh giao tiếp (IELTS 6.0).'],
        ],
      },
    ],
  },
  {
    key: 'vanhieu',
    fullName: 'Kiều Văn Hiếu',
    email: 'hieukieu1999@gmail.com',
    phone: '0352904817',
    city: 'Quảng Nam',
    cvs: [
      {
        key: 'vanhieu-1',
        fileName: 'KieuVanHieu_CV.docx',
        headline: 'Nhân viên tư vấn – Chăm sóc khách hàng',
        summary:
          'Hơn 1 năm làm tổng đài viên cho nhà mạng, mong muốn chuyển sang hỗ trợ khách hàng doanh nghiệp.',
        experiences: [
          {
            title: 'Tổng đài viên',
            company: 'Trung tâm Chăm sóc khách hàng Viễn thông Miền Trung',
            from: '2025-05',
            to: null,
            lines: [
              'Hơn 1 năm chăm sóc khách hàng qua tổng đài, tiếp nhận khoảng 80 cuộc gọi mỗi ca.',
              'Đạt danh hiệu nhân viên xuất sắc quý 2/2026.',
            ],
          },
        ],
        skillLines: ['Giao tiếp, xử lý khiếu nại, tin học văn phòng.'],
        education: {
          school: 'Trường Đại học Kinh tế – Đại học Đà Nẵng',
          degree: 'Cử nhân Quản trị kinh doanh',
          year: 2023,
        },
        skills: [],
      },
    ],
  },
  {
    key: 'hongnhung',
    fullName: 'Đoàn Thị Hồng Nhung',
    email: 'hongnhung.doan.mkt@gmail.com',
    phone: '0984731206',
    city: 'Hà Nội',
    cvs: [
      {
        key: 'hongnhung-1',
        fileName: 'DoanThiHongNhung_PerformanceMarketing.docx',
        headline: 'Performance Marketing Executive',
        summary:
          '2 năm chạy quảng cáo cho thương hiệu mỹ phẩm và ứng dụng, quen tối ưu theo chi phí mỗi lượt cài đặt và mỗi đơn hàng.',
        experiences: [
          {
            title: 'Performance Marketing Executive',
            company: 'Công ty Cổ phần Mỹ phẩm Hoa Ban',
            from: '2024-08',
            to: null,
            lines: [
              '2 năm chạy Facebook Ads với ngân sách khoảng 600 triệu đồng mỗi tháng, giảm chi phí mỗi đơn 18%.',
              'Triển khai chiến dịch Google Ads tìm kiếm và Performance Max cho website bán hàng.',
            ],
          },
        ],
        skillLines: ['Facebook Ads, Google Ads, TikTok Ads, Excel.'],
        education: {
          school: 'Học viện Báo chí và Tuyên truyền',
          degree: 'Cử nhân Quan hệ công chúng',
          year: 2024,
        },
        skills: [
          [
            'Facebook Ads',
            2,
            '2 năm chạy Facebook Ads với ngân sách khoảng 600 triệu đồng mỗi tháng, giảm chi phí mỗi đơn 18%.',
          ],
          [
            'Google Ads',
            1,
            'Triển khai chiến dịch Google Ads tìm kiếm và Performance Max cho website bán hàng.',
          ],
        ],
      },
    ],
  },
  {
    key: 'anon',
    fullName: 'Hoàng Văn Kiên',
    email: 'kien.hoangvan@gmail.com',
    phone: '0961425378',
    city: 'Hà Nội',
    cvs: [
      {
        key: 'anon-1',
        fileName: 'HoangVanKien_Marketing.docx',
        headline: 'Marketing Executive',
        summary: 'Nhân viên marketing 1 năm kinh nghiệm quản lý fanpage.',
        experiences: [
          {
            title: 'Marketing Executive',
            company: 'Công ty TNHH Thời trang Gió Mới',
            from: '2025-07',
            to: null,
            lines: ['Quản lý fanpage và chạy quảng cáo Google Ads cho các đợt giảm giá.'],
          },
        ],
        skillLines: ['Canva, Google Ads, quản lý fanpage.'],
        education: { school: 'Trường Đại học Thương mại', degree: 'Cử nhân Marketing', year: 2025 },
        skills: [
          ['Google Ads', 1, 'Quản lý fanpage và chạy quảng cáo Google Ads cho các đợt giảm giá.'],
        ],
      },
    ],
  },
  {
    key: 'thuylinh',
    fullName: 'Phạm Thùy Linh',
    email: 'thuylinh.pham.writer@gmail.com',
    phone: '0889246031',
    city: 'Hà Nội',
    cvs: [
      {
        key: 'thuylinh-1',
        fileName: 'PhamThuyLinh_ContentMarketing.docx',
        headline: 'Content Marketing Executive',
        summary:
          '3 năm viết nội dung cho các thương hiệu công nghệ và bán lẻ, có kinh nghiệm xây dựng blog từ con số 0.',
        experiences: [
          {
            title: 'Content Marketing Executive',
            company: 'Công ty Cổ phần Truyền thông Mây Xanh',
            from: '2023-05',
            to: null,
            lines: [
              '3 năm viết content marketing cho blog, fanpage và email, trung bình 20 bài mỗi tháng.',
              'Tối ưu SEO cho blog công ty, tăng lượt truy cập tự nhiên từ 8.000 lên 65.000 mỗi tháng.',
            ],
          },
        ],
        skillLines: ['Content marketing, SEO, WordPress, Google Search Console.'],
        education: {
          school: 'Trường Đại học Khoa học Xã hội và Nhân văn – ĐHQG Hà Nội',
          degree: 'Cử nhân Báo chí',
          year: 2022,
        },
        skills: [
          [
            'Content marketing',
            3,
            '3 năm viết content marketing cho blog, fanpage và email, trung bình 20 bài mỗi tháng.',
          ],
          [
            'SEO',
            2,
            'Tối ưu SEO cho blog công ty, tăng lượt truy cập tự nhiên từ 8.000 lên 65.000 mỗi tháng.',
          ],
        ],
      },
    ],
  },
  {
    key: 'thaovy',
    fullName: 'Nguyễn Thảo Vy',
    email: 'thaovy.nguyen.hr@gmail.com',
    phone: '0945180372',
    city: 'Hà Nội',
    cvs: [
      {
        key: 'thaovy-1',
        fileName: 'NguyenThaoVy_Recruiter.docx',
        headline: 'Chuyên viên Tuyển dụng',
        summary:
          '2 năm tuyển dụng tại công ty outsource phần mềm, quen phỏng vấn sơ bộ ứng viên IT.',
        experiences: [
          {
            title: 'Chuyên viên tuyển dụng',
            company: 'Công ty Cổ phần Phần mềm Thiên Long',
            from: '2024-08',
            to: null,
            lines: [
              '2 năm tuyển dụng IT cho các vị trí lập trình viên, tester và BA, trung bình 6 vị trí mỗi tháng.',
              'Tổ chức ngày hội tuyển dụng tại 3 trường đại học kỹ thuật.',
            ],
          },
        ],
        skillLines: ['Phỏng vấn, đánh giá năng lực, Excel, Google Workspace.'],
        education: {
          school: 'Trường Đại học Lao động – Xã hội',
          degree: 'Cử nhân Quản trị nhân lực',
          year: 2024,
        },
        skills: [
          [
            'Tuyển dụng IT',
            2,
            '2 năm tuyển dụng IT cho các vị trí lập trình viên, tester và BA, trung bình 6 vị trí mỗi tháng.',
          ],
        ],
      },
    ],
  },
  {
    key: 'thu',
    fullName: 'Vương Thị Thu',
    email: 'vuongthu.ketoan@gmail.com',
    phone: '0912706584',
    city: 'Hà Nội',
    cvs: [
      {
        key: 'thu-1',
        fileName: 'VuongThiThu_KeToanTongHop.docx',
        headline: 'Kế toán tổng hợp',
        summary:
          '6 năm kinh nghiệm kế toán, 5 năm ở vị trí kế toán tổng hợp tại doanh nghiệp thương mại và dịch vụ.',
        experiences: [
          {
            title: 'Kế toán tổng hợp',
            company: 'Công ty Cổ phần Thương mại Dịch vụ Hồng Lĩnh',
            from: '2021-03',
            to: null,
            lines: [
              '5 năm làm kế toán tổng hợp, lập báo cáo tài chính và quyết toán thuế cho công ty khoảng 250 nhân sự.',
              'Sử dụng phần mềm MISA SME hằng ngày, phối hợp kiểm toán độc lập mỗi năm.',
            ],
          },
          {
            title: 'Kế toán viên',
            company: 'Công ty TNHH Vận tải Bắc Hà',
            from: '2020-01',
            to: '2021-02',
            lines: ['Hạch toán chứng từ, theo dõi công nợ phải thu và phải trả.'],
          },
        ],
        skillLines: ['MISA, Excel nâng cao, nghiệp vụ thuế.'],
        education: { school: AOF, degree: 'Cử nhân Kế toán', year: 2019 },
        skills: [
          [
            'Kế toán tổng hợp',
            5,
            '5 năm làm kế toán tổng hợp, lập báo cáo tài chính và quyết toán thuế cho công ty khoảng 250 nhân sự.',
          ],
          ['MISA', 5, 'Sử dụng phần mềm MISA SME hằng ngày, phối hợp kiểm toán độc lập mỗi năm.'],
        ],
      },
    ],
  },
  {
    key: 'baotram',
    fullName: 'Lâm Bảo Trâm',
    email: 'baotram.lam.design@gmail.com',
    phone: '0909417326',
    city: 'Hồ Chí Minh',
    cvs: [
      {
        key: 'baotram-1',
        fileName: 'LamBaoTram_UIUX_Portfolio.docx',
        headline: 'UI/UX Designer',
        summary:
          '4 năm thiết kế sản phẩm số cho fintech và thương mại điện tử, theo đuổi thiết kế dựa trên dữ liệu và nghiên cứu người dùng.',
        experiences: [
          {
            title: 'Product Designer',
            company: 'Công ty Cổ phần Thương mại điện tử Chợ Xanh',
            from: '2022-02',
            to: '2026-08',
            lines: [
              '3 năm thiết kế giao diện ứng dụng mua sắm trên Figma cho hơn 1 triệu người dùng.',
              'Xây dựng design system gồm khoảng 120 component dùng chung cho web và mobile.',
              'Tổ chức user research và usability test mỗi quý với 10–15 khách hàng.',
            ],
          },
        ],
        skillLines: ['Figma, FigJam, Maze, Adobe Illustrator.'],
        education: {
          school: 'Trường Đại học Kiến trúc TP.HCM',
          degree: 'Cử nhân Thiết kế đồ hoạ',
          year: 2021,
        },
        skills: [
          [
            'Figma',
            3,
            '3 năm thiết kế giao diện ứng dụng mua sắm trên Figma cho hơn 1 triệu người dùng.',
          ],
          [
            'Design system',
            2,
            'Xây dựng design system gồm khoảng 120 component dùng chung cho web và mobile.',
          ],
          [
            'User research',
            2,
            'Tổ chức user research và usability test mỗi quý với 10–15 khách hàng.',
          ],
        ],
      },
    ],
  },
];
