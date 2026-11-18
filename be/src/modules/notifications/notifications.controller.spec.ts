import { AiStatus } from '../../common/enums/ai-status.enum.js';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import { Role } from '../../common/enums/role.enum.js';
import { visibleTo } from './notifications.controller.js';
import type { RealtimeEvent } from './realtime-hub.service.js';

const appEvent: RealtimeEvent = {
  kind: 'application',
  organizationId: 'org-1',
  departmentId: 'd-1',
  applicationId: 'a-1',
  jobId: 'j-1',
  status: ApplicationStatus.Screening,
  aiStatus: AiStatus.Done,
};

const user = (role: Role, departmentId: string | null = null) => ({
  id: 'u-1',
  role,
  departmentId,
  organizationId: 'org-1',
});

// BR-ACC-07, BR-INT-02
describe('visibleTo', () => {
  it.each([Role.Admin, Role.Hr])('shows every application event to %s', (role) => {
    expect(visibleTo(appEvent, user(role))).toBe(true);
  });

  it('shows a hiring manager only their department', () => {
    expect(visibleTo(appEvent, user(Role.HiringManager, 'd-1'))).toBe(true);
    expect(visibleTo(appEvent, user(Role.HiringManager, 'd-2'))).toBe(false);
  });

  it.each([Role.Admin, Role.Hr])('hides another organization events from %s', (role) => {
    expect(visibleTo(appEvent, { ...user(role), organizationId: 'org-2' })).toBe(false);
  });

  it('hides application events from interviewers', () => {
    expect(visibleTo(appEvent, user(Role.Interviewer))).toBe(false);
  });

  it('sends a notification only to its recipient', () => {
    const event = { kind: 'notification', userId: 'u-1' } as RealtimeEvent;
    expect(visibleTo(event, user(Role.Interviewer))).toBe(true);
    expect(visibleTo(event, { ...user(Role.Admin), id: 'u-2' })).toBe(false);
  });

  it('refuses a role without a scope', () => {
    expect(() => visibleTo(appEvent, user('viewer' as Role))).toThrow();
  });
});
