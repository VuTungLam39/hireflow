export enum Role {
  Admin = 'admin',
  Hr = 'hr',
  HiringManager = 'hiring_manager',
  Interviewer = 'interviewer',
  // MVP 3 · BR-TEN-04
  PlatformAdmin = 'platform_admin',
}

// BR-ACC-01: vai Admin công ty được tạo; Quản trị sàn chỉ tạo bằng seed/CLI
export const STAFF_ROLES = [Role.Admin, Role.Hr, Role.HiringManager, Role.Interviewer] as const;
