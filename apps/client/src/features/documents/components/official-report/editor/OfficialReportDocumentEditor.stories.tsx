import Button from '@codegouvfr/react-dsfr/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';

import { DocumentScreen } from '@/features/documents/components/DocumentScreen';
import { StoryQueryClient } from '@/shared/storybook/StoryQueryClient';
import { AlertBanner } from '@/shared/ui/alert-banner';

import type { OfficialReportBlock } from './blocks/official-report-blocks.type';
import { OfficialReportDocumentEditor } from './OfficialReportDocumentEditor';

const SESSION_ID = '11111111-1111-1111-1111-111111111111';
const OFFICIAL_REPORT_ID = '33333333-3333-3333-3333-333333333333';

const BLOCKS = [
  {
    edited: false,
    html: "La commission s'est réunie le 12 mars 2028 sous la présidence de MME Marie CURIE.",
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
    edited: false,
    html: '<strong>MME Marie CURIE</strong>, actuellement juge au tribunal judiciaire de Bobigny (G2), au poste de vice-présidente au tribunal judiciaire de Créteil (G3).',
    kind: 'file',
    nominationFileId: 'file-1',
    outdated: false,
    weight: 3,
  },
  {
    edited: true,
    html: "<strong>MME Sophie GERMAIN</strong>, actuellement conseillère à la cour d'appel de Douai (G1), au poste de présidente de chambre à la cour d'appel d'Amiens (HH).",
    kind: 'file',
    nominationFileId: 'file-2',
    outdated: false,
    weight: 4,
  },
  {
    edited: false,
    generatedHtml:
      '<strong>MME Marguerite PEREY</strong>, actuellement substitute près le tribunal judiciaire de Lille (G2), au poste de première substitute près le tribunal judiciaire de Valenciennes (G3).',
    html: '<strong>MME Marguerite PEREY</strong>, substitute près le tribunal judiciaire de Lille.',
    kind: 'file',
    nominationFileId: 'file-3',
    outdated: true,
    weight: 5,
  },
  {
    edited: false,
    html: 'La séance est levée à dix-huit heures.',
    kind: 'conclusion',
    outdated: false,
    weight: 6,
  },
] as OfficialReportBlock[];

function OfficialReportScreen(props: { blocks: readonly OfficialReportBlock[] }) {
  const [hasPendingRevalidation, setHasPendingRevalidation] = useState(false);

  return (
    <DocumentScreen
      actions={
        <>
          <Button iconId="ri-edit-fill" priority="secondary">
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
                message="Certains dossiers ont changé d'issue ou de rapporteurs et doivent être validés"
                tone="warning"
              />
            )}
          </div>
          <div role="alert" />
        </>
      }
      title="PV de restitution"
    >
      <OfficialReportDocumentEditor
        blocks={props.blocks}
        officialReportId={OFFICIAL_REPORT_ID}
        onPendingRevalidationChange={setHasPendingRevalidation}
        sessionId={SESSION_ID}
      />
    </DocumentScreen>
  );
}

const meta = {
  args: { blocks: BLOCKS, officialReportId: OFFICIAL_REPORT_ID, sessionId: SESSION_ID },
  beforeEach: ({ msw }) => {
    msw.use(
      http.put('*/api/docs/v1/official-reports/:id/blocks/*', () => new HttpResponse(null, { status: 204 })),
      http.delete(
        '*/api/docs/v1/official-reports/:id/blocks/*',
        () => new HttpResponse(null, { status: 204 }),
      ),
    );
  },
  component: OfficialReportDocumentEditor,
  decorators: [
    (Story) => (
      <StoryQueryClient>
        <div className="fr-py-6v mx-auto w-full max-w-7xl">{Story()}</div>
      </StoryQueryClient>
    ),
  ],
  parameters: { controls: { disable: true }, layout: 'fullscreen' },
  title: 'Features/Documents/DocumentEditor/OfficialReport',
} satisfies Meta<typeof OfficialReportDocumentEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

/** the five kinds at once, editor alone: intro, section title, section intro, files, conclusion */
export const EveryBlockKind: Story = {};

/** no drifted block, so validation stays available */
export const InScreen: Story = {
  decorators: [],
  render: () => <OfficialReportScreen blocks={BLOCKS.filter((block) => !block.outdated)} />,
};

/** a drifted file raises the warning and disables validation */
export const InScreenWithNotice: Story = {
  decorators: [],
  render: () => <OfficialReportScreen blocks={BLOCKS} />,
};
