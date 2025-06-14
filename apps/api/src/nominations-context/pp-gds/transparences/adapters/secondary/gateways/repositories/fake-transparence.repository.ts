import { DateOnlyJson, Magistrat, TypeDeSaisine } from 'shared-models';
import { TransparenceRepository } from 'src/nominations-context/pp-gds/transparences/business-logic/gateways/repositories/transparence.repository';
import {
  Session,
  SessionSnapshot,
} from 'src/nominations-context/sessions/business-logic/models/session';

export class FakeTransparenceRepository implements TransparenceRepository {
  fakeTransparences: Record<
    string,
    SessionSnapshot<TypeDeSaisine.TRANSPARENCE_GDS>
  > = {};

  byNomFormationEtDate(
    nom: string,
    formation: Magistrat.Formation,
    dateTransparence: DateOnlyJson,
  ) {
    return async () => {
      const key = this.generateKey(nom, formation, dateTransparence);
      const transparence = this.fakeTransparences[key];
      return transparence ? Session.fromSnapshot(transparence) : null;
    };
  }

  addFakeTransparence(
    session: SessionSnapshot<TypeDeSaisine.TRANSPARENCE_GDS>,
  ): void {
    const key = this.generateKey(
      session.name,
      session.formation,
      session.content.dateTransparence,
    );
    this.fakeTransparences[key] = session;
  }

  getFakeTransparences() {
    return Object.values(this.fakeTransparences);
  }

  private generateKey(
    nom: string,
    formation: Magistrat.Formation,
    dateTransparence: DateOnlyJson,
  ): string {
    const { year, month, day } = dateTransparence;
    return `${nom}-${formation}-${year}-${month}-${day}`;
  }
}
