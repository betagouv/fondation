import { NominationCaseGateway } from "../../../core-logic/gateways/nominationCase.gateway";
import { NominationCase } from "../../../store/appState";

export class FakeNominationCaseGateway implements NominationCaseGateway {
  nominationCases: Record<string, NominationCase> = {};

  async retrieveNominationCase(id: string) {
    const nominationCase = this.nominationCases[id];
    if (!nominationCase) throw new Error("Nomination case not found");
    return nominationCase;
  }
}
