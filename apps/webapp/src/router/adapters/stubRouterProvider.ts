import { RouterProvider } from "../core-logic/providers/router";

export class StubRouterProvider implements RouterProvider {
  onClickAttribute = () => null;

  goToLogin = () => {};
  goToNominationCaseList = () => {};
  gotToNominationCaseOverview = () => {};
  getLoginHref = () => "";
  getNominationCaseOverviewAnchorAttributes = (id: string) => {
    return {
      href: "/dossier-de-nomination/" + id,
      onClick: this.onClickAttribute,
    };
  };
}
