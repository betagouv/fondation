import { Magistrat } from 'shared-models';
import { DomainRegistry } from './domain-registry';
import { TypeDeSaisine } from './type-de-saisine';

export type TransparenceSnapshot = {
  id: string;
  name: string;
  formations: Magistrat.Formation[];
  typeDeSaisine: TypeDeSaisine;
};

export class Transparence {
  private constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _formations: Magistrat.Formation[],
    private readonly _typeDeSaisine: TypeDeSaisine,
  ) {}

  get id(): string {
    return this._id;
  }

  snapshot(): TransparenceSnapshot {
    return {
      id: this._id,
      name: this._name,
      formations: this._formations,
      typeDeSaisine: this._typeDeSaisine,
    };
  }

  static nouvelle(
    typeDeSaisine: TypeDeSaisine,
    name: string,
    formations: Magistrat.Formation[],
  ) {
    const transparenceId = DomainRegistry.uuidGenerator().generate();
    return new Transparence(transparenceId, name, formations, typeDeSaisine);
  }
}
