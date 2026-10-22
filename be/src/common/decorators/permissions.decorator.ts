import { SetMetadata } from '@nestjs/common';
import { AUTHENTICATED_KEY, PERMISSIONS_KEY } from '../constants/index.js';
import type { Permission } from '../permissions/permission.enum.js';

// Backend Architecture 10.3
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const Authenticated = () => SetMetadata(AUTHENTICATED_KEY, true);
