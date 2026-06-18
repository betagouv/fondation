import type { FC } from 'react';

import { SECRETARIAT_GENERAL_ANCHOR_ATTRIBUTES } from '../../constants/sg-anchor-attributes';
import { ROUTE_PATHS } from '../../utils/route-path.utils';
import { getSgBreadCrumb } from '../../utils/sg-breadcrumb.utils';
import { Breadcrumb } from '../shared/Breadcrumb';
import { Card } from '../shared/Card';
import { PageContentLayout } from '../shared/PageContentLayout';

const Dashboard: FC = () => {
  const breadcrumb = getSgBreadCrumb(ROUTE_PATHS.SG.DASHBOARD);

  return (
    <PageContentLayout>
      <Breadcrumb
        id="sg-dashboard-breadcrumb"
        ariaLabel="Fil d'Ariane du secrétariat général"
        breadcrumb={breadcrumb}
      />
      <h1>Tableau de bord</h1>
      <section>
        <Card
          className="max-w-78.5"
          title="Créer une nouvelle transparence"
          description="Renseignez les premières informations à votre disposition concernant une nouvelle transparence."
          linkProps={{
            to: SECRETARIAT_GENERAL_ANCHOR_ATTRIBUTES.nouvelleTransparence,
          }}
        />
      </section>
    </PageContentLayout>
  );
};

export default Dashboard;
