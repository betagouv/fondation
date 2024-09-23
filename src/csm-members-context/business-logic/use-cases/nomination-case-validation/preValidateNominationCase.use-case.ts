import { NominationCaseRepository } from '../../gateways/repositories/NominationCaseRepository';
import { OverseasToOverseasValidator } from '../../models/management-rules/OverseasToOverseasValidator';
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
    const overseasToOverseasValidated =
      new OverseasToOverseasValidator().validate(
        nominationCase.currentPositionGeography,
        nominationCase.newPositionGeography,
      );

    return {
      transferTimeValidated,
      profiledPositionValidated,
      overseasToOverseasValidated,
    };
  }
}
