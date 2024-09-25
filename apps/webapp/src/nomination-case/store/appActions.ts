import { Action } from "@reduxjs/toolkit";
import { NominationCase } from "./appState";

export type NominationCaseRetrievedAction =
  Action<"NOMINATION_CASE_RETRIEVED"> & {
    payload: NominationCase;
  };

export type AppAction = NominationCaseRetrievedAction;
