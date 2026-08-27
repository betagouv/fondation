import Button from '@codegouvfr/react-dsfr/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';

import { DocumentScreen } from '@/features/documents/components/DocumentScreen';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { AlertBanner } from '@/shared/ui/alert-banner';

import { AgendaDocumentEditor } from './AgendaDocumentEditor';
import type { AgendaBlock } from './blocks/agenda-blocks.type';

const SESSION_ID = '11111111-1111-1111-1111-111111111111';
const AGENDA_ID = '22222222-2222-2222-2222-222222222222';

function proposition(props: Partial<AgendaBlock> & { id: string; weight: number }): AgendaBlock {
  return {
    edited: false,
    html: 'Une proposition',
    outdated: false,
    kind: 'file',
    ...props,
  } as AgendaBlock;
}

const BLOCKS: AgendaBlock[] = [
  proposition({
    id: 'file-1',
    weight: 0,
    html: '<strong>MME Marie CURIE</strong>, actuellement juge au tribunal judiciaire de Bobigny (G2), au poste de vice-présidente au tribunal judiciaire de Créteil (G3), au rapport de MME Rosalind FRANKLIN.',
  }),
  proposition({
    id: 'file-2',
    weight: 1,
    edited: true,
    html: "<strong>MME Sophie GERMAIN</strong>, actuellement conseillère à la cour d'appel de Douai (G1), au poste de présidente de chambre à la cour d'appel d'Amiens (HH), au rapport de MME Barbara McCLINTOCK.",
  }),
  proposition({
    id: 'file-3',
    weight: 2,
    outdated: true,
    generatedHtml:
      '<strong>MME Marguerite PEREY</strong>, actuellement substitute près le tribunal judiciaire de Lille (G2), au poste de première substitute près le tribunal judiciaire de Valenciennes (G3).',
    html: '<strong>MME Marguerite PEREY</strong>, substitute près le tribunal judiciaire de Lille, au poste de première substitute près le tribunal judiciaire de Valenciennes.',
  }),
];

const meta = {
  args: { agendaId: AGENDA_ID, blocks: BLOCKS, sessionId: SESSION_ID },
  beforeEach: ({ msw }) => {
    msw.use(
      http.put(
        '*/api/docs/v1/agendas/:agendaId/blocks/files/:fileId',
        () => new HttpResponse(null, { status: 204 }),
      ),
      http.delete(
        '*/api/docs/v1/agendas/:agendaId/blocks/files/:fileId',
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
  },
  component: AgendaDocumentEditor,
  decorators: [
    (Story) => (
      <StoryQueryClient>
        <div className="fr-py-6v mx-auto w-full max-w-7xl">{Story()}</div>
      </StoryQueryClient>
    ),
  ],
  parameters: { controls: { disable: true }, layout: 'fullscreen' },
  title: 'Features/Documents/DocumentEditor/Agenda',
} satisfies Meta<typeof AgendaDocumentEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

/** the three propositions, editor alone: one untouched, one edited, one drifted */
export const AllPropositions: Story = {};

/** the third proposition drifted: its banner offers to accept or ignore the regenerated text */
export const OutdatedBlock: Story = {
  args: { blocks: BLOCKS.filter((block) => block.outdated) },
};

export const SingleBlock: Story = {
  args: { blocks: BLOCKS.slice(0, 1) },
};

function AgendaScreen(props: { blocks: readonly AgendaBlock[] }) {
  const [hasPendingRevalidation, setHasPendingRevalidation] = useState(false);

  return (
    <DocumentScreen
      actions={
        <>
          <Button iconId="ri-file-list-3-line" priority="secondary">
            Propositions
          </Button>
          <Button iconId="ri-calendar-event-line" priority="secondary">
            Métadonnées
          </Button>
          <Button disabled={hasPendingRevalidation} iconId="fr-icon-success-fill" iconPosition="right">
            Valider le document
          </Button>
        </>
      }
      notices={
        <>
          <div role="status">
            {hasPendingRevalidation && (
              <AlertBanner
                className="fr-mt-4v px-4 py-3"
                icon="fr-icon-warning-fill"
                message="Certains dossiers ont changé et doivent être validés"
                tone="warning"
              />
            )}
          </div>
          <div role="alert" />
        </>
      }
      title="Ordre du jour"
    >
      <AgendaDocumentEditor
        agendaId={AGENDA_ID}
        blocks={props.blocks}
        onPendingRevalidationChange={setHasPendingRevalidation}
        sessionId={SESSION_ID}
      />
    </DocumentScreen>
  );
}

/** no drifted block: the warning region stays empty and costs no space above the document */
export const InScreen: Story = {
  decorators: [],
  render: () => <AgendaScreen blocks={BLOCKS.filter((block) => !block.outdated)} />,
};

/** a drifted block raises the warning and disables validation, as on the real screen */
export const InScreenWithNotice: Story = {
  decorators: [],
  render: () => <AgendaScreen blocks={BLOCKS} />,
};
