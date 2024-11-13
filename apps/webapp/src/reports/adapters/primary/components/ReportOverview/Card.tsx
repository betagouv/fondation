import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { PropsWithChildren } from "react";
import clsx from "clsx";

export const Card: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div
      className={clsx(
        "bg-white rounded-lg",
        "space-y-2",
        cx("fr-col-10", "fr-col-md-7", "fr-px-3w", "fr-py-2w"),
      )}
    >
      {children}
    </div>
  );
};
