import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { Card } from '@/shared/ui/card';
import { PageContentLayout } from '@/shared/ui/PageContentLayout';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { getSgBreadCrumb } from '@/utils/sg-breadcrumb.utils';

export const SecretariatGeneralPage = () => {
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
            to: ROUTE_PATHS.SG.NOUVELLE_TRANSPARENCE,
          }}
        />
      </section>
    </PageContentLayout>
  );
};
