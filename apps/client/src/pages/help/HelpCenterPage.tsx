import { FormattedMessage, useIntl } from 'react-intl';

import { HelpPageArticle } from '@/features/help/components/HelpPageArticle';
import { HelpPageUpdate } from '@/features/help/components/HelpPageUpdate';
import { PinnedHeader } from '@/shared/components/pinned-header';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { DetailsHeader } from '@/shared/ui/details';
import { useReaderHelpPageQuery } from '@queries/help.queries';

export function HelpCenterPage() {
  const { formatMessage } = useIntl();
  const { data, isError } = useReaderHelpPageQuery();

  return (
    <PinnedHeader
      bar={(isPinned) => (
        <div className={`fr-container fr-pb-5v ${isPinned ? 'fr-pt-6v' : 'fr-pt-8v'}`}>
          <DetailsHeader
            action={
              <div className="flex flex-wrap items-center gap-4">
                {data && <HelpPageUpdate helpPage={data} />}
              </div>
            }
            backTo="/"
            breadcrumb={
              <Breadcrumb
                ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane du centre d'aide" })}
                breadcrumb={{
                  currentPageLabel: formatMessage({ defaultMessage: "Centre d'aide" }),
                  segments: [{ label: formatMessage({ defaultMessage: 'Accueil' }), to: '/' }],
                }}
                className="fr-mt-0"
                id="help-center-breadcrumb"
              />
            }
            title={<FormattedMessage defaultMessage="Centre d'aide" />}
          />
        </div>
      )}
      barClassName="border-b border-(--border-default-grey)"
      className="grow"
      contentClassName="flex grow flex-col"
    >
      <div className="fr-container fr-py-6v fr-pb-10v grow">
        <HelpPageArticle helpPage={data} isError={isError} />
      </div>
    </PinnedHeader>
  );
}
