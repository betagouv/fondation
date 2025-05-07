import { FC } from "react";
import { useAppSelector } from "../../../../reports/adapters/primary/hooks/react-redux";
import {
  BreadcrumCurrentPage,
  selectBreadcrumb,
} from "../../../../router/adapters/selectors/selectBreadcrumb";
import { selectSecretariatGeneralAnchorAttributes } from "../../../../router/adapters/selectors/selectSecretariatGeneralAnchorAttributes";
import { Breadcrumb } from "../../../../shared-kernel/adapters/primary/react/Breadcrumb";
import { Card } from "../../../../shared-kernel/adapters/primary/react/Card";
import { PageContentLayout } from "../../../../shared-kernel/adapters/primary/react/PageContentLayout";

const Dashboard: FC = () => {
  const currentPage = {
    name: BreadcrumCurrentPage.secretariatGeneral,
  } as const;
  const breadcrumb = useAppSelector((state) =>
    selectBreadcrumb(state, currentPage),
  );

  const { getNouvelleTransparenceAnchorAttributes } = useAppSelector(
    selectSecretariatGeneralAnchorAttributes,
  );
  const anchorAttributes = getNouvelleTransparenceAnchorAttributes();

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
          className="max-w-[314px]"
          title="Créer une nouvelle transparence"
          description="Renseignez les premières informations à votre disposition concernant une nouvelle transparence."
          linkProps={{
            ...anchorAttributes,
          }}
        />
      </section>
    </PageContentLayout>
  );
};

export default Dashboard;
