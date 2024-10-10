import { RouteChangedHandler } from "../../router/core-logic/components/routeChangedHandler";
import { RouteToComponentFactory } from "../../router/core-logic/components/routeToComponent";

export interface NominationFile {
  id: string;
  title: string;
  biography: string;
  dueDate: string | null;
  rules: {
    management: {
      TRANSFER_TIME: boolean;
      GETTING_FIRST_GRADE: boolean;
      GETTING_GRADE_HH: boolean;
      GETTING_GRADE_IN_PLACE: boolean;
      PROFILED_POSITION: boolean;
      CASSATION_COURT_NOMINATION: boolean;
      OVERSEAS_TO_OVERSEAS: boolean;
      JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE: boolean;
      JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT: boolean;
    };
  };
}
export type NominationFileListItem = Pick<
  NominationFile,
  "id" | "title" | "dueDate"
>;

export type RuleGroup = keyof NominationFile["rules"];
export type ManagementRuleName = keyof NominationFile["rules"]["management"];
export type RuleName = ManagementRuleName;

export interface AppState {
  nominationFileOverview: { byIds: Record<string, NominationFile> | null };
  nominationCaseList: { data: NominationFileListItem[] | null };
  authentication: {
    authenticated: boolean;
    forbiddenPageAsked: boolean;
  };
  router: {
    hrefs: {
      login: string;
    };
    anchorsAttributes: {
      nominationFileOverview: (id: string) => {
        href: string;
        onClick: () => void;
      };
    };
    routeToComponent: ReturnType<RouteToComponentFactory>;
    routeChangedHandler: RouteChangedHandler;
  };
}
