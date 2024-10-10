import { createAppAsyncThunk } from "../../../store/createAppAsyncThunk.ts";

export const retrieveNominationFile = createAppAsyncThunk(
  "nominationFile/retrieval",
  async (
    id: string,
    {
      extra: {
        gateways: { nominationCaseGateway },
      },
    },
  ) => {
    return nominationCaseGateway.retrieveNominationFile(id);
  },
);
