import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Select from '@codegouvfr/react-dsfr/Select';
import { Tag } from '@codegouvfr/react-dsfr/Tag';
import clsx from 'clsx';
import type { ComponentProps, ReactNode } from 'react';

type MemberOption = { disabled?: boolean; id: string; label: string };

/** a native select that adds a member, then each selected member as a tag removed in one click */
export function MemberTagSelect(props: {
  disabled?: boolean;
  error?: string;
  hint?: ReactNode;
  label: ReactNode;
  nativeSelectProps?: ComponentProps<typeof Select>['nativeSelectProps'];
  onAdd: (memberId: string) => void;
  onRemove: (memberId: string) => void;
  /** the members not selected yet, in display order */
  options: readonly MemberOption[];
  placeholder: ReactNode;
  removeTitle: (label: string) => string;
  /** in display order */
  selected: readonly MemberOption[];
}) {
  return (
    <div className="fr-mb-6v">
      <Select
        className="fr-mb-0"
        disabled={props.disabled}
        hint={props.hint}
        label={props.label}
        nativeSelectProps={{
          ...props.nativeSelectProps,
          onChange: (e) => {
            const id = e.currentTarget.value;
            if (props.options.some((option) => option.id === id && !option.disabled)) props.onAdd(id);
          },
          value: '',
        }}
        state={props.error ? 'error' : undefined}
        stateRelatedMessage={props.error}
      >
        <option disabled value="">
          {props.placeholder}
        </option>
        {props.options.map((option) => (
          <option disabled={option.disabled} key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </Select>

      <ul
        className={clsx(
          cx('fr-tags-group--sm', 'fr-tags-group'),
          'flex gap-x-1 transition-opacity duration-150',
          {
            'opacity-0': props.selected.length === 0,
            'fr-mt-2v opacity-100': props.selected.length > 0,
          },
        )}
      >
        {props.selected.map((member) => (
          <li key={member.id}>
            <Tag
              as="button"
              dismissible
              nativeButtonProps={{ 'aria-label': props.removeTitle(member.label), disabled: props.disabled }}
              onClick={() => props.onRemove(member.id)}
              title={props.removeTitle(member.label)}
            >
              {member.label}
            </Tag>
          </li>
        ))}
      </ul>
    </div>
  );
}
