import {
  AllRulesMapV2,
  AttachedFileVM,
  Magistrat,
  NominationFile,
  Transparency,
} from "shared-models";
import { AuthenticatedUserSM } from "../authentication/core-logic/gateways/Authentication.gateway";
import { RulesLabelsMap } from "../reports/adapters/primary/labels/rules-labels";
import { SummarySection } from "../reports/adapters/primary/labels/summary-labels";
import { RouteChangedHandler } from "../router/core-logic/components/routeChangedHandler";
import { RouteToComponentFactory } from "../router/core-logic/components/routeToComponent";
import { RouterProvider } from "../router/core-logic/providers/router";
import { DateOnlyStoreModel } from "../shared-kernel/core-logic/models/date-only";
import { SetOptional } from "type-fest";
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
  // Lors de l'upload d'un fichier, l'url n'est pas encore créée
  attachedFiles: SetOptional<AttachedFileVM, "signedUrl">[] | null;
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

type QueryStatus = "idle" | "pending" | "fulfilled" | "rejected";

export interface AppState<IsTest extends boolean = false> {
  sharedKernel: {
    currentDate: Date;
  };
  reportOverview: {
    acceptedMimeTypes: {
      embeddedScreenshots: string[];
      attachedFiles: string[];
    };
    summarySections: SummarySection[];
    queryStatus: Record<string, QueryStatus>;
    byIds: Record<string, ReportSM> | null;
    rulesMap: AllRulesMapV2;
    rulesLabelsMap: IsTest extends true
      ? RulesLabelsMap<{
          [NominationFile.RuleGroup.MANAGEMENT]: [];
          [NominationFile.RuleGroup.STATUTORY]: [];
          [NominationFile.RuleGroup.QUALITATIVE]: [];
        }>
      : RulesLabelsMap;
  };
  reportList: {
    data: ReportListItem[] | null;
    filters: {
      state?: NominationFile.ReportState;
    };
  };
  authentication: {
    initializedFromPersistence: boolean;
    authenticated: boolean;
    user: AuthenticatedUserSM | null;
    authenticateQueryStatus: QueryStatus;
  };
  router: {
    hrefs: {
      current: string;
      login: string;
    };
    anchorsAttributes: {
      transparencies: RouterProvider["getTransparenciesAnchorAttributes"];
      perTransparency: RouterProvider["getTransparencyReportsAnchorAttributes"];
      reportOverview: RouterProvider["getReportOverviewAnchorAttributes"];
      login: RouterProvider["getLoginAnchorAttributes"];
    };
    routeToComponent: ReturnType<RouteToComponentFactory>;
    routeChangedHandler: RouteChangedHandler;
  };
}
