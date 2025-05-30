import { BreadcrumbVM } from "../../../../shared-kernel/core-logic/models/breadcrumb-vm";
import { createAppSelector } from "../../../../store/createAppSelector";

export enum BreadcrumCurrentPage {
  secretariatGeneral = "secretariat-general",
  sgNouvelleTransparence = "sg-nouvelle-transparence",
}

type CurrentPage =
  | {
      name: BreadcrumCurrentPage.secretariatGeneral;
    }
  | {
      name: BreadcrumCurrentPage.sgNouvelleTransparence;
    };

export const selectBreadcrumb = createAppSelector(
  [
    (state) => state.router.anchorsAttributes.secretariatGeneral.dashboard,
    (_, currentPage: CurrentPage) => currentPage,
  ],
  (getSecretariatGeneralAnchorAttributes, currentPage): BreadcrumbVM => {
    switch (currentPage.name) {
      case BreadcrumCurrentPage.sgNouvelleTransparence: {
        const secretariatGeneralSegments = [
          {
            label: "Secretariat général",
            ...getSecretariatGeneralAnchorAttributes(),
          },
          {
            label: "Tableau de bord",
            ...getSecretariatGeneralAnchorAttributes(),
          },
        ];
        return {
          currentPageLabel: "Créer une nouvelle transparence",
          segments: secretariatGeneralSegments,
        };
      }

      case BreadcrumCurrentPage.secretariatGeneral: {
        const secretariatGeneralSegments = [
          {
            label: "Secretariat général",
            ...getSecretariatGeneralAnchorAttributes(),
          },
        ];
        return {
          currentPageLabel: "Tableau de bord",
          segments: secretariatGeneralSegments,
        };
      }

      default: {
        const _exhaustiveCheck: never = currentPage;
        console.info(_exhaustiveCheck);
        throw new Error(`Unhandled page: ${currentPage}`);
      }
    }
  },
);
