import { NominationCaseRepository } from 'src/csm-members-context/business-logic/gateways/repositories/NominationCaseRepository';
import { NominationCase } from 'src/csm-members-context/business-logic/models/NominationCase';

export class FakeNominationCaseRepository implements NominationCaseRepository {
  nominationCases: Record<string, NominationCase>;

  async byId(nominationCaseId: string): Promise<NominationCase> {
    return this.nominationCases[nominationCaseId];
  }
  async save(nominationCase: NominationCase): Promise<void> {
    this.nominationCases[nominationCase.id] = nominationCase;
  }
}
