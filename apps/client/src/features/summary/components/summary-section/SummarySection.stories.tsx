import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient } from '@tanstack/react-query';

import { ArchivedSessionContext } from '@/shared/context/archived-session';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import type { DetailedSummaryDto } from '@api/types';
import { authKeys } from '@queries/auth.queries';
import { summaryKeys } from '@queries/summary.queries';

import { SummarySection } from './SummarySection';

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
  {
    addedAt: '2026-06-01T08:30:00.000Z',
    addedBy: { id: 'sg-1', name: 'Sophie BERNARD' },
    id: 'attachment-1',
    name: 'PV - 01/06/2026 - Commission.pdf',
    size: 63_365,
    type: 'application/pdf',
  },
  {
    addedAt: '2026-06-02T08:30:00.000Z',
    addedBy: { id: 'sg-1', name: 'Sophie BERNARD' },
    id: 'attachment-2',
    name: 'entretien-camille-durand.docx',
    size: 24_576,
    type: 'application/msword',
  },
  {
    addedAt: '2026-06-03T08:30:00.000Z',
    addedBy: null,
    id: 'attachment-3',
    name: 'organigramme-juridiction.png',
    size: null,
    type: 'image/png',
  },
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
    auditionDate: null,
    auditionRequired: false,
    auditionTime: null,
    biography: '',
    birthDate: null,
    canScheduleAudition: true,
    detectedMagistratId: null,
    grade: 'I',
    isArchived: props.isArchived,
    lastPositionDate: null,
    missingEvaluation: false,
    name: 'Camille DURAND',
    observers: [],
    outcome: null,
    position: 'Juge au tribunal judiciaire de Lyon',
    priorities: [],
    rank: null,
    reportersMissing: false,
    summary: {
      attachments: [],
      author: null,
      content:
        '<p>Magistrate au parcours confirmé dont la candidature est portée par une expérience solide en juridiction</p>',
      readers: [],
      screenshots: [],
      ...props.summary,
    },
    targetedGrade: 'HH',
    targetedPosition: 'Conseiller à la cour d’appel de Paris',
  };
}

function SummaryStory(props: {
  attachments: boolean;
  hasSummary: boolean;
  isArchived: boolean;
  longText: boolean;
  readers: boolean;
  view: View;
}) {
  const user = props.view === 'sg' ? SG_USER : MEMBER_USER;

  const seed = (client: QueryClient) => {
    client.setQueryData(authKeys.introspectSession(), user);
    if (props.hasSummary) {
      client.setQueryData(
        summaryKeys.detailsSummary({ nominationFileId: NOMINATION_FILE_ID, sessionId: SESSION_ID }),
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
      key={`${props.view}-${props.hasSummary}-${props.readers}-${props.attachments}-${props.isArchived}-${props.longText}`}
      seed={seed}
    >
      <ArchivedSessionContext value={{ isArchived: props.isArchived, setIsArchived: () => {} }}>
        <SummarySection
          canRead={props.hasSummary}
          hasSummary={props.hasSummary}
          nominationFileId={NOMINATION_FILE_ID}
          sessionId={SESSION_ID}
          withOpenLink
        />
      </ArchivedSessionContext>
    </StoryQueryClient>
  );
}

const meta = {
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
  component: SummaryStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  title: 'Features/SidePanel/Summary',
} satisfies Meta<typeof SummaryStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const EmptySg: Story = { args: { hasSummary: false } };

export const Member: Story = { args: { view: 'member' } };
