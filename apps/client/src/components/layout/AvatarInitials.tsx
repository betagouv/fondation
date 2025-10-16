import { colors } from '@codegouvfr/react-dsfr';
import type { FC } from 'react';

interface AvatarInitialsProps {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  backgroundColor?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base'
};

export const AvatarInitials: FC<AvatarInitialsProps> = ({
  initials,
  size = 'md',
  backgroundColor = colors.decisions.text.title.blueFrance.default
}) => {
  return (
    <div
      id={`avatar-${initials}`}
      className={`flex items-center justify-center rounded-full font-medium text-white ${sizeClasses[size]}`}
      style={{
        backgroundColor
      }}
      title={initials}
    >
      {initials}
    </div>
  );
};
