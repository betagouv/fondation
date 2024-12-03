import {
  AttachedFileVM,
  Magistrat,
  NominationFile,
  allRulesTuple,
  Transparency,
} from "shared-models";
import { RouteChangedHandler } from "../../router/core-logic/components/routeChangedHandler";
import { RouteToComponentFactory } from "../../router/core-logic/components/routeToComponent";
import { DateOnlyStoreModel } from "../../shared-kernel/core-logic/models/date-only";
import { AuthenticatedUser } from "../../authentication/core-logic/gateways/authentication.gateway";

export interface ReportSM {
  id: string;
  folderNumber: number | null;
  state: NominationFile.ReportState;
  formation: Magistrat.Formation;
  name: string;
  biography: string | null;
  dueDate: DateOnlyStoreModel | null;
  birthDate: DateOnlyStoreModel;
  transparency: Transparency;
  grade: Magistrat.Grade;
  currentPosition: string;
  targettedPosition: string;
  comment: string | null;
  rank: string;
  observers: string[] | null;
  rules: NominationFile.Rules;
  attachedFiles: AttachedFileVM[] | null;
}
export type ReportListItem = Pick<
  ReportSM,
  | "id"
  | "folderNumber"
  | "state"
  | "dueDate"
  | "formation"
  | "name"
  | "transparency"
  | "grade"
  | "targettedPosition"
> & { reporterName: string | null; observersCount: number };

export interface AppState {
  reportOverview: {
    byIds: Record<string, ReportSM> | null;
    rulesTuple: typeof allRulesTuple;
  };
  reportList: { data: ReportListItem[] | null };
  authentication: {
    authenticated: boolean;
    user: AuthenticatedUser;
  };
  router: {
    hrefs: {
      current: string;
      login: string;
      reportList: string;
    };
    anchorsAttributes: {
      reportOverview: (id: string) => {
        href: string;
        onClick: () => void;
      };
    };
    routeToComponent: ReturnType<RouteToComponentFactory>;
    routeChangedHandler: RouteChangedHandler;
  };
}
