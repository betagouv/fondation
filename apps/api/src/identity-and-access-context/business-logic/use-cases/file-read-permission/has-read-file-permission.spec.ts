import { FakeFileRepository } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/fake-file.repository';
import { FakeUserRepository } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/fake-user-repository';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UserBuilder } from '../../builders/user.builder';
import { Role } from 'shared-models';
import {
  FileType,
  HasReadFilePermissionUseCase,
} from './has-read-file-permission.use-case';

describe('Has Read File Permission', () => {
  let transactionPerformer: TransactionPerformer;
  let userRepository: FakeUserRepository;
  let fileRepository: FakeFileRepository;

  beforeEach(() => {
    transactionPerformer = new NullTransactionPerformer();
    userRepository = new FakeUserRepository();
    fileRepository = new FakeFileRepository();
  });

  it('should deny a non-registered user to access a transparency attachment file', async () => {
    fileRepository.addFile({
      fileId,
      type: FileType.PIECE_JOINTE_TRANSPARENCE,
    });
    expect(await hasReadFilePermission()).toBe(false);
  });

  describe('Membre commun', () => {
    beforeEach(() => {
      userRepository.users = {
        [membreCommun.id]: membreCommun,
      };
    });

    // TODO Tant que tous les fichiers ne sont pas migrés, on autorise l'accès à ceux manquants
    it.skip('should deny a reporter to access a non-existing transparency attachment file', async () => {
      expect(await hasReadFilePermission()).toBe(false);
    });

    it('should allow a reporter to access a transparency attachment file', async () => {
      givenSomeFile();
      expect(await hasReadFilePermission()).toBe(true);
    });
  });

  describe('Membre du Siège', () => {
    beforeEach(() => {
      userRepository.users = {
        [membreDuSiege.id]: membreDuSiege,
      };
    });

    it('should deny a siege reporter to access a parquet-only transparency attachment file', async () => {
      givenSomeFile(FileType.PIECE_JOINTE_TRANSPARENCE_POUR_PARQUET);
      expect(await hasReadFilePermission()).toBe(false);
    });
  });

  const hasReadFilePermission = () => {
    return new HasReadFilePermissionUseCase(
      transactionPerformer,
      userRepository,
      fileRepository,
    ).execute({
      userId: membreCommun.id,
      fileId,
    });
  };

  const givenSomeFile = (fileType = FileType.PIECE_JOINTE_TRANSPARENCE) => {
    fileRepository.addFile({
      fileId,
      type: fileType,
    });
  };
});

const fileId = 'file-id';

const membreCommun = new UserBuilder().with('role', Role.MEMBRE_COMMUN).build();
const membreDuSiege = new UserBuilder()
  .with('role', Role.MEMBRE_DU_SIEGE)
  .build();
