import { Gender } from "shared-models";
import { createAppSelector } from "../../../../store/createAppSelector";

export const selectAuthenticatedUser = createAppSelector(
  [(state) => state.authentication.user],
  (user) =>
    user
      ? {
          firstLetters: `${user?.lastName.charAt(0).toUpperCase()}${user?.firstName.charAt(0).toUpperCase()}`,
          civility: `${user?.gender === Gender.F ? "Madame" : "Monsieur"} ${user?.lastName.toUpperCase()}`,
        }
      : null,
);
