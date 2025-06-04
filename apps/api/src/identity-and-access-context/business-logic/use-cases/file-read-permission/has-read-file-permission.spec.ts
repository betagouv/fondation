import { FileType } from '../../models/file-type';
import {
  adjointSecrétaireGeneral,
  fileId,
  getTestDependencies,
  membreCommun,
  membreDuParquet,
  membreDuSiege,
  TestDependencies,
} from './test-dependencies';

describe('Permissions de lecture de fichier', () => {
  let deps: TestDependencies;

  beforeEach(() => {
    deps = getTestDependencies();
  });

  it("refuse à un utilisateur non enregistré l'accès à une pièce jointe de transparence", async () => {
    deps.fileRepository.addFile({
      fileId,
      type: FileType.PIECE_JOINTE_TRANSPARENCE,
    });
    expect(await deps.hasReadFilePermission()).toBe(false);
  });

  describe.each([
    {
      role: 'Membre Commun',
      user: membreCommun,
    },
    {
      role: 'Adjoint Secrétaire Général',
      user: adjointSecrétaireGeneral,
    },
  ])('$role', ({ user }) => {
    beforeEach(() => {
      deps.userRepository.users = {
        [user.id]: user,
      };
    });

    it.each([
      FileType.PIECE_JOINTE_TRANSPARENCE,
      FileType.PIECE_JOINTE_TRANSPARENCE_POUR_PARQUET,
      FileType.PIECE_JOINTE_TRANSPARENCE_POUR_SIEGE,
    ])(`autorise l'accès à une pièce jointe de type %s`, async (fileType) => {
      deps.givenSomeFile(fileType);
      await deps.expectReadApproved();
    });
  });

  describe.each([
    {
      describeName: 'Membre du Parquet',
      fileType: FileType.PIECE_JOINTE_TRANSPARENCE_POUR_SIEGE,
      user: membreDuParquet,
    },
    {
      describeName: 'Membre du Siège',
      fileType: FileType.PIECE_JOINTE_TRANSPARENCE_POUR_PARQUET,
      user: membreDuSiege,
    },
  ])('$describeName', ({ fileType, user }) => {
    beforeEach(() => {
      deps.userRepository.users = {
        [user.id]: user,
      };
    });

    it(`devrait refuser l'accès à une pièce jointe de transparence de type: ${fileType}`, async () => {
      deps.givenSomeFile(fileType);
      await deps.expectReadDenied();
    });
  });
});
