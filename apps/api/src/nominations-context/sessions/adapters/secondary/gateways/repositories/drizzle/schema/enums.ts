import { TypeDeSaisine } from 'shared-models';
import { StatutAffectation } from 'src/nominations-context/sessions/business-logic/models/affectation';
import { nominationsContextSchema } from './nominations-context-schema.drizzle';

export const typeDeSaisineEnum = nominationsContextSchema.enum(
  'type_de_saisine',
  Object.values(TypeDeSaisine) as [TypeDeSaisine, ...TypeDeSaisine[]],
);

export const statutAffectationEnum = nominationsContextSchema.enum(
  'statut_affectation',
  Object.values(StatutAffectation) as [
    StatutAffectation,
    ...StatutAffectation[],
  ],
);
