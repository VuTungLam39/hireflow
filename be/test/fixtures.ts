import { DEFAULT_ORGANIZATION_ID } from '../src/modules/organizations/entities/organization.entity.js';

export const ORG = DEFAULT_ORGANIZATION_ID;

// BR-TEN-01
export const withOrg = <T>(value: T, organizationId = ORG): T =>
  (Array.isArray(value)
    ? value.map((v: object) => ({ organizationId, ...v }))
    : { organizationId, ...(value as object) }) as T;
