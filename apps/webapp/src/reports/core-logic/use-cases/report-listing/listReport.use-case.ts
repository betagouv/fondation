import { createAppAsyncThunk } from "../../../store/createAppAsyncThunk";

export const listReport = createAppAsyncThunk(
  "reports/list",
  async (
    _,
    {
      extra: {
        gateways: { reportGateway },
      },
    },
  ) => {
    return reportGateway.list();
  },
);
