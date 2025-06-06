export class DossierDeNomination {
  private constructor(
    private readonly _dossierDeNominationId: string,
    private readonly _sessionName: string,
    private readonly _nomAspirant: string,
  ) {}

  get nomAspirant(): string {
    return this._nomAspirant;
  }
  get sessionName(): string {
    return this._sessionName;
  }

  static créer({
    dossierDeNominationId,
    nomSession,
    nomAspirant,
  }: {
    dossierDeNominationId: string;
    nomSession: string;
    nomAspirant: string;
  }) {
    return new DossierDeNomination(
      dossierDeNominationId,
      nomSession,
      nomAspirant,
    );
  }
}
