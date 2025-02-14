import { Transparency } from "shared-models";
import { RouterProvider } from "../core-logic/providers/router";

export class StubRouterProvider implements RouterProvider {
  onReportOverviewClick = () => null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTransparencyClickAttribute = (_: Transparency) => null;

  goToLogin = () => {};
  goToTransparencies = () => {};

  getLoginHref = () => "";

  getTransparencyReportsAnchorAttributes = (transparency: Transparency) => ({
    href: `/transparences/${transparency}`,
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
