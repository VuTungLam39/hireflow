import { SetMetadata } from '@nestjs/common';
import { RESPONSE_MESSAGE_KEY } from '../constants/index.js';

/** Đặt message trả về trong response chuẩn */
export const ResponseMessage = (message: string) => SetMetadata(RESPONSE_MESSAGE_KEY, message);
