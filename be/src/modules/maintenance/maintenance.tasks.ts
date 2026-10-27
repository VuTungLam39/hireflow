// F-CAND-05, F-OPS-03 · Database Design 6
export const MAINTENANCE_TASK = {
  anonymizeExpired: 'anonymize-expired',
  purgeTokens: 'purge-tokens',
} as const;

export type MaintenanceTask = (typeof MAINTENANCE_TASK)[keyof typeof MAINTENANCE_TASK];

export const MAINTENANCE_TIMEZONE = 'Asia/Ho_Chi_Minh';

export const MAINTENANCE_SCHEDULE: Record<MaintenanceTask, string> = {
  [MAINTENANCE_TASK.anonymizeExpired]: '0 2 * * *',
  [MAINTENANCE_TASK.purgeTokens]: '30 2 * * *',
};
