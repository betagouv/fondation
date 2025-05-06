import { Transparency } from "shared-models";
import { RouterProvider } from "../core-logic/providers/router";

export class StubRouterProvider implements RouterProvider {
  readonly loginHref = "/login";
  readonly transparenciesHref = "/transparences";

  onGoToLoginClick = () => null;
  onGoToTransparenciesClick = () => null;
  goToSecretariatGeneral = () => null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTransparencyClickAttribute = (_: Transparency) => null;
  onReportOverviewClick = () => null;

  goToLogin = () => {};
  goToTransparencies = () => {};
  getSecretariatGeneralAnchorAttributes = () => ({
    href: this.loginHref,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      this.goToSecretariatGeneral();
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
    transparency: Transparency,
    id: string,
  ) => ({
    href: `/transparences/${transparency}/dossiers-de-nomination/${id}`,
    onClick: (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      this.onReportOverviewClick();
    },
  });
}
