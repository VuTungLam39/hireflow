import { UnrecoverableError } from 'bullmq';

// BR-AI-07: lý do hiện cho HR
export const AI_ERROR = {
  noText: 'Không đọc được chữ trong CV (có thể là ảnh scan). Hệ thống không OCR.',
  unreadable: 'File CV bị lỗi hoặc không đúng định dạng PDF/DOCX.',
  tooLarge: 'File DOCX quá lớn sau khi giải nén.',
  fileMissing: 'Không tìm thấy file CV trong kho lưu trữ.',
  invalidOutput: 'AI trả kết quả sai cấu trúc sau 3 lần thử.',
  config: 'Cấu hình AI chưa đúng, liên hệ Admin.',
  unavailable: 'Dịch vụ AI tạm thời không phản hồi. Bấm Chấm lại để thử lại.',
} as const;

export class PipelineFailure extends UnrecoverableError {
  constructor(readonly reason: string) {
    super(reason);
  }
}
