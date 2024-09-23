import { NominationCaseRepository } from '../../gateways/repositories/NominationCaseRepository';
import { ProfiledPositionValidator } from '../../models/management-rules/ProfiledPositionValidator';
import { TransferTimeValidator } from '../../models/management-rules/TransferTimeValidator';

export class PreValidateNominationCaseUseCase {
  constructor(
    private readonly nominationCaseRepository: NominationCaseRepository,
  ) {}

  async execute(nominationCaseId: string) {
    const nominationCase = await this.nominationCaseRepository.byId(
      nominationCaseId,
    );
    const transferTimeValidated = new TransferTimeValidator().validate(
      nominationCase.currentPositionStartDate,
      nominationCase.takingOfficeDate,
    );
    const profiledPositionValidated = new ProfiledPositionValidator().validate(
      nominationCase.profiledPosition,
    );
    return { transferTimeValidated, profiledPositionValidated };
  }
}
