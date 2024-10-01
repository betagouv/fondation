import { createAppAsyncThunk } from "../../../store/createAppAsyncThunk.ts";

export const retrieveNominationCase = createAppAsyncThunk(
  "nominationCase/retrieval",
  async (
    id: string,
    {
      extra: {
        gateways: { nominationCaseGateway },
      },
    }
  ) => {
    return nominationCaseGateway.retrieveNominationCase(id);
  }
);
