import * as apiSdk from "api-sdk";
import { NominationFileGateway } from "../../../core-logic/gateways/NominationFile.gateway";
import {
  NominationFile,
  NominationFileListItem,
  RuleName,
} from "../../../store/appState";

export class ApiNominationFileGateway implements NominationFileGateway {
  async updateRule(
    nominationCaseId: string,
    _: string,
    ruleName: RuleName,
    validated: boolean,
  ): Promise<void> {
    await apiSdk.functional.api.reports.updateReportRule(
      {
        host: import.meta.env.VITE_API_URL,
      },
      nominationCaseId,
      {
        rule: ruleName,
        validated,
      },
    );
  }

  async retrieveNominationFile(id: string): Promise<NominationFile | null> {
    const report = await apiSdk.functional.api.reports.retrieveReport(
      {
        host: import.meta.env.VITE_API_URL,
      },
      id,
    );

    if (!report) return null;
    return {
      id: report.id,
      title: report.title,
      biography: report.biography,
      dueDate: report.dueDate,
      rules: {
        management: {
          TRANSFER_TIME: report.rules.management.TRANSFER_TIME.validated,
          GETTING_FIRST_GRADE:
            report.rules.management.GETTING_FIRST_GRADE.validated,
          GETTING_GRADE_HH: report.rules.management.GETTING_GRADE_HH.validated,
          GETTING_GRADE_IN_PLACE:
            report.rules.management.GETTING_GRADE_IN_PLACE.validated,
          PROFILED_POSITION:
            report.rules.management.PROFILED_POSITION.validated,
          CASSATION_COURT_NOMINATION:
            report.rules.management.CASSATION_COURT_NOMINATION.validated,
          OVERSEAS_TO_OVERSEAS:
            report.rules.management.OVERSEAS_TO_OVERSEAS.validated,
          JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE:
            report.rules.management.JUDICIARY_ROLE_AND_JURIDICTION_DEGREE_CHANGE
              .validated,
          JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT:
            report.rules.management.JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT
              .validated,
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
      title: item.title,
      dueDate: item.dueDate,
    }));
  }
}
