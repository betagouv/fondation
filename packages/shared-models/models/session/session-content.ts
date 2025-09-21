import type { DateOnlyJson } from "../date";
import { Magistrat } from "../magistrat.namespace";
import { TypeDeSaisine } from "../type-de-saisine.enum";

export type SessionContent<S extends TypeDeSaisine | unknown = unknown> =
  S extends TypeDeSaisine.TRANSPARENCE_GDS
    ? {
        dateTransparence: DateOnlyJson;
        dateClôtureDélaiObservation: DateOnlyJson;
      }
    : object;

export type SessionSnapshot<S extends TypeDeSaisine | unknown = unknown> = {
  id: string;
  sessionImportéeId: string;
  name: string;
  formation: Magistrat.Formation;
  typeDeSaisine: TypeDeSaisine;
  version: number;
  content: SessionContent<S>;
};