import { FakeFileRepository } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/fake-file.repository';
import { FakeUserRepository } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/fake-user-repository';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UserBuilder } from '../../builders/user.builder';
import { Role } from 'shared-models';
import { HasReadFilePermissionUseCase } from './has-read-file-permission.use-case';
import { FileType } from '../../models/file-type';

const membreCommun = new UserBuilder().with('role', Role.MEMBRE_COMMUN).build();
const membreDuSiege = new UserBuilder()
  .with('role', Role.MEMBRE_DU_SIEGE)
  .build();
const membreDuParquet = new UserBuilder()
  .with('role', Role.MEMBRE_DU_PARQUET)
  .build();

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

    it('should allow a reporter to access a transparency attachment file', async () => {
      givenSomeFile();
      expect(await hasReadFilePermission()).toBe(true);
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
      userRepository.users = {
        [user.id]: user,
      };
    });

    it(`should deny access to transparency attachment file of type: ${fileType}`, async () => {
      givenSomeFile(fileType);
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
