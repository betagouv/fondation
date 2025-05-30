import { Magistrat, Transparency } from "shared-models";

export interface RouterProvider {
  goToLogin(): void;
  getLoginHref(): string;

  goToTransparencies(): void;
  goToSecretariatGeneral(): void;
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
  ) => {
    href: string;
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  };
  getReportOverviewAnchorAttributes: (
    transparency: Transparency,
    id: string,
  ) => {
    href: string;
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  };
  getLoginAnchorAttributes: () => {
    href: string;
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
  };
}
