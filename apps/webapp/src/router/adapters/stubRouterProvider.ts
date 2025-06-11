import { Transparency } from "shared-models";
import { RouterProvider } from "../core-logic/providers/router";

export class StubRouterProvider implements RouterProvider {
  readonly loginHref = "/login";
  readonly transparenciesHref = "/transparences";
  readonly secretariatGeneralHref = "/secretariat-general";

  onGoToLoginClick = () => null;
  onGoToTransparenciesClick = () => null;
  onGoToSecretariatGeneralClick = () => null;
  goToSgNouvelleTransparence = () => null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTransparencyClickAttribute = (_: Transparency) => null;
  onReportOverviewClick = () => null;

  goToLogin = () => {};
  goToTransparencies = () => {};
  getSecretariatGeneralAnchorAttributes = () => ({
    href: this.secretariatGeneralHref,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      this.onGoToSecretariatGeneralClick();
    },
  });
  getSgNouvelleTransparenceAnchorAttributes = () => ({
    href: this.loginHref,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      this.goToSgNouvelleTransparence();
    },
  });
  getLoginHref = () => this.loginHref;
  getTransparencyReportsHref = (transparency: Transparency) =>
    `/transparences/${transparency}`;

  getLoginAnchorAttributes = () => ({
    href: this.loginHref,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      this.onGoToLoginClick();
    },
  });
  getTransparenciesAnchorAttributes = () => ({
    href: this.transparenciesHref,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      this.onGoToTransparenciesClick();
    },
  });
  getTransparencyReportsAnchorAttributes = (transparency: Transparency) => ({
    href: this.getTransparencyReportsHref(transparency),
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      this.onTransparencyClickAttribute(transparency);
    },
  });
  getReportOverviewAnchorAttributes = (
    id: string,
    transparency: Transparency,
  ) => ({
    href: `/transparences/${transparency}/dossiers-de-nomination/${id}`,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      this.onReportOverviewClick();
    },
  });
}
