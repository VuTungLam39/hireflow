import { Role } from '../enums/role.enum.js';
import { Permission } from './permission.enum.js';

const P = Permission;

// Kickoff 11.1
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  [Role.Admin]: Object.values(Permission),
  [Role.Hr]: [
    P.JobRead,
    P.JobCreate,
    P.JobUpdate,
    P.JobPublish,
    P.CandidateRead,
    P.CandidateUpdate,
    P.ApplicationRead,
    P.ApplicationCreate,
    P.ApplicationUpdateStatus,
    P.CvRead,
    P.AiChat,
    P.AiRescore,
    P.DashboardRead,
    P.InterviewManage,
  ],
  [Role.HiringManager]: [
    P.JobRead,
    P.CandidateRead,
    P.ApplicationRead,
    P.ApplicationApproveOffer,
    P.CvRead,
    P.AiChat,
    P.DashboardRead,
  ],
  // BR-INT-02: phạm vi "được giao" áp ở tầng query
  [Role.Interviewer]: [P.JobRead, P.ApplicationRead, P.CvRead, P.InterviewFeedback],
};

export const hasPermission = (role: Role, permission: Permission) =>
  ROLE_PERMISSIONS[role].includes(permission);
