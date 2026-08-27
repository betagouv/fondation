import Button from '@codegouvfr/react-dsfr/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AlertBanner } from '@/shared/ui/alert-banner';

import { agendaDocument, officialReportDocument, presentationNoticeDocument } from './document.fixture';
import { DocumentScreen } from './DocumentScreen';
import { DocumentViewer } from './DocumentViewer';

function viewer(props: { html: string; title: string }) {
  return (
    <DocumentViewer className="mx-auto w-full max-w-4xl border-0" html={props.html} title={props.title} />
  );
}

function validate() {
  return (
    <Button iconId="fr-icon-success-fill" iconPosition="right">
      Valider le document
    </Button>
  );
}

const meta = {
  component: DocumentScreen,
  parameters: { controls: { disable: true }, layout: 'fullscreen' },
  title: 'Features/Documents/DocumentScreen',
} satisfies Meta<typeof DocumentScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Agenda: Story = {
  args: {
    actions: (
      <>
        <Button iconId="ri-file-list-3-line" priority="secondary">
          Propositions
        </Button>
        <Button iconId="ri-calendar-event-line" priority="secondary">
          Métadonnées
        </Button>
        {validate()}
      </>
    ),
    children: viewer({ html: agendaDocument(), title: 'Ordre du jour' }),
    title: 'Ordre du jour',
    tone: 'alt',
  },
};

export const OfficialReport: Story = {
  args: {
    actions: (
      <>
        <Button iconId="ri-edit-fill" priority="secondary">
          Métadonnées
        </Button>
        {validate()}
      </>
    ),
    children: viewer({ html: officialReportDocument(), title: 'PV de restitution' }),
    title: 'PV de restitution',
    tone: 'alt',
  },
};

export const PresentationNotice: Story = {
  args: {
    actions: (
      <>
        <Button iconId="fr-icon-edit-line" iconPosition="left" priority="secondary">
          Éditer
        </Button>
        {validate()}
      </>
    ),
    children: viewer({ html: presentationNoticeDocument(), title: 'Notice de restitution' }),
    title: 'Notice de restitution',
    tone: 'alt',
  },
};

export const WithNotices: Story = {
  args: {
    ...Agenda.args,
    notices: (
      <>
        <AlertBanner
          className="fr-mt-4v px-4 py-3"
          icon="fr-icon-warning-fill"
          message="Certains dossiers ont changé et doivent être validés"
          tone="warning"
        />
        <AlertBanner
          className="fr-mt-4v px-4 py-3"
          icon="fr-icon-error-fill"
          message="Le service de génération PDF est indisponible. Réessayez et prévenez le support si cela persiste (code 503)."
          tone="error"
        />
      </>
    ),
  },
};
