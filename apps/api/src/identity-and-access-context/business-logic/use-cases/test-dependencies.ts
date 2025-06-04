import { FakeFileRepository } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/fake-file.repository';
import { FakeUserRepository } from 'src/identity-and-access-context/adapters/secondary/gateways/repositories/fake-user-repository';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { HasReadFilePermissionUseCase } from './file-read-permission/has-read-file-permission.use-case';

export const getTestDependencies = () => {
  const transactionPerformer = new NullTransactionPerformer();
  const userRepository = new FakeUserRepository();
  const fileRepository = new FakeFileRepository();
  const hasReadFilePermissionUseCase = new HasReadFilePermissionUseCase(
    transactionPerformer,
    userRepository,
    fileRepository,
  );

  return {
    transactionPerformer,

    userRepository,
    fileRepository,

    hasReadFilePermissionUseCase,
  };
};

export type TestDependencies = ReturnType<typeof getTestDependencies>;
