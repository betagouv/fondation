import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient } from '@tanstack/react-query';

import { ArchivedSessionContext } from '@/shared/context/archived-session';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { makeSessionNominationFile } from '@/test-utils/factories/session-nomination-file.factory';
import type { DetailedSummaryDto } from '@api/types';
import { authKeys } from '@queries/auth.queries';
import { summaryKeys } from '@queries/summary.queries';

import { MagistratSummary } from './MagistratSummary';

const SESSION_ID = 'session-1';
const NOMINATION_FILE_ID = 'nomination-file';

const SG_USER = {
  civility: 'Madame BERNARD',
  firstName: 'Sophie',
  id: 'sg-1',
  isImpersonated: false,
  lastName: 'Bernard',
  role: 'ADJOINT_SECRETAIRE_GENERAL',
};

const MEMBER_USER = {
  civility: 'Monsieur PETIT',
  firstName: 'Jean',
  id: 'member-1',
  isImpersonated: false,
  lastName: 'Petit',
  role: 'MEMBRE_DU_SIEGE',
};

const READERS = [
  { firstName: 'Léa', id: 'reader-1', lastName: 'Martin' },
  { firstName: 'Paul', id: 'reader-2', lastName: 'Durand' },
];

const ATTACHMENTS = [
  { id: 'attachment-1', name: 'PV - 01/06/2026 - Commission.pdf', type: 'application/pdf' },
  { id: 'attachment-2', name: 'entretien-camille-durand.docx', type: 'application/msword' },
  { id: 'attachment-3', name: 'organigramme-juridiction.png', type: 'image/png' },
];

const LONG_CONTENT = [
  '<p>Magistrate au parcours confirmé dont la candidature est portée par une expérience solide en juridiction, sur des fonctions civiles comme pénales.</p>',
  '<p>Elle a exercé successivement comme juge d’instance, juge des contentieux de la protection puis vice-présidente, en administrant plusieurs services et en encadrant des équipes de greffe.</p>',
  '<p>Les observations reçues soulignent une grande rigueur, un sens de l’écoute et une capacité à conduire des projets de juridiction, tout en maintenant une charge d’audiencement élevée.</p>',
].join('');

const VIEWS = ['sg', 'member'] as const;
type View = (typeof VIEWS)[number];

function makeSummaryDetail(props: {
  isArchived: boolean;
  summary: Partial<DetailedSummaryDto['summary']>;
}): DetailedSummaryDto {
  return {
    biography: '',
    birthDate: null,
    auditionDate: null,
    auditionTime: null,
    detectedMagistratId: null,
    formation: 'SIEGE',
    grade: 'I',
    id: 'summary-1',
    isArchived: props.isArchived,
    lastPositionDate: null,
    lastRankingDate: null,
    name: 'Camille DURAND',
    number: 42,
    observations: [],
    observers: [],
    outcome: null,
    position: 'Juge au tribunal judiciaire de Lyon',
    priorities: [],
    priority: null,
    rank: null,
    sessionId: SESSION_ID,
    summary: {
      attachments: [],
      author: null,
      content:
        '<p>Magistrate au parcours confirmé dont la candidature est portée par une expérience solide en juridiction</p>',
      readers: [],
      screenshots: [],
      updatedAt: '2026-03-12',
      ...props.summary,
    },
    targetedGrade: 'HH',
    targetedPosition: 'Conseiller à la cour d’appel de Paris',
  };
}

function MagistratSummaryStory(props: {
  attachments: boolean;
  hasSummary: boolean;
  isArchived: boolean;
  longText: boolean;
  readers: boolean;
  view: View;
}) {
  const user = props.view === 'sg' ? SG_USER : MEMBER_USER;
  const nominationFile = makeSessionNominationFile({
    id: NOMINATION_FILE_ID,
    summary: props.hasSummary ? { id: 'summary-1', canRead: true, canWrite: props.view === 'sg' } : null,
  });

  const seed = (client: QueryClient) => {
    client.setQueryData(authKeys.introspectSession(), user);
    if (props.hasSummary) {
      client.setQueryData(
        summaryKeys.detailsSummary({ sessionId: SESSION_ID, nominationFileId: NOMINATION_FILE_ID }),
        makeSummaryDetail({
          isArchived: props.isArchived,
          summary: {
            attachments: props.attachments ? ATTACHMENTS : [],
            author:
              props.view === 'sg'
                ? { firstName: SG_USER.firstName, id: SG_USER.id, lastName: SG_USER.lastName }
                : { firstName: 'Sophie', id: 'sg-1', lastName: 'Bernard' },
            readers: props.readers ? READERS : [],
            ...(props.longText ? { content: LONG_CONTENT } : {}),
          },
        }),
      );
    }
  };

  return (
    <StoryQueryClient
      key={`${props.view}-${props.hasSummary}-${props.readers}-${props.attachments}`}
      seed={seed}
    >
      <ArchivedSessionContext value={{ isArchived: props.isArchived, setIsArchived: () => {} }}>
        <MagistratSummary nominationFile={nominationFile} sessionId={SESSION_ID} />
      </ArchivedSessionContext>
    </StoryQueryClient>
  );
}

const meta = {
  title: 'Features/SidePanel/MagistratSummary',
  component: MagistratSummaryStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    attachments: { control: 'boolean' },
    hasSummary: { control: 'boolean' },
    isArchived: { control: 'boolean' },
    longText: { control: 'boolean' },
    readers: { control: 'boolean' },
    view: { control: 'inline-radio', options: VIEWS },
  },
  args: {
    attachments: false,
    hasSummary: true,
    isArchived: false,
    longText: false,
    readers: false,
    view: 'sg',
  },
} satisfies Meta<typeof MagistratSummaryStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Readable: Story = {};

export const LongText: Story = { args: { longText: true } };

export const Shared: Story = { args: { readers: true } };

export const WithAttachments: Story = { args: { attachments: true } };

export const SharedWithAttachments: Story = { args: { attachments: true, readers: true } };

export const Member: Story = { args: { view: 'member' } };

export const EmptySg: Story = { args: { hasSummary: false } };
