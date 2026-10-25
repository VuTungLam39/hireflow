import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';
import { CV_MAX_BYTES } from './entities/cv-file.entity.js';

// BR-FILE-01, tên file tiếng Việt
export const CV_UPLOAD_OPTIONS: MulterOptions = {
  limits: { fileSize: CV_MAX_BYTES, files: 1 },
  defParamCharset: 'utf8',
};
