import z from 'zod';

import { writerSchema } from '../../../../utils/user.util';
import { DOC_NOMINATION_FILE_OUTCOMES } from '../../shared/domain/doc-nomination-file-outcome';

import { OFFICIAL_REPORT_NOTE_OUTDATED_BY } from './official-report-types';

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
  outcome: z.enum(DOC_NOMINATION_FILE_OUTCOMES),
  text: z.string(),
});

const BlockSectionIntroSchema = z.object({
  ...AbstractHtmlBlock.shape,
  outcome: z.enum(DOC_NOMINATION_FILE_OUTCOMES),
  kind: z.literal('section-intro'),
});

/** the slot under the proposition, shared by the recusal sentence and the text written in the report */
export const OfficialReportFileNoteSchema = z.object({
  editedAt: z.iso.datetime().nullable(),
  editedBy: writerSchema,
  /** the sentence the file's recusal gives today, null without recusal */
  generatedHtml: z.string().nullable(),
  /** what the report prints under the proposition, null when nothing */
  html: z.string().nullable(),
  /** what changed since the slot was written or emptied by hand, null when nothing did */
  outdatedBy: z.enum(OFFICIAL_REPORT_NOTE_OUTDATED_BY).nullable(),
});

export type OfficialReportFileNote = z.infer<typeof OfficialReportFileNoteSchema>;

const BlockFileSchema = z.object({
  ...AbstractHtmlBlock.shape,
  kind: z.literal('file'),
  nominationFileId: z.string().nullable(),
  /** the sentence the agenda carries today, offered when the two documents part ways */
  agendaHtml: z.string().nullable(),
  /** the agenda the proposition comes from, the one place its sentence is written */
  agendaId: z.string().nullable(),
  agendaEditedAt: z.iso.datetime().nullable(),
  agendaEditedBy: writerSchema,
  editedAt: z.iso.datetime().nullable(),
  editedBy: writerSchema,
  /** the text comes from the agenda, so the report is not the one to credit for it */
  fromAgenda: z.boolean(),
  name: z.string(),
  note: OfficialReportFileNoteSchema,
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
