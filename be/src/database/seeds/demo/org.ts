import { Role } from '../../../common/enums/role.enum.js';

export const at = (value: string) => new Date(`${value.replace(' ', 'T')}:00+07:00`);

export interface DemoDepartment {
  code: string;
  name: string;
}

export const DEPARTMENTS: DemoDepartment[] = [
  { code: 'ENG', name: 'Phát triển phần mềm' },
  { code: 'MOBILE', name: 'Phát triển Mobile' },
  { code: 'QA', name: 'Kiểm thử chất lượng' },
  { code: 'DEVOPS', name: 'Hạ tầng & DevOps' },
  { code: 'DATA', name: 'Dữ liệu & Phân tích' },
  { code: 'AI', name: 'Trí tuệ nhân tạo' },
  { code: 'PRODUCT', name: 'Quản lý sản phẩm' },
  { code: 'DESIGN', name: 'Thiết kế UI/UX' },
  { code: 'SEC', name: 'An toàn thông tin' },
  { code: 'SALES', name: 'Kinh doanh' },
  { code: 'CS', name: 'Chăm sóc khách hàng' },
  { code: 'MKT', name: 'Marketing' },
  { code: 'HR', name: 'Nhân sự' },
  { code: 'FIN', name: 'Tài chính – Kế toán' },
  { code: 'LEGAL', name: 'Pháp chế' },
  { code: 'ADMIN', name: 'Hành chính' },
  { code: 'OPS', name: 'Vận hành' },
  { code: 'PROC', name: 'Mua hàng' },
  { code: 'TRAIN', name: 'Đào tạo nội bộ' },
  { code: 'BD', name: 'Phát triển đối tác' },
];

export interface DemoUser {
  key: string;
  email: string;
  fullName: string;
  role: Role;
  department?: string;
  isActive?: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export const USERS: DemoUser[] = [
  {
    key: 'admin',
    email: 'admin@example.com',
    fullName: 'Quản trị viên',
    role: Role.Admin,
    createdAt: '2026-06-01 08:00',
    lastLoginAt: '2026-10-22 08:12',
  },
  {
    key: 'hr.ha',
    email: 'hr@hireflow.dev',
    fullName: 'Nguyễn Thu Hà',
    role: Role.Hr,
    createdAt: '2026-06-02 09:00',
    lastLoginAt: '2026-10-22 08:31',
  },
  {
    key: 'hr.mai',
    email: 'mai.hoang@hireflow.dev',
    fullName: 'Hoàng Thị Mai',
    role: Role.Hr,
    createdAt: '2026-06-02 09:10',
    lastLoginAt: '2026-10-21 17:45',
  },
  {
    key: 'hr.bao',
    email: 'bao.vu@hireflow.dev',
    fullName: 'Vũ Quốc Bảo',
    role: Role.Hr,
    createdAt: '2026-07-14 09:00',
    lastLoginAt: '2026-10-22 09:02',
  },
  {
    key: 'hr.trang',
    email: 'trang.dang@hireflow.dev',
    fullName: 'Đặng Thu Trang',
    role: Role.Hr,
    createdAt: '2026-08-03 09:00',
    lastLoginAt: '2026-10-20 16:20',
  },
  {
    key: 'hm.eng',
    email: 'hm.eng@hireflow.dev',
    fullName: 'Trần Đức Long',
    role: Role.HiringManager,
    department: 'ENG',
    createdAt: '2026-06-05 10:00',
    lastLoginAt: '2026-10-21 10:05',
  },
  {
    key: 'hm.sales',
    email: 'hm.sales@hireflow.dev',
    fullName: 'Phạm Ngọc Lan',
    role: Role.HiringManager,
    department: 'SALES',
    createdAt: '2026-06-05 10:05',
    lastLoginAt: '2026-10-19 14:40',
  },
  {
    key: 'hm.mobile',
    email: 'phuoc.le@hireflow.dev',
    fullName: 'Lê Hữu Phước',
    role: Role.HiringManager,
    department: 'MOBILE',
    createdAt: '2026-06-10 10:00',
    lastLoginAt: '2026-10-21 15:12',
  },
  {
    key: 'hm.qa',
    email: 'oanh.nguyen@hireflow.dev',
    fullName: 'Nguyễn Thị Kim Oanh',
    role: Role.HiringManager,
    department: 'QA',
    createdAt: '2026-06-10 10:10',
    lastLoginAt: '2026-10-20 09:30',
  },
  {
    key: 'hm.devops',
    email: 'truong.dao@hireflow.dev',
    fullName: 'Đào Xuân Trường',
    role: Role.HiringManager,
    department: 'DEVOPS',
    createdAt: '2026-06-12 11:00',
    lastLoginAt: '2026-10-21 20:47',
  },
  {
    key: 'hm.data',
    email: 'khai.phan@hireflow.dev',
    fullName: 'Phan Văn Khải',
    role: Role.HiringManager,
    department: 'DATA',
    createdAt: '2026-06-12 11:05',
    lastLoginAt: '2026-10-18 11:00',
  },
  {
    key: 'hm.ai',
    email: 'thu.tran@hireflow.dev',
    fullName: 'Trần Thị Minh Thư',
    role: Role.HiringManager,
    department: 'AI',
    createdAt: '2026-09-01 09:00',
    lastLoginAt: '2026-10-20 13:15',
  },
  {
    key: 'hm.product',
    email: 'vinh.ngo@hireflow.dev',
    fullName: 'Ngô Quang Vinh',
    role: Role.HiringManager,
    department: 'PRODUCT',
    createdAt: '2026-06-15 09:00',
    lastLoginAt: '2026-10-21 08:55',
  },
  {
    key: 'hm.design',
    email: 'chi.ha@hireflow.dev',
    fullName: 'Hà Linh Chi',
    role: Role.HiringManager,
    department: 'DESIGN',
    createdAt: '2026-06-15 09:10',
    lastLoginAt: '2026-10-15 10:20',
  },
  {
    key: 'hm.mkt',
    email: 'thinh.luu@hireflow.dev',
    fullName: 'Lưu Đức Thịnh',
    role: Role.HiringManager,
    department: 'MKT',
    createdAt: '2026-06-18 14:00',
    lastLoginAt: '2026-10-21 11:34',
  },
  {
    key: 'hm.cs',
    email: 'gam.vo@hireflow.dev',
    fullName: 'Võ Thị Hồng Gấm',
    role: Role.HiringManager,
    department: 'CS',
    createdAt: '2026-06-18 14:10',
    lastLoginAt: '2026-10-17 09:05',
  },
  {
    key: 'hm.fin',
    email: 'yen.dinh@hireflow.dev',
    fullName: 'Đinh Thị Hải Yến',
    role: Role.HiringManager,
    department: 'FIN',
    createdAt: '2026-06-20 08:30',
    lastLoginAt: '2026-10-16 15:50',
  },
  {
    key: 'hm.hr',
    email: 'huong.bui@hireflow.dev',
    fullName: 'Bùi Thanh Hương',
    role: Role.HiringManager,
    department: 'HR',
    createdAt: '2026-06-20 08:40',
    lastLoginAt: '2026-10-21 16:02',
  },
  {
    key: 'hm.sec',
    email: 'hoang.kieu@hireflow.dev',
    fullName: 'Kiều Minh Hoàng',
    role: Role.HiringManager,
    department: 'SEC',
    createdAt: '2026-08-25 09:00',
    lastLoginAt: '2026-10-15 17:30',
  },
  {
    key: 'hm.legal',
    email: 'dinh.ta@hireflow.dev',
    fullName: 'Tạ Văn Định',
    role: Role.HiringManager,
    department: 'LEGAL',
    isActive: false,
    createdAt: '2026-06-22 09:00',
    lastLoginAt: '2026-09-26 17:10',
  },
  // F-INT-02: Interviewer chỉ thấy hồ sơ được giao
  {
    key: 'iv.khoa',
    email: 'interviewer@hireflow.dev',
    fullName: 'Bùi Minh Khoa',
    role: Role.Interviewer,
    createdAt: '2026-09-01 09:00',
    lastLoginAt: '2026-10-21 14:00',
  },
  {
    key: 'iv.linh',
    email: 'linh.pham@hireflow.dev',
    fullName: 'Phạm Thùy Linh',
    role: Role.Interviewer,
    createdAt: '2026-09-01 09:10',
    lastLoginAt: '2026-10-20 10:30',
  },
];

export interface DemoSession {
  user: string;
  startedAt: string;
  userAgent: string;
  ip: string;
  end: 'logout' | 'expired';
}

const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const EDGE =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0';
const SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15';
const MOBILE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1';

// BR-ACC-04, Backend Architecture 10.5
export const SESSIONS: DemoSession[] = [
  {
    user: 'admin',
    startedAt: '2026-10-06 08:05',
    userAgent: CHROME,
    ip: '10.10.1.15',
    end: 'logout',
  },
  {
    user: 'hr.ha',
    startedAt: '2026-10-07 08:20',
    userAgent: EDGE,
    ip: '10.10.2.21',
    end: 'expired',
  },
  {
    user: 'hr.mai',
    startedAt: '2026-10-08 13:40',
    userAgent: CHROME,
    ip: '10.10.2.34',
    end: 'logout',
  },
  {
    user: 'hr.bao',
    startedAt: '2026-10-09 08:55',
    userAgent: SAFARI,
    ip: '10.10.2.47',
    end: 'logout',
  },
  {
    user: 'hr.trang',
    startedAt: '2026-10-09 14:10',
    userAgent: CHROME,
    ip: '10.10.2.52',
    end: 'expired',
  },
  {
    user: 'hm.eng',
    startedAt: '2026-10-10 09:30',
    userAgent: CHROME,
    ip: '10.10.3.11',
    end: 'logout',
  },
  {
    user: 'hm.sales',
    startedAt: '2026-10-10 21:15',
    userAgent: MOBILE,
    ip: '113.161.44.27',
    end: 'expired',
  },
  {
    user: 'hm.mobile',
    startedAt: '2026-10-13 10:00',
    userAgent: SAFARI,
    ip: '10.10.3.25',
    end: 'logout',
  },
  {
    user: 'hm.qa',
    startedAt: '2026-10-13 15:45',
    userAgent: EDGE,
    ip: '10.10.3.32',
    end: 'logout',
  },
  {
    user: 'hm.devops',
    startedAt: '2026-10-14 20:30',
    userAgent: CHROME,
    ip: '14.232.18.90',
    end: 'expired',
  },
];
