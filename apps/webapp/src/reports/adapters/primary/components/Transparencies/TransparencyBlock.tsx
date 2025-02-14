import { colors } from "@codegouvfr/react-dsfr";
import { FC, PropsWithChildren } from "react";

export type TransparencyBlockProps = {
  hidden?: boolean;
  title: string;
} & PropsWithChildren;

export const TransparencyBlock: FC<TransparencyBlockProps> = ({
  hidden = false,
  title,
  children,
}) => (
  <div className="flex-[1_1_0]">
    <h2
      style={{
        display: hidden ? "none" : undefined,
        color: colors.decisions.text.title.blueFrance.default,
      }}
    >
      {title}
    </h2>
    {children}
  </div>
);
