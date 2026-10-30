import type { DetailedUserResponseDto } from '@api/types';

export type RoleEnum = DetailedUserResponseDto['role'];

export function isSecretariat(role: RoleEnum): boolean {
  return role === 'ADJOINT_SECRETAIRE_GENERAL';
}
