import { Role } from 'shared-models';

import { PrismaRoleEnum } from 'src/generated/prisma/enums';
import { assertNever } from 'src/utils/assert-never';

export function prismaRoleEnumToRoleEnum(value: PrismaRoleEnum): Role {
  switch (value) {
    case PrismaRoleEnum.MEMBRE_DU_SIEGE:
      return Role.MEMBRE_DU_SIEGE;
    case PrismaRoleEnum.MEMBRE_DU_PARQUET:
      return Role.MEMBRE_DU_PARQUET;
    case PrismaRoleEnum.MEMBRE_COMMUN:
      return Role.MEMBRE_COMMUN;
    case PrismaRoleEnum.ADJOINT_SECRETAIRE_GENERAL:
      return Role.ADJOINT_SECRETAIRE_GENERAL;
    case PrismaRoleEnum.ADMIN:
      return Role.ADMIN;
    default:
      return assertNever(value);
  }
}

export function roleEnumToPrismaRoleEnum(value: Role): PrismaRoleEnum {
  switch (value) {
    case Role.MEMBRE_DU_SIEGE:
      return PrismaRoleEnum.MEMBRE_DU_SIEGE;
    case Role.MEMBRE_DU_PARQUET:
      return PrismaRoleEnum.MEMBRE_DU_PARQUET;
    case Role.MEMBRE_COMMUN:
      return PrismaRoleEnum.MEMBRE_COMMUN;
    case Role.ADJOINT_SECRETAIRE_GENERAL:
      return PrismaRoleEnum.ADJOINT_SECRETAIRE_GENERAL;
    case Role.ADMIN:
      return PrismaRoleEnum.ADMIN;
    default:
      return assertNever(value);
  }
}
