import { NominationCaseRepository } from '../../gateways/repositories/NominationCaseRepository';
import { JudiciaryRoleAndJuridictionDegreeChangeValidator } from '../../models/management-rules/JudiciaryRoleAndJuridictionDegreeChangeValidator';
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
        nominationCase.currentPosition.geography,
        nominationCase.newPosition.geography,
      );
    const judiciaryRoleAndJuridictionDegreeChangeValidated =
      new JudiciaryRoleAndJuridictionDegreeChangeValidator().validate(
        nominationCase.currentPosition,
        nominationCase.newPosition,
      );

    return {
      transferTimeValidated,
      profiledPositionValidated,
      overseasToOverseasValidated,
      judiciaryRoleAndJuridictionDegreeChangeValidated,
    };
  }
}
