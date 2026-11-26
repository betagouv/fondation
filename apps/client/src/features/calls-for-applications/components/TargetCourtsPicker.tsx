import Button from '@codegouvfr/react-dsfr/Button';
import Tag from '@codegouvfr/react-dsfr/Tag';
import { useId, useState, type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { matchesSearch, SearchableCheckboxList } from '@/shared/ui/searchable-checkbox-list';
import type { FoundCallForApplicationsFormDto } from '@api/types';

const MAX_TAGS = 10;

/** the courts of one type that a specific call targets: a search narrows a list of more than a hundred */
export function TargetCourtsPicker(props: {
  checked: readonly string[];
  courtGroup: FoundCallForApplicationsFormDto['targetCourtTypes'][number];
  /** the type is checked without any court: the form stays incomplete */
  isEmpty: boolean;
  onChange: (checked: string[]) => void;
  titleAside?: ReactNode;
}) {
  const { formatMessage } = useIntl();
  const [search, setSearch] = useState('');
  // both pickers may show at once: each names its type for a screen reader to tell them apart
  const { courts, type, typeInSentence: group } = props.courtGroup;
  const isOfGroup = (id: string) => courts.some((court) => court.id === id);
  const checkedInGroup = props.checked.filter(isOfGroup);
  const [isOpen, setOpen] = useState(checkedInGroup.length === 0);
  const titleId = useId();
  const listId = useId();
  const error = formatMessage(
    { defaultMessage: 'Choisissez au moins une juridiction parmi les {group}' },
    { group },
  );
  const chosen = courts.filter((court) => checkedInGroup.includes(court.id));

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <p className="fr-mb-0 fr-text--md font-bold" id={titleId}>
            {type.label}
          </p>
          {props.titleAside}
        </div>
        <Button
          aria-controls={listId}
          aria-expanded={isOpen}
          className="shrink-0"
          iconId={isOpen ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'}
          iconPosition="right"
          onClick={() => setOpen(!isOpen)}
          priority="tertiary no outline"
          size="small"
          type="button"
        >
          {isOpen ? (
            <FormattedMessage defaultMessage="Masquer la liste" />
          ) : (
            <FormattedMessage defaultMessage="Afficher la liste" />
          )}{' '}
          <span className="fr-sr-only">
            <FormattedMessage defaultMessage="des {group}" values={{ group }} />
          </span>
        </Button>
      </div>
      {isOpen ? (
        <div id={listId}>
          <SearchableCheckboxList
            checked={checkedInGroup}
            clearLabelSuffix={formatMessage({ defaultMessage: 'parmi les {group}' }, { group })}
            countLabel={
              <>
                <FormattedMessage
                  defaultMessage="{count, plural, =0 {Aucune juridiction sélectionnée} one {# juridiction sélectionnée} other {# juridictions sélectionnées}}"
                  values={{ count: checkedInGroup.length }}
                />{' '}
                <span className="fr-sr-only">
                  <FormattedMessage defaultMessage="parmi les {group}" values={{ group }} />
                </span>
              </>
            }
            emptyLabel={<FormattedMessage defaultMessage="Aucune juridiction ne correspond à la recherche" />}
            error={props.isEmpty ? error : undefined}
            legend={<span className="fr-sr-only">{type.label}</span>}
            onChange={(checked) =>
              props.onChange([...props.checked.filter((id) => !isOfGroup(id)), ...checked])
            }
            onSearchChange={setSearch}
            options={courts.filter((court) => matchesSearch(court.label, search))}
            search={search}
            searchLabel={formatMessage(
              { defaultMessage: 'Rechercher une juridiction parmi les {group}' },
              { group },
            )}
          />
        </div>
      ) : chosen.length === 0 ? (
        <>
          <p className="fr-mb-0 text-sm text-(--text-mention-grey)">
            <FormattedMessage defaultMessage="Aucune juridiction sélectionnée" />{' '}
            <span className="fr-sr-only">
              <FormattedMessage defaultMessage="parmi les {group}" values={{ group }} />
            </span>
          </p>
          {props.isEmpty && <p className="fr-error-text fr-mt-0 fr-mb-0">{error}</p>}
        </>
      ) : (
        <ul className="fr-tags-group -mb-2">
          {chosen.slice(0, MAX_TAGS).map((court) => (
            <li key={court.id}>
              <Tag>{court.label}</Tag>
            </li>
          ))}
          {chosen.length > MAX_TAGS && (
            <li>
              <Tag>
                <span aria-hidden>+{chosen.length - MAX_TAGS}</span>
                <span className="fr-sr-only">
                  <FormattedMessage
                    defaultMessage="{count, plural, one {et # autre juridiction} other {et # autres juridictions}}"
                    values={{ count: chosen.length - MAX_TAGS }}
                  />
                </span>
              </Tag>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}
