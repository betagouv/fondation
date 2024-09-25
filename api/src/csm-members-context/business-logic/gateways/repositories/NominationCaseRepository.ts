import { NominationCase } from '../../models/NominationCase';

export interface NominationCaseRepository {
  byId(nominationCaseId: string): Promise<NominationCase>;
  save(nominationCase: NominationCase): Promise<void>;
}
