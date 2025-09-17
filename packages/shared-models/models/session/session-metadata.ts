import type { DateOnlyJson } from "../date";
import type { Magistrat } from "../magistrat.namespace";
import type { TypeDeSaisine } from "../type-de-saisine.enum";

export interface SessionMetadataSnapshot {
  sessionId: string;
  sessionImportId: string;
  name: string;
  formation: Magistrat.Formation;
  dateTransparence: DateOnlyJson;
  dateEcheance: DateOnlyJson | null;
  typeDeSaisine: TypeDeSaisine;
}

export class SessionMetadata {
  constructor(
    private readonly _sessionId: string,
    private readonly _sessionImportId: string,
    private readonly _name: string,
    private readonly _formation: Magistrat.Formation,
    private readonly _dateTransparence: DateOnlyJson,
    private readonly _dateEcheance: DateOnlyJson | null,
    private readonly _typeDeSaisine: TypeDeSaisine,
  ) {
  }

  get sessionId(): string {
    return this._sessionId;
  }

  get sessionImportId(): string {
    return this._sessionImportId;
  }

  get name(): string {
    return this._name;
  }

  get formation(): Magistrat.Formation {
    return this._formation;
  }

  get dateTransparence(): DateOnlyJson {
    return this._dateTransparence;
  }

  get dateEcheance(): DateOnlyJson | null {
    return this._dateEcheance;
  }

  snapshot(): SessionMetadataSnapshot {
    return {
      sessionId: this._sessionId,
      sessionImportId: this._sessionImportId,
      name: this._name,
      formation: this._formation,
      dateTransparence: this._dateTransparence,
      dateEcheance: this._dateEcheance,
      typeDeSaisine: this._typeDeSaisine,
    };
  }

  static fromSnapshot(snapshot: SessionMetadataSnapshot): SessionMetadata {
    return new SessionMetadata(
      snapshot.sessionId,
      snapshot.sessionImportId,
      snapshot.name,
      snapshot.formation,
      snapshot.dateTransparence,
      snapshot.dateEcheance,
      snapshot.typeDeSaisine,
    );
  }
}
