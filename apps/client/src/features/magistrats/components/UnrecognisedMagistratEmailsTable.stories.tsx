import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import { ConfirmModalProvider } from '@/shared/context/confirm-modal';
import { STORY_USERS } from '@/shared/storybook/story-users';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { ToastProvider } from '@/shared/ui/toast';
import type { ListedUnrecognisedMagistratEmailsDto, SearchMagistratsResponseDto } from '@api/types';
import { authKeys } from '@queries/auth.queries';

import { UnrecognisedMagistratEmailsTable } from './UnrecognisedMagistratEmailsTable';

const EMAILS: ListedUnrecognisedMagistratEmailsDto['items'] = [
  { email: 'claire.fontaine@diplomatie.gouv.fr', id: 'email-1', lastAttemptAt: '2026-11-26T09:12:00.000Z' },
  { email: 'p.martin@justice.fr', id: 'email-2', lastAttemptAt: '2026-11-24T16:40:00.000Z' },
  { email: 'helene.garnier@gmail.com', id: 'email-3', lastAttemptAt: '2026-11-03T08:05:00.000Z' },
];

const MAGISTRATS: SearchMagistratsResponseDto['items'] = [
  {
    currentPosition: {
      function: { id: 'PR', label: 'Procureur de la République' },
      jurisdiction: { id: 'TJ  LYON', label: 'Tribunal judiciaire de Lyon' },
    },
    firstName: 'Claire',
    grade: 'I',
    gradeAndJurisdiction: 'I - Tribunal judiciaire de Lyon',
    id: 'magistrat-1',
    lastName: 'FONTAINE',
    name: 'Claire FONTAINE',
    status: 'ACTIVE',
    usedName: null,
  },
  {
    currentPosition: null,
    firstName: 'Claude',
    grade: 'HH',
    gradeAndJurisdiction: null,
    id: 'magistrat-2',
    lastName: 'FONTANA',
    name: 'Claude FONTANA',
    status: 'INACTIVE',
    usedName: null,
  },
];

function UnrecognisedMagistratEmailsTableStory(props: {
  attachRefused: boolean;
  dismissFails: boolean;
  empty: boolean;
  loadFails: boolean;
  nextPageFails: boolean;
}) {
  return (
    <StoryQueryClient
      key={JSON.stringify(props)}
      seed={(client) => client.setQueryData(authKeys.introspectSession(), STORY_USERS.sg)}
    >
      <ToastProvider>
        <ConfirmModalProvider>
          <div className="fr-container fr-my-6v">
            <UnrecognisedMagistratEmailsTable />
          </div>
        </ConfirmModalProvider>
      </ToastProvider>
    </StoryQueryClient>
  );
}

const meta = {
  args: { attachRefused: false, dismissFails: false, empty: false, loadFails: false, nextPageFails: false },
  argTypes: {
    attachRefused: {
      control: 'boolean',
      description: "Le rattachement est refusé comme pour un magistrat qui n'est plus en activité.",
    },
    dismissFails: { control: 'boolean', description: "L'écartement répond par une erreur." },
    empty: {
      control: 'boolean',
      description: 'Le site du CSM a reconnu toutes les adresses ces 30 derniers jours.',
    },
    loadFails: { control: 'boolean', description: 'La liste répond par une erreur.' },
    nextPageFails: {
      control: 'boolean',
      description: 'La première page arrive puis la suivante répond par une erreur.',
    },
  },
  beforeEach: ({ args, msw }) => {
    let emails = args.empty ? [] : EMAILS;
    const handle = (id: unknown) => {
      emails = emails.filter((email) => email.id !== id);
      return new HttpResponse(null, { status: 204 });
    };
    msw.use(
      http.get('*/api/magistrats/v1/unrecognised-emails', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page'));
        if (args.loadFails || (args.nextPageFails && page > 1))
          return new HttpResponse(null, { status: 500 });

        return HttpResponse.json<ListedUnrecognisedMagistratEmailsDto>({
          currentPageIndex: page,
          items: emails,
          nextPageIndex: args.nextPageFails ? page + 1 : undefined,
          totalCount: args.nextPageFails ? emails.length + 1 : emails.length,
        });
      }),
      http.get('*/api/magistrats/v1', () =>
        HttpResponse.json<SearchMagistratsResponseDto>({
          currentPageIndex: 1,
          items: MAGISTRATS,
          totalCount: MAGISTRATS.length,
        }),
      ),
      http.post('*/api/magistrats/v1/unrecognised-emails/:id/attachment', ({ params }) =>
        args.attachRefused
          ? HttpResponse.json(
              { validationError: "Une adresse ne peut être rattachée qu'à un magistrat en activité" },
              { status: 400 },
            )
          : handle(params.id),
      ),
      http.delete('*/api/magistrats/v1/unrecognised-emails/:id', ({ params }) =>
        args.dismissFails ? new HttpResponse(null, { status: 500 }) : handle(params.id),
      ),
    );
  },
  component: UnrecognisedMagistratEmailsTableStory,
  parameters: {
    docs: {
      description: {
        component:
          "Les adresses que le site du CSM n'a pas pu rattacher à un magistrat ces 30 derniers jours. La plus récente vient en premier. Rattacher ouvre la recherche d'un magistrat que le site reconnaîtra ensuite à cette adresse. Écarter retire l'adresse après confirmation jusqu'à la prochaine demande du site.",
      },
    },
    layout: 'fullscreen',
  },
  title: 'Session/CSM/UnrecognisedEmails/UnrecognisedMagistratEmailsTable',
} satisfies Meta<typeof UnrecognisedMagistratEmailsTableStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
