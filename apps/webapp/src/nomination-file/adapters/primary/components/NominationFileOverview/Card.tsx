import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { PropsWithChildren } from "react";
import clsx from "clsx";

export const Card: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div
      className={clsx(
        "bg-white rounded-lg",
        cx("fr-col-xl-7", "fr-px-md-3w", "fr-py-md-2w")
      )}
    >
      {children}
    </div>
  );
};
