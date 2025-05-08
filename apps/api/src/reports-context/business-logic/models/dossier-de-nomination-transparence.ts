import { Magistrat } from 'shared-models';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';

export class DossierDeNominationTransparence {
  private constructor(
    private _dossierDeNominationId: string,
    private readonly _sessionId: string,
    private _folderNumber: number | null,
    private readonly _biography: string | null,
    private readonly _dueDate: DateOnly | null,
    private readonly _name: string,
    private readonly _birthDate: DateOnly,
    private readonly _grade: Magistrat.Grade,
    private readonly _currentPosition: string,
    private readonly _targettedPosition: string,
    private readonly _rank: string,
    private _observers: string[] | null,
  ) {}

  static créer({
    dossierDeNominationId,
    sessionId,
    folderNumber,
    biography,
    dueDate,
    name,
    birthDate,
    grade,
    currentPosition,
    targettedPosition,
    rank,
    observers,
  }: {
    dossierDeNominationId: string;
    sessionId: string;
    folderNumber: number | null;
    biography: string | null;
    dueDate: DateOnly | null;
    name: string;
    birthDate: DateOnly;
    grade: Magistrat.Grade;
    currentPosition: string;
    targettedPosition: string;
    rank: string;
    observers: string[] | null;
  }): DossierDeNominationTransparence {
    return new DossierDeNominationTransparence(
      dossierDeNominationId,
      sessionId,
      folderNumber,
      biography,
      dueDate,
      name,
      birthDate,
      grade,
      currentPosition,
      targettedPosition,
      rank,
      observers
        ? observers.map((observer) => observer.trim()).filter(Boolean)
        : null,
    );
  }
}
