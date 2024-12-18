import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { PropsWithChildren } from "react";
import clsx from "clsx";

export type CardProps = {
  id?: string;
} & PropsWithChildren;

export const Card: React.FC<CardProps> = ({ id, children }) => {
  return (
    <section
      id={id}
      className={clsx("rounded-lg bg-white", cx("fr-px-3w", "fr-py-2w"))}
    >
      {children}
    </section>
  );
};
