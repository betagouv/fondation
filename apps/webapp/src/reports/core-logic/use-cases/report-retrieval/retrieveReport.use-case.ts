import { createAppAsyncThunk } from "../../../../store/createAppAsyncThunk.ts";

export const retrieveReport = createAppAsyncThunk(
  "report/retrieval",
  async (
    id: string,
    {
      extra: {
        gateways: { reportGateway },
      },
    },
  ) => {
    return reportGateway.retrieveReport(id);
  },
);
