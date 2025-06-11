import { DateOnlyJson, Magistrat, Transparency } from "shared-models";

export interface RouterProvider {
  goToLogin(): void;
  getLoginHref(): string;

  goToTransparencies(): void;
  onGoToSecretariatGeneralClick(): void;
  goToSgNouvelleTransparence(): void;
  getSecretariatGeneralAnchorAttributes: () => {
    href: string;
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  };
  getSgNouvelleTransparenceAnchorAttributes: () => {
    href: string;
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  };

  getTransparenciesAnchorAttributes: () => {
    href: string;
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  };
  getTransparencyReportsAnchorAttributes: (
    transparency: Transparency,
    formation: Magistrat.Formation,
    dateTransparence: DateOnlyJson,
  ) => {
    href: string;
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  };
  getReportOverviewAnchorAttributes: (
    id: string,
    transparency: Transparency,
    formation: Magistrat.Formation,
    dateTransparence: DateOnlyJson,
  ) => {
    href: string;
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  };
  getLoginAnchorAttributes: () => {
    href: string;
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  };
}
