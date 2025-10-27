import { colors } from '@codegouvfr/react-dsfr';
import { type FC, type PropsWithChildren } from 'react';

export type SessionBlockProps = {
  hidden?: boolean;
  noTransparenciesText: string;
  title: string;
} & PropsWithChildren;

export const SessionBlock: FC<SessionBlockProps> = ({
  hidden = false,
  title,
  noTransparenciesText,
  children
}) => (
  <div className="flex-[1_1_0]">
    <h2 style={{ color: colors.decisions.text.title.blueFrance.default }}>{title}</h2>

    {hidden ? noTransparenciesText : children}
  </div>
);
