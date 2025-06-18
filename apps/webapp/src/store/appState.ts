import {
  AllRulesMapV2,
  FileVM,
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

export type ReportScreenshotSM = {
  // On n'a pas de fileId avant la fin de l'upload
  fileId: string | null;
  name: string;
  signedUrl: string | null;
};

export type ReportScreenshots = {
  files: ReportScreenshotSM[];
};

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
  dateTransparence: DateOnlyStoreModel;
  grade: Magistrat.Grade;
  currentPosition: string;
  targettedPosition: string;
  comment: string | null;
  rank: string;
  observers: string[] | null;
  rules: NominationFile.Rules;
  attachedFiles:
    | {
        name: string;
        fileId: string | null;
        signedUrl: string | null;
      }[]
    | null;
  contentScreenshots: ReportScreenshots | null;
  dureeDuPoste: string | null;
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
  | "dateTransparence"
> & { observersCount: number };

export type TransparenceSM = {
  id: string;
  nom: string;
  formation: Magistrat.Formation;
  dateTransparence: DateOnlyStoreModel;
  dateClotureDelaiObservation: DateOnlyStoreModel;
};

export type QueryStatus = "idle" | "pending" | "fulfilled" | "rejected";

export interface AppState<IsTest extends boolean = false> {
  sharedKernel: {
    currentDate: Date;
  };
  transparencies: {
    GDS: Record<
      string,
      Partial<Record<Magistrat.Formation, { files: FileVM[] }>>
    >;
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
      secretariatGeneral: {
        dashboard: RouterProvider["getSecretariatGeneralAnchorAttributes"];
        sgNouvelleTransparence: RouterProvider["getSgNouvelleTransparenceAnchorAttributes"];
      };
    };
    routeToComponent: ReturnType<RouteToComponentFactory>;
    routeChangedHandler: RouteChangedHandler;
  };
  secretariatGeneral: {
    sessions: {
      transparences: Record<string, TransparenceSM>;
    };
    nouvelleTransparence: {
      acceptedMimeTypes: {
        sourceDeDonnées: string[];
      };
      uploadQueryStatus: QueryStatus;
      validationError: string | null;
    };
  };
}
