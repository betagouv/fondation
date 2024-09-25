import { createAsyncThunk } from "@reduxjs/toolkit";
import { NominationCase } from "../../../store/appState.ts";
import { NominationCaseGateway } from "../../gateways/nominationCase.gateway.ts";

export const retrieveNominationCase = createAsyncThunk<
  NominationCase,
  string,
  {
    extra: { nominationCaseGateway: NominationCaseGateway };
  }
>(
  "nominationCase/retrieval",
  async (id: string, { extra: { nominationCaseGateway } }) => {
    return nominationCaseGateway.retrieveNominationCase(id);
  }
);
