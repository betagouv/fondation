import { cx } from "@codegouvfr/react-dsfr/fr/cx";
import { FC, PropsWithChildren } from "react";

export type PageContentLayoutProps = PropsWithChildren & {
  fullBackgroundOrange?: boolean;
};

export const PageContentLayout: FC<PageContentLayoutProps> = ({
  fullBackgroundOrange = false,
  children,
}) => (
  <div className={fullBackgroundOrange ? "bg-light-orange" : undefined}>
    <div className={cx("fr-container", "fr-py-5w")}>{children}</div>
  </div>
);
