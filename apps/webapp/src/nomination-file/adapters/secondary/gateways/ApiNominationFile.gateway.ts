import { Magistrat, NominationFile, Transparency } from "shared-models";
import {
  NominationFileGateway,
  UpdateNominationFileParams,
} from "../../../core-logic/gateways/NominationFile.gateway";
import { NominationFileApiClient } from "../../../core-logic/gateways/NominationFileApi.client";
import {
  NominationFileListItem,
  NominationFileSM,
} from "../../../store/appState";

export class ApiNominationFileGateway implements NominationFileGateway {
  constructor(
    private readonly nominationFileApiClient: NominationFileApiClient,
  ) {}

  async updateNominationFile(
    reportId: string,
    data: UpdateNominationFileParams,
  ): Promise<void> {
    const updateData = {
      comment: data.comment,
      state: data.state,
    };
    await this.nominationFileApiClient.updateReport(reportId, updateData);
  }

  async updateRule(ruleId: string, validated: boolean): Promise<void> {
    await this.nominationFileApiClient.updateRule(ruleId, validated);
  }

  async retrieveNominationFile(id: string): Promise<NominationFileSM | null> {
    const report =
      await this.nominationFileApiClient.retrieveNominationFile(id);

    if (!report) return null;
    return {
      id: report.id,
      folderNumber: report.folderNumber,
      name: report.name,
      biography: report.biography,
      dueDate: report.dueDate,
      birthDate: report.birthDate,
      state: report.state as NominationFile.ReportState,
      formation: report.formation as Magistrat.Formation,
      transparency: report.transparency as Transparency,
      grade: report.grade as Magistrat.Grade,
      currentPosition: report.currentPosition,
      targettedPosition: report.targettedPosition,
      comment: report.comment,
      rank: report.rank,
      observers: report.observers,
      rules: report.rules,
    };
  }

  async list(): Promise<NominationFileListItem[]> {
    const response = await this.nominationFileApiClient.list();
    return response.data.map((item) => ({
      id: item.id,
      folderNumber: item.folderNumber,
      name: item.name,
      reporterName: item.reporterName,
      dueDate: item.dueDate,
      state: item.state,
      formation: item.formation,
      transparency: item.transparency,
      grade: item.grade,
      targettedPosition: item.targettedPosition,
      observersCount: item.observersCount,
    }));
  }
}
