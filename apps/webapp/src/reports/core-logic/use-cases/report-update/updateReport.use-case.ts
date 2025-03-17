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

export const updateReport = createAppAsyncThunk<void, UpdateReportParams>(
  "report/updateReport",
  async (
    { reportId, data },
    {
      extra: {
        gateways: { reportGateway },
      },
    },
  ) => {
    const gatewayData = { ...data };

    if (gatewayData.comment) {
      const container = document.createElement("div");
      container.innerHTML = gatewayData.comment;

      const images = container.querySelectorAll("img");
      images.forEach((img) => img.removeAttribute("src"));

      gatewayData.comment = container.innerHTML;
    }

    await reportGateway.updateReport(reportId, gatewayData);
  },
);
