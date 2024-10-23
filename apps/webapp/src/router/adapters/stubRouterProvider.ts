import { RouterProvider } from "../core-logic/providers/router";

export class StubRouterProvider implements RouterProvider {
  onClickAttribute = () => null;

  goToLogin = () => {};
  goToNominationFileList = () => {};
  gotToNominationFileOverview = () => {};

  getLoginHref = () => "";
  getNominationFileListHref = () => "stub-nomination-file-list-href";

  getNominationFileOverviewAnchorAttributes = (id: string) => {
    return {
      href: "/dossier-de-nomination/" + id,
      onClick: this.onClickAttribute,
    };
  };
}
