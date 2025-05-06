import { FC } from "react";
import { Card } from "../../../../shared-kernel/adapters/primary/react/Card";
import { PageContentLayout } from "../../../../shared-kernel/adapters/primary/react/PageContentLayout";
import { SgNouvelleTransparence } from "./SgNouvelleTransparence/SgNouvelleTransparence";
import {
  BreadcrumCurrentPage,
  selectBreadcrumb,
} from "../../../../router/adapters/selectors/selectBreadcrumb";
import { useAppSelector } from "../../../../reports/adapters/primary/hooks/react-redux";
import { Breadcrumb } from "../../../../shared-kernel/adapters/primary/react/Breadcrumb";

const SgDashboard: FC = () => {
  const currentPage = {
    name: BreadcrumCurrentPage.secretariatGeneral,
  } as const;
  const breadcrumb = useAppSelector((state) =>
    selectBreadcrumb(state, currentPage),
  );

  // TODO : donner le bon lien vers le formulaire
  // TODO : Créer le breadcrumb : demander à Maxime comment est prévue la gestion de celui-ci
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
            href: "/sg/transparence/creer",
          }}
        />
      </section>
      <SgNouvelleTransparence />
    </PageContentLayout>
  );
};

export default SgDashboard;
