import { PrismaRoleEnum } from 'src/generated/prisma/enums';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { assertNever } from 'src/utils/assert-never';

export function prismaRoleEnumToRoleEnum(value: PrismaRoleEnum): RoleEnum {
  switch (value) {
    case PrismaRoleEnum.MEMBRE_DU_SIEGE:
      return 'MEMBRE_DU_SIEGE';
    case PrismaRoleEnum.MEMBRE_DU_PARQUET:
      return 'MEMBRE_DU_PARQUET';
    case PrismaRoleEnum.MEMBRE_COMMUN:
      return 'MEMBRE_COMMUN';
    case PrismaRoleEnum.ADJOINT_SECRETAIRE_GENERAL:
      return 'ADJOINT_SECRETAIRE_GENERAL';
    case PrismaRoleEnum.ADMIN:
      return 'ADMIN';
    default:
      return assertNever(value);
  }
}

export function roleEnumToPrismaRoleEnum(value: RoleEnum): PrismaRoleEnum {
  switch (value) {
    case 'MEMBRE_DU_SIEGE':
      return PrismaRoleEnum.MEMBRE_DU_SIEGE;
    case 'MEMBRE_DU_PARQUET':
      return PrismaRoleEnum.MEMBRE_DU_PARQUET;
    case 'MEMBRE_COMMUN':
      return PrismaRoleEnum.MEMBRE_COMMUN;
    case 'ADJOINT_SECRETAIRE_GENERAL':
      return PrismaRoleEnum.ADJOINT_SECRETAIRE_GENERAL;
    case 'ADMIN':
      return PrismaRoleEnum.ADMIN;
    default:
      return assertNever(value);
  }
}
