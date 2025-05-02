import { Gender } from "shared-models";
import { createAppSelector } from "../../../../store/createAppSelector";

export const selectAuthenticatedUser = createAppSelector(
  [(state) => state.authentication.user],
  (user) => ({
    firstLetters: `${user?.lastName.charAt(0).toUpperCase()}${user?.firstName.charAt(0).toUpperCase()}`,
    isDefined: !!user,
    civility:
      user &&
      `${user?.gender === Gender.F ? "Mme" : "M."} ${user?.lastName.toUpperCase()}`,
  }),
);
