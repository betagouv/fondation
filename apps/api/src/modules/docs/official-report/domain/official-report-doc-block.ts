import z from 'zod';

import { DocNominationFileOutcomeEnum } from 'src/modules/docs/shared/domain/doc-nomination-file-outcome';

const AbstractDocBlock = z.object({
  weight: z.number().int().gte(0),
  edited: z.boolean(),
  outdated: z.boolean(),
  generatedHtml: z.string().optional(),
});

const AbstractHtmlBlock = z.object({ ...AbstractDocBlock.shape, html: z.string() });

const BlockIntroSchema = z.object({
  ...AbstractHtmlBlock.shape,
  kind: z.literal('intro'),
});

const BlockSectionTitleSchema = z.object({
  ...AbstractDocBlock.shape,
  kind: z.literal('section-title'),
  outcome: z.enum(DocNominationFileOutcomeEnum),
  text: z.string(),
});

const BlockSectionIntroSchema = z.object({
  ...AbstractHtmlBlock.shape,
  outcome: z.enum(DocNominationFileOutcomeEnum),
  kind: z.literal('section-intro'),
});

const BlockFileSchema = z.object({
  ...AbstractHtmlBlock.shape,
  kind: z.literal('file'),
  nominationFileId: z.string().nullable(),
  /** the sentence the agenda carries today, offered when the two documents part ways */
  agendaHtml: z.string().nullable(),
  /** the agenda the proposition comes from, the one place its sentence is written */
  agendaId: z.string().nullable(),
  agendaEditedAt: z.iso.datetime().nullable(),
  agendaEditedBy: z.object({ id: z.string(), name: z.string() }).nullable(),
  editedAt: z.iso.datetime().nullable(),
  editedBy: z.object({ id: z.string(), name: z.string() }).nullable(),
  /** the text comes from the agenda, so the report is not the one to credit for it */
  fromAgenda: z.boolean(),
});

const BlockConclusionSchema = z.object({
  ...AbstractHtmlBlock.shape,
  kind: z.literal('conclusion'),
});

export const DocBlockSchema = z.discriminatedUnion('kind', [
  BlockIntroSchema,
  BlockSectionTitleSchema,
  BlockSectionIntroSchema,
  BlockFileSchema,
  BlockConclusionSchema,
]);

export type DocBlock = z.infer<typeof DocBlockSchema>;
