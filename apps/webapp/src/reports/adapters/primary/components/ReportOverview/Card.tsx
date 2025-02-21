import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { PropsWithChildren } from "react";
import clsx from "clsx";

export type CardProps = {
  id?: string;
  label?: string;
} & PropsWithChildren;

export const Card: React.FC<CardProps> = ({ id, label, children }) => {
  return (
    <section
      id={id}
      aria-label={label}
      className={clsx("rounded-lg bg-white", cx("fr-px-3w", "fr-py-2w"))}
    >
      {children}
    </section>
  );
};
