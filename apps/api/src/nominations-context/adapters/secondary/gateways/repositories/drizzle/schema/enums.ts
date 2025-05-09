import { TypeDeSaisine } from 'src/nominations-context/business-logic/models/type-de-saisine';
import { nominationsContextSchema } from './nominations-context-schema.drizzle';

export const typeDeSaisineEnum = nominationsContextSchema.enum(
  'type_de_saisine',
  Object.values(TypeDeSaisine) as [TypeDeSaisine, ...TypeDeSaisine[]],
);
