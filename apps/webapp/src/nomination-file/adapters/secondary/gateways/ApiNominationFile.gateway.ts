import * as apiSdk from "@/api-sdk";
import { Magistrat, NominationFile, Transparency } from "@/shared-models";
import { NominationFileGateway } from "../../../core-logic/gateways/NominationFile.gateway";
import {
  NominationFileListItem,
  NominationFileSM,
} from "../../../store/appState";

export class ApiNominationFileGateway implements NominationFileGateway {
  async updateRule(ruleId: string, validated: boolean): Promise<void> {
    await apiSdk.functional.api.reports.updateReportRule(
      {
        host: import.meta.env.VITE_API_URL,
      },
      ruleId,
      {
        validated,
      },
    );
  }

  async retrieveNominationFile(id: string): Promise<NominationFileSM | null> {
    const report = await apiSdk.functional.api.reports.retrieveReport(
      {
        host: import.meta.env.VITE_API_URL,
      },
      id,
    );

    if (!report) return null;
    return {
      id: report.id,
      name: report.name,
      biography: report.biography,
      dueDate: report.dueDate,
      state: report.state as NominationFile.ReportState,
      formation: report.formation as Magistrat.Formation,
      transparency: report.transparency as Transparency,
      grade: report.grade as Magistrat.Grade,
      targettedPosition: report.targettedPosition,
      rules: {
        management: {
          TRANSFER_TIME: report.rules.management.TRANSFER_TIME,
          GETTING_FIRST_GRADE: report.rules.management.GETTING_FIRST_GRADE,
          GETTING_GRADE_HH: report.rules.management.GETTING_GRADE_HH,
          GETTING_GRADE_IN_PLACE:
            report.rules.management.GETTING_GRADE_IN_PLACE,
          PROFILED_POSITION: report.rules.management.PROFILED_POSITION,
          CASSATION_COURT_NOMINATION:
            report.rules.management.CASSATION_COURT_NOMINATION,
          OVERSEAS_TO_OVERSEAS: report.rules.management.OVERSEAS_TO_OVERSEAS,
          JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE:
            report.rules.management
              .JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE,
          JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT:
            report.rules.management.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT,
        },
      },
    };
  }

  async list(): Promise<NominationFileListItem[]> {
    const response = await apiSdk.functional.api.reports.getReports({
      host: import.meta.env.VITE_API_URL,
    });
    return response.data.map((item) => ({
      id: item.id,
      name: item.name,
      dueDate: item.dueDate,
    }));
  }
}
