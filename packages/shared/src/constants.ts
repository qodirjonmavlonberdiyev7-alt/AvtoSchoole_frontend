import { Role } from './enums';

/** Which roles a given role is allowed to create (used by both backend guards and frontend UI gating). */
export const ROLE_CREATION_MATRIX: Record<Role, Role[]> = {
  [Role.SUPERADMIN]: [Role.TEACHER],
  [Role.TEACHER]: [Role.STUDENT],
  [Role.STUDENT]: [],
};

export const SUPPORTED_LANGUAGES = ['uz', 'ru', 'en'] as const;

export const ACCESS_TOKEN_EXPIRES_IN = '15m';
export const REFRESH_TOKEN_EXPIRES_IN = '30d';
