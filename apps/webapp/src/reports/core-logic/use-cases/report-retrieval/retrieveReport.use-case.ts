import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk.ts";

export const retrieveReport = createAppAsyncThunk(
  "report/retrieval",
  async (
    id: string,
    {
      extra: {
        gateways: { reportGateway: reportGateway },
      },
    },
  ) => {
    return reportGateway.retrieveReport(id);
  },
);
