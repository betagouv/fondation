import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UserRepository } from '../../gateways/repositories/user-repository';
import { Role } from 'shared-models';
import { FileRepository } from '../../gateways/repositories/file-repository';

export enum FileType {
  PIECE_JOINTE_TRANSPARENCE = 'PIECE_JOINTE_TRANSPARENCE',
  PIECE_JOINTE_TRANSPARENCE_POUR_PARQUET = 'PIECE_JOINTE_TRANSPARENCE_POUR_PARQUET',
}

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

      const allowedRoles =
        file.type === FileType.PIECE_JOINTE_TRANSPARENCE
          ? [Role.MEMBRE_COMMUN, Role.MEMBRE_DU_SIEGE, Role.MEMBRE_DU_PARQUET]
          : [Role.MEMBRE_COMMUN, Role.MEMBRE_DU_PARQUET];

      return allowedRoles.includes(user.role);
    });
  }
}
