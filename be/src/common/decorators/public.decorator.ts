import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from '../constants/index.js';

/** Bỏ qua JwtAuthGuard cho route/controller này */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
