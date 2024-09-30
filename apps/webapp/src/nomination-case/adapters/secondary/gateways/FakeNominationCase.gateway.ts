import { PartialDeep } from "type-fest";
import { NominationCaseGateway } from "../../../core-logic/gateways/nominationCase.gateway";
import {
  NominationCase,
  NominationCaseListItem,
} from "../../../store/appState";

export class FakeNominationCaseGateway implements NominationCaseGateway {
  nominationCases: Record<string, NominationCase> = {};

  async updateNominationCase(
    id: string,
    updatedNominationCase: PartialDeep<Omit<NominationCase, "id">>
  ): Promise<void> {
    const nominationCase = this.nominationCases[id];
    this.nominationCases[id] = {
      ...nominationCase,
      ...updatedNominationCase,
      preValidatedRules: {
        ...nominationCase.preValidatedRules,
        ...updatedNominationCase.preValidatedRules,
        managementRules: {
          ...nominationCase.preValidatedRules.managementRules,
          ...updatedNominationCase.preValidatedRules?.managementRules,
        },
      },
    };
  }

  async list(): Promise<NominationCaseListItem[]> {
    return Object.values(this.nominationCases).map(({ id, name }) => ({
      id,
      name,
    }));
  }
  async retrieveNominationCase(id: string) {
    const nominationCase = this.nominationCases[id];
    if (!nominationCase) throw new Error("Nomination case not found");
    return nominationCase;
  }

  // private throwabledGetNominationCase(id: string) {
  //   const nominationCase = this.nominationCases[id];
  //   if (!nominationCase) throw new Error("Nomination case not found");
  //   return nominationCase;
  // }
}
