import type { Role } from '../enums/role.enum.js';

/** Payload được ký vào JWT */
export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

/** Thông tin user gắn vào request sau khi xác thực (req.user) */
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}
