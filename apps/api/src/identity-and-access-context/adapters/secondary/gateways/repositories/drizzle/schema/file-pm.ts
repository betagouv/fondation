import { uuid } from 'drizzle-orm/pg-core';
import { fileTypeEnum } from './enums.drizzle';
import { identityAndAccessContextSchema } from './identity-and-access-context-schema.drizzle';

export const files = identityAndAccessContextSchema.table('files', {
  fileId: uuid('file_id').primaryKey(),
  type: fileTypeEnum('type').notNull(),
});
