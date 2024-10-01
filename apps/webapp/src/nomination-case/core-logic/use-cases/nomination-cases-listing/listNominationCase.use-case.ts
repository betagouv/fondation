import { createAppAsyncThunk } from "../../../store/createAppAsyncThunk";

export const listNominationCase = createAppAsyncThunk(
  "nominationCases/list",
  async (
    _,
    {
      extra: {
        gateways: { nominationCaseGateway },
      },
    }
  ) => {
    return nominationCaseGateway.list();
  }
);
