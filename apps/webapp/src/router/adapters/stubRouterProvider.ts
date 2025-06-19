import { Transparency } from "shared-models";
import { RouterProvider } from "../core-logic/providers/router";

export class StubRouterProvider implements RouterProvider {
  readonly loginHref = "/login";
  readonly transparenciesHref = "/transparences";
  readonly secretariatGeneralHref = "/secretariat-general";
  readonly sgNouvelleTransparenceHref =
    "/secretariat-general/nouvelle-transparence";
  readonly sgTransparenceHref =
    "/secretariat-general/saisine/transparence/un-id";

  onGoToLoginClick = () => null;
  onGoToTransparenciesClick = () => null;
  goToSgDashboard = () => null;
  onGoToSgTransparenceClick = () => null;
  goToSgNouvelleTransparence = () => null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTransparencyClickAttribute = (_: Transparency) => null;
  onReportOverviewClick = () => null;

  goToLogin = () => {};
  goToTransparencies = () => {};
  gotToSgTransparence() {}

  getSecretariatGeneralAnchorAttributes = () => ({
    href: this.secretariatGeneralHref,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      this.goToSgDashboard();
    },
  });
  getSgNouvelleTransparenceAnchorAttributes = () => ({
    href: this.sgNouvelleTransparenceHref,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      this.goToSgNouvelleTransparence();
    },
  });
  getSgTransparenceAnchorAttributes = () => ({
    href: this.sgTransparenceHref,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      this.onGoToSgTransparenceClick();
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
