import { useIntl } from 'react-intl';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { Card } from '@/shared/ui/card';
import { PageContentLayout } from '@/shared/ui/PageContentLayout';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

export const SecretariatGeneralPage = () => {
  const { formatMessage } = useIntl();

  return (
    <PageContentLayout>
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane du secrétariat général" })}
        breadcrumb={{
          currentPageLabel: formatMessage({ defaultMessage: 'Tableau de bord' }),
          segments: [
            { label: formatMessage({ defaultMessage: 'Secrétariat général' }), to: ROUTE_PATHS.SG.DASHBOARD },
          ],
        }}
        id="sg-dashboard-breadcrumb"
      />
      <h1 className="fr-h3">{formatMessage({ defaultMessage: 'Tableau de bord' })}</h1>
      <section>
        <Card
          className="max-w-78.5"
          description={formatMessage({
            defaultMessage:
              'Renseignez les premières informations à votre disposition concernant une nouvelle transparence.',
          })}
          linkProps={{
            to: ROUTE_PATHS.SG.NEW_TRANSPARENCE,
          }}
          title={formatMessage({ defaultMessage: 'Créer une nouvelle transparence' })}
        />
      </section>
    </PageContentLayout>
  );
};
