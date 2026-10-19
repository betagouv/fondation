import { DOCUMENT_VALIDATION } from '@/shared/storybook/document-lifecycles.fixtures';
import { STORY_AUTHORS } from '@/shared/storybook/story-users';
import type { DetailedAgendaDocumentBlocksDto, DetailedOfficialReportDocumentDto } from '@api/types';

type AgendaBlock = DetailedAgendaDocumentBlocksDto['blocks'][number];
type OfficialReportBlock = DetailedOfficialReportDocumentDto['blocks'][number];

/** what the reader did to the blocks: the API only marks a rewritten block as outdated */
export type BlocksState = { outdated: boolean; rewritten: boolean };

const EDITION = { editedAt: '2026-09-24T14:02:00.000Z', editedBy: STORY_AUTHORS.sg };
const NO_EDITION = { editedAt: null, editedBy: null };

const CURIE =
  '<strong>MME Marie CURIE</strong>, actuellement juge au tribunal judiciaire de Bobigny (G2), au poste de vice-présidente au tribunal judiciaire de Créteil (G3)';
const GERMAIN =
  "<strong>MME Sophie GERMAIN</strong>, actuellement conseillère à la cour d'appel de Douai (G1), au poste de présidente de chambre à la cour d'appel d'Amiens (HH)";
const GERMAIN_REWRITTEN =
  "<strong>MME Sophie GERMAIN</strong>, conseillère à la cour d'appel de Douai, au poste de présidente de chambre à la cour d'appel d'Amiens";
const PEREY =
  '<strong>MME Marguerite PEREY</strong>, actuellement substitute près le tribunal judiciaire de Lille (G2), au poste de première substitute près le tribunal judiciaire de Valenciennes (G3)';
const PEREY_REWRITTEN =
  '<strong>MME Marguerite PEREY</strong>, substitute près le tribunal judiciaire de Lille, au poste de première substitute près le tribunal judiciaire de Valenciennes';

function agendaBlock(
  props: BlocksState & {
    generatedHtml: string;
    html: string;
    id: string;
    reporters: string[];
    weight: number;
  },
): AgendaBlock {
  return {
    ...(props.rewritten ? EDITION : NO_EDITION),
    edited: props.rewritten,
    generatedHtml: props.generatedHtml,
    html: props.rewritten ? props.html : props.generatedHtml,
    id: props.id,
    kind: 'file',
    nominationFileId: `file-${props.id}`,
    // the reporters changed since the rewrite
    outdated: props.rewritten && props.outdated,
    reporters: props.reporters,
    weight: props.weight,
  };
}

export function agendaBlocks(state: BlocksState): AgendaBlock[] {
  return [
    agendaBlock({
      generatedHtml: `${CURIE}, au rapport de MME Rosalind FRANKLIN.`,
      html: `${CURIE}, au rapport de MME Rosalind FRANKLIN.`,
      id: '1',
      outdated: false,
      reporters: ['MME Rosalind FRANKLIN'],
      rewritten: false,
      weight: 0,
    }),
    agendaBlock({
      ...state,
      generatedHtml: `${GERMAIN}, au rapport de MME Ada LOVELACE.`,
      html: `${GERMAIN}, au rapport de MME Barbara McCLINTOCK.`,
      id: '2',
      reporters: ['MME Ada LOVELACE'],
      weight: 1,
    }),
    agendaBlock({
      ...state,
      generatedHtml: `${PEREY}.`,
      html: `${PEREY_REWRITTEN}.`,
      id: '3',
      reporters: [],
      weight: 2,
    }),
  ];
}

const AGENDA_SOURCE = {
  agendaEditedAt: null,
  agendaEditedBy: null,
  agendaHtml: null,
  agendaId: 'agenda-1',
  fromAgenda: false,
} as const;

export function officialReportBlocks(state: BlocksState): OfficialReportBlock[] {
  return [
    {
      edited: false,
      generatedHtml: "La commission s'est réunie le 3 mars 2026 sous la présidence de MME Marie CURIE.",
      html: "La commission s'est réunie le 3 mars 2026 sous la présidence de MME Marie CURIE.",
      kind: 'intro',
      outdated: false,
      weight: 0,
    },
    {
      edited: false,
      kind: 'section-title',
      outcome: 'VALIDATED',
      outdated: false,
      text: 'Propositions validées',
      weight: 1,
    },
    {
      edited: false,
      html: 'Les propositions suivantes ont recueilli un avis favorable.',
      kind: 'section-intro',
      outcome: 'VALIDATED',
      outdated: false,
      weight: 2,
    },
    {
      ...AGENDA_SOURCE,
      ...NO_EDITION,
      edited: false,
      generatedHtml: `${CURIE}.`,
      html: `${CURIE}.`,
      kind: 'file',
      nominationFileId: 'file-1',
      outdated: false,
      weight: 3,
    },
    // rewritten in the agenda: the report follows its sentence
    {
      ...(state.rewritten ? EDITION : NO_EDITION),
      agendaEditedAt: state.rewritten ? DOCUMENT_VALIDATION.at : null,
      agendaEditedBy: state.rewritten ? DOCUMENT_VALIDATION.by : null,
      agendaHtml: state.rewritten ? `${GERMAIN_REWRITTEN}.` : `${GERMAIN}.`,
      agendaId: 'agenda-1',
      edited: state.rewritten,
      fromAgenda: state.rewritten,
      generatedHtml: `${GERMAIN}.`,
      html: state.rewritten ? `${GERMAIN_REWRITTEN}.` : `${GERMAIN}.`,
      kind: 'file',
      nominationFileId: 'file-2',
      outdated: false,
      weight: 4,
    },
    {
      ...AGENDA_SOURCE,
      ...(state.rewritten ? EDITION : NO_EDITION),
      edited: state.rewritten,
      generatedHtml: `${PEREY}.`,
      html: state.rewritten ? `${PEREY_REWRITTEN}.` : `${PEREY}.`,
      kind: 'file',
      nominationFileId: 'file-3',
      outdated: state.rewritten && state.outdated,
      weight: 5,
    },
    {
      edited: false,
      generatedHtml: 'La séance est levée à douze heures.',
      html: 'La séance est levée à douze heures.',
      kind: 'conclusion',
      outdated: false,
      weight: 1e6,
    },
  ];
}
