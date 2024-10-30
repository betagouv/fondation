import { NominationFile } from "shared-models";
import { createAppAsyncThunk } from "../../../store/createAppAsyncThunk";

export type UpdateNominationFileParams = {
  reportId: string;
  data: {
    comment?: string;
    state?:
      | NominationFile.ReportState.IN_PROGRESS
      | NominationFile.ReportState.READY_TO_SUPPORT;
  };
};
export type UpdateNominationFilePayload = UpdateNominationFileParams;

export const updateNominationFile = createAppAsyncThunk<
  UpdateNominationFilePayload,
  UpdateNominationFileParams
>(
  "nominationFile/updateFile",
  async (
    { reportId, data },
    {
      extra: {
        gateways: { nominationFileGateway },
      },
    },
  ) => {
    await nominationFileGateway.updateNominationFile(reportId, data);
    return { reportId, data };
  },
);
