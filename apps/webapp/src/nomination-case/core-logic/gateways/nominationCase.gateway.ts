import { NominationCase } from "../../store/appState";

export interface NominationCaseGateway {
  retrieveNominationCase(id: string): Promise<NominationCase>;
}
