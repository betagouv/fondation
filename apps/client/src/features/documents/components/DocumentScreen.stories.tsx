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

function validate(label: string) {
  return <Button>{label}</Button>;
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
        <Button priority="secondary">Modifier les données</Button>
        <Button priority="secondary">Modifier les propositions</Button>
        <Button priority="secondary">Éditer le texte</Button>
        <Button priority="secondary">Revenir à la version validée</Button>
        {validate("Valider l'ODJ")}
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
        <Button priority="secondary">Modifier les données</Button>
        <Button priority="secondary">Éditer le texte</Button>
        {validate('Valider le PV')}
      </>
    ),
    children: viewer({ html: officialReportDocument(), title: 'Procès-verbal' }),
    title: 'Procès-verbal',
    tone: 'alt',
  },
};

export const PresentationNotice: Story = {
  args: {
    actions: (
      <>
        <Button priority="secondary">Modifier les données</Button>
        <Button priority="secondary">Éditer le texte</Button>
        {validate('Valider le document')}
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
          className="justify-center px-4 py-3 text-center"
          icon="fr-icon-info-fill"
          message="Les rapporteurs de 2 propositions ont changé depuis la réécriture de leur texte"
          tone="info"
        />
        <AlertBanner
          className="justify-center px-4 py-3"
          icon="fr-icon-error-fill"
          message="Le service de génération PDF est indisponible. Réessayez et prévenez le support si cela persiste (code 503)."
          tone="error"
        />
      </>
    ),
  },
};
