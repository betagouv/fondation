import { createAppSelector } from "../../../../store/createAppSelector";

export const selectAuthenticationFailed = createAppSelector(
  [(state) => state.authentication.authenticateQueryStatus],
  (queryStatus) => queryStatus === "rejected",
);
