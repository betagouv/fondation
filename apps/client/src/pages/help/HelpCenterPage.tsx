import { FormattedMessage, useIntl } from 'react-intl';

import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { HelpPageArticle } from '@/features/help/components/HelpPageArticle';
import { PinnedHeader } from '@/shared/components/pinned-header';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { DetailsHeader } from '@/shared/ui/details';
import { type HelpPageEnum, useHelpPageQuery } from '@queries/help.queries';

export function HelpCenterPage() {
  const { formatDate, formatMessage, formatTime } = useIntl();
  const page: HelpPageEnum = useIsSg() ? 'SECRETARIAT_GENERAL' : 'MEMBRE';
  const { data } = useHelpPageQuery({ page });

  return (
    <PinnedHeader
      bar={(isPinned) => (
        <div className={`fr-container fr-pb-5v ${isPinned ? 'fr-pt-6v' : 'fr-pt-8v'}`}>
          <DetailsHeader
            action={
              <div className="flex flex-wrap items-center gap-4">
                {data?.updatedBy && (
                  <p className="fr-hint-text fr-mb-0">
                    <FormattedMessage
                      defaultMessage="Mise à jour le {date} à {time} par {name}"
                      values={{
                        date: formatDate(data.updatedAt, { format: 'zonedDateShort' }),
                        name: data.updatedBy.name,
                        time: formatTime(data.updatedAt, { format: 'zonedTimeShort' }),
                      }}
                    />
                  </p>
                )}
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
        <HelpPageArticle page={page} />
      </div>
    </PinnedHeader>
  );
}
