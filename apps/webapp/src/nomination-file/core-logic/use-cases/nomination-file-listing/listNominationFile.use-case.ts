import { createAppAsyncThunk } from "../../../store/createAppAsyncThunk";

export const listNominationFile = createAppAsyncThunk(
  "nominationFiles/list",
  async (
    _,
    {
      extra: {
        gateways: { nominationFileGateway: nominationCaseGateway },
      },
    },
  ) => {
    return nominationCaseGateway.list();
  },
);
