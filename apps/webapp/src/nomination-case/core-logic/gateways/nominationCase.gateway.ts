import { NominationCase } from "../../store/appState";
import type { PartialDeep } from "type-fest";

export interface NominationCaseGateway {
  updateNominationCase(
    id: string,
    updatedNominationCase: PartialDeep<Omit<NominationCase, "id">>
  ): Promise<void>;
  retrieveNominationCase(id: string): Promise<NominationCase>;
}
