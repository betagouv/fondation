import { Gender, Role } from 'shared-models';

import { assertNever } from 'src/utils/assert-never';
import * as schema from 'src/modules/framework/drizzle/schemas';
import { FileType } from 'src/identity-and-access-context/business-logic/models/file-type';

export const roleEnum = schema.roleEnum;
export const genderEnum = schema.genderEnum;
export const fileTypeEnum = schema.fileTypeEnum;

type DrizzleRoleEnum = (typeof schema.roleEnum)['enumValues'][number];
export function toRole(value: DrizzleRoleEnum): Role {
  switch (value) {
    case 'ADJOINT_SECRETAIRE_GENERAL':
      return Role.ADJOINT_SECRETAIRE_GENERAL;
    case 'MEMBRE_COMMUN':
      return Role.MEMBRE_COMMUN;
    case 'MEMBRE_DU_PARQUET':
      return Role.MEMBRE_DU_PARQUET;
    case 'MEMBRE_DU_SIEGE':
      return Role.MEMBRE_DU_SIEGE;
    default:
      return assertNever(value);
  }
}

type DrizzleGenderEnum = (typeof schema.genderEnum)['enumValues'][number];
export function toGender(value: DrizzleGenderEnum): Gender {
  switch (value) {
    case 'MALE':
      return Gender.M;
    case 'FEMALE':
      return Gender.F;
    default:
      return assertNever(value);
  }
}

type DrizzleFileTypeEnum = (typeof schema.fileTypeEnum)['enumValues'][number];
export function toFileType(value: DrizzleFileTypeEnum): FileType {
  switch (value) {
    case 'PIECE_JOINTE_TRANSPARENCE':
      return FileType.PIECE_JOINTE_TRANSPARENCE;
    case 'PIECE_JOINTE_TRANSPARENCE_POUR_PARQUET':
      return FileType.PIECE_JOINTE_TRANSPARENCE_POUR_PARQUET;
    case 'PIECE_JOINTE_TRANSPARENCE_POUR_SIEGE':
      return FileType.PIECE_JOINTE_TRANSPARENCE_POUR_SIEGE;
    default:
      return assertNever(value);
  }
}
