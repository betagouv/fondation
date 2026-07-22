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
