import { colors } from "@codegouvfr/react-dsfr";
import { FC } from "react";
import { selectAuthenticatedUser } from "../authentication/adapters/primary/selectors/selectAuthenticatedUser";
import { logout } from "../authentication/core-logic/use-cases/logout/logout";
import {
  useAppDispatch,
  useAppSelector,
} from "../reports/adapters/primary/hooks/react-redux";

export const AppHeaderAvatar: FC = () => {
  const user = useAppSelector(selectAuthenticatedUser);
  const firstLetters = user?.firstLetters;

  const dispatch = useAppDispatch();

  if (!user) {
    return null;
  }

  const onClickLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="fr-btn flex items-center gap-2">
      <div
        id={`avatar-${firstLetters}`}
        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white"
        style={{
          backgroundColor: colors.decisions.text.title.blueFrance.default,
        }}
        title={firstLetters}
      >
        {firstLetters}
      </div>
      <div
        id="avatar-logout"
        onClick={onClickLogout}
        className="font-semibold hover:cursor-pointer"
      >
        Se déconnecter
      </div>
    </div>
  );
};
