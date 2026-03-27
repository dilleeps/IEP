export const APP_USER_ROLES = [
  'PARENT',
  'ADVOCATE',
  'TEACHER_THERAPIST',
  'COUNSELOR',
  'ADMIN',
  'SUPPORT',
] as const;

export type AppUserRole = (typeof APP_USER_ROLES)[number];

export const STANDARD_PROTECTED_ROLES: ReadonlyArray<AppUserRole> = APP_USER_ROLES;
