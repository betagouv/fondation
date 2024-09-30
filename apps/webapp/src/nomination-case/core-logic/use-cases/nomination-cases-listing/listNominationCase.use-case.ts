import { createAppAsyncThunk } from "../../../store/createAppAsyncThunk";

export const listNominationCase = createAppAsyncThunk(
  "nominationCases/list",
  async (_, { extra: { nominationCaseGateway } }) => {
    return nominationCaseGateway.list();
  }
);
