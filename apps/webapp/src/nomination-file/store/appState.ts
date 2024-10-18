import { Magistrat, NominationFile, Transparency } from "@/shared-models";
import { RouteChangedHandler } from "../../router/core-logic/components/routeChangedHandler";
import { RouteToComponentFactory } from "../../router/core-logic/components/routeToComponent";
import { DateOnlyStoreModel } from "../../shared-kernel/core-logic/models/date-only";

export interface NominationFileSM {
  id: string;
  state: NominationFile.ReportState;
  formation: Magistrat.Formation;
  name: string;
  biography: string;
  dueDate: DateOnlyStoreModel | null;
  transparency: Transparency;
  grade: Magistrat.Grade;
  currentPosition: string;
  targettedPosition: string;
  rank: string;
  comment: string | null;
  rules: NominationFile.Rules;
}
export type NominationFileListItem = Pick<
  NominationFileSM,
  | "id"
  | "state"
  | "dueDate"
  | "formation"
  | "name"
  | "transparency"
  | "grade"
  | "targettedPosition"
>;

export interface AppState {
  nominationFileOverview: { byIds: Record<string, NominationFileSM> | null };
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
