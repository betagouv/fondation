import { useIntl } from 'react-intl';

import { useBreadcrumbRoot } from '@/shared/hooks/useBreadcrumbRoot';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';

function CsmUpcomingPage(props: { title: string }) {
  const { formatMessage } = useIntl();
  const breadcrumbRoot = useBreadcrumbRoot();

  return (
    <div className="fr-container fr-pb-8v">
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane du pouvoir de proposition CSM" })}
        breadcrumb={{ currentPageLabel: props.title, segments: breadcrumbRoot }}
        className="fr-mt-8v fr-mb-0"
        id="csm-upcoming-breadcrumb"
      />
      <h1 className="fr-h3 fr-mt-6v fr-mb-6v">{props.title}</h1>
      <p className="fr-mb-0 italic">{formatMessage({ defaultMessage: 'À venir' })}</p>
    </div>
  );
}

export function CallsForApplicationsPage() {
  const { formatMessage } = useIntl();
  return <CsmUpcomingPage title={formatMessage({ defaultMessage: 'Appels à candidature' })} />;
}

export function SelectionProcessPage() {
  const { formatMessage } = useIntl();
  return <CsmUpcomingPage title={formatMessage({ defaultMessage: 'Processus de sélection' })} />;
}

export function CsmMembersPage() {
  const { formatMessage } = useIntl();
  return <CsmUpcomingPage title={formatMessage({ defaultMessage: 'Membres' })} />;
}
