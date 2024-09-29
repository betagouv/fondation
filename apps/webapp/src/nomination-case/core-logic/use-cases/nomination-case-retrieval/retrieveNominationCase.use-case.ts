import { createAsyncThunk } from "@reduxjs/toolkit";
import { NominationCase } from "../../../store/appState.ts";
import { Gateways } from "../../../store/reduxStore.ts";

export const retrieveNominationCase = createAsyncThunk<
  NominationCase,
  string,
  {
    extra: Gateways;
  }
>(
  "nominationCase/retrieval",
  async (id: string, { extra: { nominationCaseGateway } }) => {
    return nominationCaseGateway.retrieveNominationCase(id);
  }
);
