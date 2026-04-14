import type { DateOnly } from '@/models/date-only.model';
import React from 'react';
import { useIntl } from 'react-intl';

import type { DateOnlyJson } from 'shared-models';
import { useIntlAge, useIntlBirthDate, useIntlPositionDuration } from './hooks';

function Formatted(props: React.PropsWithChildren) {
  const { textComponent } = useIntl();

  if (!props.children) return null;
  return React.createElement(textComponent ?? React.Fragment, undefined, props.children);
}

export function FormattedAge(props: { value: Date | DateOnly }) {
  const format = useIntlAge();
  return <Formatted>{format(props.value)}</Formatted>;
}

export function FormattedPositionDuration(props: {
  value: Date | DateOnly | DateOnlyJson | null | undefined;
}) {
  const formatDuration = useIntlPositionDuration();
  const formatted = formatDuration(props.value);

  return <Formatted>{formatted}</Formatted>;
}

export function FormattedBirthDate(props: { value: Date | DateOnly | DateOnlyJson | null | undefined }) {
  const formatBirthDate = useIntlBirthDate();
  const formatted = formatBirthDate(props.value);

  return <Formatted>{formatted}</Formatted>;
}
