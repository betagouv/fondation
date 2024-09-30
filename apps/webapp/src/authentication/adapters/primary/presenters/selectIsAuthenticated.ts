import { createAppSelector } from "../../../../nomination-case/store/createAppSelector";

export const selectIsAuthenticated = createAppSelector(
  [(state) => state.authentication],
  (authentication) => authentication.authenticated
);
