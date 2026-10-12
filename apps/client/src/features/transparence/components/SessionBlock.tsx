import { colors } from '@codegouvfr/react-dsfr';
import { type PropsWithChildren } from 'react';

type SessionBlockProps = {
  hidden?: boolean;
  noTransparenciesText: string;
  title: string;
} & PropsWithChildren;

export function SessionBlock({ hidden = false, title, noTransparenciesText, children }: SessionBlockProps) {
  return (
    <div className="flex-[1_1_0]">
      <h2 style={{ color: colors.decisions.text.title.blueFrance.default }}>{title}</h2>

      {hidden ? noTransparenciesText : children}
    </div>
  );
}
