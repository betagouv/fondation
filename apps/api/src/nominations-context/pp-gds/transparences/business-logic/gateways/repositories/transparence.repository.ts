import {
  DateOnlyJson,
  Magistrat,
  SessionMetadata,
  TypeDeSaisine,
} from 'shared-models';

import { Session } from 'src/nominations-context/sessions/business-logic/models/session';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
export interface TransparenceRepository {
  byNomFormationEtDate(
    nom: string,
    formation: Magistrat.Formation,
    dateTransparence: DateOnlyJson,
  ): TransactionableAsync<Session<TypeDeSaisine.TRANSPARENCE_GDS> | null>;
  findMetaDataBySessionIds(
    sessionIds: string[],
  ): TransactionableAsync<SessionMetadata[]>;
}
