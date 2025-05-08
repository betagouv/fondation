import { Magistrat } from 'shared-models';

export class Transparence {
  private constructor(
    private _id: string,
    private _sessionId: string,
    private _rapporteurId: string,
    private _formation: Magistrat.Formation,
    private _name: string,
  ) {}

  static instance({
    id,
    sessionId,
    rapporteurId,
    name,
    formation,
  }: {
    id: string;
    sessionId: string;
    rapporteurId: string;
    name: string;
    formation: Magistrat.Formation;
  }): Transparence {
    return new Transparence(id, sessionId, rapporteurId, formation, name);
  }
}
