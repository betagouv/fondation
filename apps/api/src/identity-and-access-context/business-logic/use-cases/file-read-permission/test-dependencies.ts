import { Role } from 'shared-models';
import { UserBuilder } from '../../builders/user.builder';
import { FileType } from '../../models/file-type';
import { getTestDependencies as getUseCasesTestDependencies } from '../test-dependencies';

export const userId = 'user-id';
export const membreCommun = new UserBuilder()
  .with('id', userId)
  .with('role', Role.MEMBRE_COMMUN)
  .build();
export const membreDuSiege = new UserBuilder()
  .with('id', userId)
  .with('role', Role.MEMBRE_DU_SIEGE)
  .build();
export const membreDuParquet = new UserBuilder()
  .with('id', userId)
  .with('role', Role.MEMBRE_DU_PARQUET)
  .build();
export const adjointSecrétaireGeneral = new UserBuilder()
  .with('id', userId)
  .with('role', Role.ADJOINT_SECRETAIRE_GENERAL)
  .build();
export const fileId = 'file-id';

export const getTestDependencies = () => {
  const deps = getUseCasesTestDependencies();

  const hasReadFilePermission = () =>
    deps.hasReadFilePermissionUseCase.execute({
      userId,
      fileId,
    });

  const givenSomeFile = (fileType = FileType.PIECE_JOINTE_TRANSPARENCE) =>
    deps.fileRepository.addFile({
      fileId,
      type: fileType,
    });

  const expectReadApproved = async () =>
    expect(await hasReadFilePermission()).toBe(true);

  const expectReadDenied = async () =>
    expect(await hasReadFilePermission()).toBe(false);

  return {
    ...deps,
    hasReadFilePermission,
    givenSomeFile,
    expectReadApproved,
    expectReadDenied,
  };
};

export type TestDependencies = ReturnType<typeof getTestDependencies>;
