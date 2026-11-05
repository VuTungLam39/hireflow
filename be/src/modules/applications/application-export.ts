import { ApplicationSource } from '../../common/enums/application-source.enum.js';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import { VN_TIME_ZONE } from '../../common/utils/vn-date.js';

// E6 · BR-APP-11: xuất CSV danh sách hồ sơ

export const EXPORT_MAX_ROWS = 5000;
export const EXPORT_BATCH = 500;

/** Excel trên Windows chỉ đọc đúng UTF-8 khi file có BOM */
export const CSV_BOM = '\uFEFF';

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  [ApplicationStatus.New]: 'Mới',
  [ApplicationStatus.Screening]: 'Sàng lọc',
  [ApplicationStatus.Interview]: 'Phỏng vấn',
  [ApplicationStatus.Offer]: 'Đề nghị',
  [ApplicationStatus.Hired]: 'Đã nhận',
  [ApplicationStatus.Rejected]: 'Từ chối',
  [ApplicationStatus.Withdrawn]: 'Ứng viên rút',
};

const SOURCE_LABEL: Record<ApplicationSource, string> = {
  [ApplicationSource.PublicForm]: 'Trang tuyển dụng',
  [ApplicationSource.HrUpload]: 'HR tải hộ',
  [ApplicationSource.MatchInvite]: 'Mời từ hồ sơ cũ',
};

export const CSV_HEADER = [
  'Họ tên',
  'Email',
  'Số điện thoại',
  'Vị trí',
  'Phòng ban',
  'Trạng thái',
  'Điểm',
  'Nguồn',
  'Ngày nộp',
];

export interface ExportRow {
  fullName: string;
  email: string;
  phone: string | null;
  jobTitle: string;
  department: string;
  status: ApplicationStatus;
  score: number | null;
  source: ApplicationSource;
  createdAt: Date;
}

const dateTime = new Intl.DateTimeFormat('vi-VN', {
  timeZone: VN_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** "dd/mm/yyyy HH:mm" giờ Việt Nam */
export const formatVnDateTime = (date: Date) => {
  const p = Object.fromEntries(dateTime.formatToParts(date).map((x) => [x.type, x.value]));
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}`;
};

/**
 * Luôn đặt trong ngoặc kép; ô bắt đầu bằng = + - @ tab hoặc CR được thêm dấu ' phía trước
 * để Excel không chạy như công thức (CSV injection) – tên, email do ứng viên tự nhập
 */
export function csvCell(value: string | number | null): string {
  if (value === null) return '""';
  let text = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export const csvLine = (cells: (string | number | null)[]) => `${cells.map(csvCell).join(',')}\r\n`;

/** Có khoảng trắng thì Excel giữ dạng chữ, không làm mất số 0 đầu */
export const formatPhone = (phone: string | null) =>
  phone && /^\d{10,11}$/.test(phone) ? phone.replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3') : phone;

export const csvRow = (row: ExportRow) =>
  csvLine([
    row.fullName,
    row.email,
    formatPhone(row.phone),
    row.jobTitle,
    row.department,
    STATUS_LABEL[row.status],
    row.score,
    SOURCE_LABEL[row.source],
    formatVnDateTime(row.createdAt),
  ]);

export const exportFileName = (today: string) => `ho-so-ung-tuyen-${today}.csv`;
