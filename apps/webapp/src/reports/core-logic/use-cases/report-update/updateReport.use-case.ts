import { NominationFile } from "shared-models";
import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk";

export type ReportStateUpdateParam = NominationFile.ReportState;

export type UpdateReportParams = {
  reportId: string;
  data: {
    comment?: string;
    state?: ReportStateUpdateParam;
  };
};
export type UpdateReportPayload = UpdateReportParams;

export const updateReport = createAppAsyncThunk<
  UpdateReportPayload,
  UpdateReportParams
>(
  "report/updateReport",
  async (
    { reportId, data },
    {
      extra: {
        gateways: { reportGateway },
      },
    },
  ) => {
    if (data.comment) {
      const container = document.createElement("div");
      container.innerHTML = data.comment;

      const images = container.querySelectorAll("img");
      images.forEach((img) => img.removeAttribute("src"));

      data.comment = container.innerHTML;
    }

    await reportGateway.updateReport(reportId, data);

    return { reportId, data };
  },
);
