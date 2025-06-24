import { colors } from "@codegouvfr/react-dsfr";
import type { FC } from "react";

export const AppHeaderAvatar: FC = () => {
  const firstLetters = "AB";

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
        // onClick={onClickLogout}
        className="font-semibold hover:cursor-pointer"
      >
        Se déconnecter
      </div>
    </div>
  );
};
