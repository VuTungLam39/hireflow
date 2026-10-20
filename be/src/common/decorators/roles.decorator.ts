import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from '../constants/index.js';
import type { Role } from '../enums/role.enum.js';

/** Giới hạn route cho các role được liệt kê */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
