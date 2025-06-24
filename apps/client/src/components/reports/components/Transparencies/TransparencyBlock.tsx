import { colors } from "@codegouvfr/react-dsfr";
import { FC, PropsWithChildren } from "react";

export type TransparencyBlockProps = {
  hidden?: boolean;
  noTransparenciesText: string;
  title: string;
} & PropsWithChildren;

export const TransparencyBlock: FC<TransparencyBlockProps> = ({
  hidden = false,
  title,
  noTransparenciesText,
  children,
}) => (
  <div className="flex-[1_1_0]">
    <h2
      style={{
        color: colors.decisions.text.title.blueFrance.default,
      }}
    >
      {title}
    </h2>

    {hidden ? noTransparenciesText : children}
  </div>
);
