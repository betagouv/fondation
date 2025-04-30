import { createAppSelector } from "../../../../store/createAppSelector";

export const selectAuthenticatedUser = createAppSelector(
  [(state) => state.authentication.user],
  (user) => user,
);
