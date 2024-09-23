import { NominationCaseRepository } from '../../gateways/repositories/NominationCaseRepository';
import { TransferTimeValidator } from '../../models/management-rules/TransferTimeValidator';

export class PreValidateNominationCaseUseCase {
  constructor(
    private readonly nominationCaseRepository: NominationCaseRepository,
  ) {}

  async execute(nominationCaseId: string) {
    const nominationCase = await this.nominationCaseRepository.byId(
      nominationCaseId,
    );
    return new TransferTimeValidator().validate(
      nominationCase.currentPositionStartDate,
      nominationCase.takingOfficeDate,
    );
  }
}
