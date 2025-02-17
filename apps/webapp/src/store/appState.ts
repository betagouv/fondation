import {
  AllRulesMap,
  AttachedFileVM,
  Magistrat,
  NominationFile,
  Transparency,
} from "shared-models";
import { AuthenticatedUserSM } from "../authentication/core-logic/gateways/Authentication.gateway";
import { SummarySection } from "../reports/adapters/primary/labels/summary-labels";
import { RouteChangedHandler } from "../router/core-logic/components/routeChangedHandler";
import { RouteToComponentFactory } from "../router/core-logic/components/routeToComponent";
import { DateOnlyStoreModel } from "../shared-kernel/core-logic/models/date-only";
import { RouterProvider } from "../router/core-logic/providers/router";
import { RulesLabelsMap } from "../reports/adapters/primary/labels/rules-labels";

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
> & { observersCount: number };

export interface AppState<IsTest extends boolean = false> {
  sharedKernel: {
    currentDate: Date;
  };
  reportOverview: {
    summarySections: SummarySection[];
    byIds: Record<string, ReportSM> | null;
    rulesMap: AllRulesMap;
    rulesLabelsMap: IsTest extends true
      ? RulesLabelsMap<{
          [NominationFile.RuleGroup.MANAGEMENT]: [];
          [NominationFile.RuleGroup.STATUTORY]: [];
          [NominationFile.RuleGroup.QUALITATIVE]: [];
        }>
      : RulesLabelsMap;
  };
  reportList: {
    anchorsAttributes: {
      perTransparency: RouterProvider["getTransparencyReportsAnchorAttributes"];
    };
    data: ReportListItem[] | null;
    filters: {
      state?: NominationFile.ReportState;
    };
  };
  authentication: {
    initializedFromPersistence: boolean;
    authenticated: boolean;
    user: AuthenticatedUserSM | null;
  };
  router: {
    hrefs: {
      current: string;
      login: string;
    };
    anchorsAttributes: {
      reportOverview: RouterProvider["getReportOverviewAnchorAttributes"];
    };
    routeToComponent: ReturnType<RouteToComponentFactory>;
    routeChangedHandler: RouteChangedHandler;
  };
}
