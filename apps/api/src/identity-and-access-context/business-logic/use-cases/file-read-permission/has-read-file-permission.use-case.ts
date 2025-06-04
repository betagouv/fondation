import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UserRepository } from '../../gateways/repositories/user-repository';
import { Role } from 'shared-models';
import { FileRepository } from '../../gateways/repositories/file-repository';
import { FileType } from '../../models/file-type';

export class HasReadFilePermissionUseCase {
  constructor(
    private readonly transactionPerformer: TransactionPerformer,
    private readonly userRepository: UserRepository,
    private readonly fileRepository: FileRepository,
  ) {}

  async execute({ userId, fileId }: { userId: string; fileId: string }) {
    return this.transactionPerformer.perform(async (trx) => {
      const user = await this.userRepository.userWithId(userId)(trx);
      if (!user) return false;
      const file = await this.fileRepository.fileWithId(fileId)(trx);
      // TODO Tant que tous les fichiers ne sont pas migrés, on autorise l'accès à ceux manquants
      if (!file) return true;

      return this.allowedRoles(file.type).includes(user.role);
    });
  }

  private allowedRoles(fileType: FileType): Role[] {
    switch (fileType) {
      case FileType.PIECE_JOINTE_TRANSPARENCE:
        return [
          Role.MEMBRE_COMMUN,
          Role.MEMBRE_DU_SIEGE,
          Role.MEMBRE_DU_PARQUET,
          Role.ADJOINT_SECRETAIRE_GENERAL,
        ];
      case FileType.PIECE_JOINTE_TRANSPARENCE_POUR_PARQUET:
        return [
          Role.MEMBRE_COMMUN,
          Role.MEMBRE_DU_PARQUET,
          Role.ADJOINT_SECRETAIRE_GENERAL,
        ];
      case FileType.PIECE_JOINTE_TRANSPARENCE_POUR_SIEGE:
        return [
          Role.MEMBRE_COMMUN,
          Role.MEMBRE_DU_SIEGE,
          Role.ADJOINT_SECRETAIRE_GENERAL,
        ];
      default:
        const _exhaustiveCheck: never = fileType;
        throw new Error(`Unhandled file type: ${_exhaustiveCheck}`);
    }
  }
}
