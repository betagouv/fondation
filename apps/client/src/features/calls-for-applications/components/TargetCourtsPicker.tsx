import Button from '@codegouvfr/react-dsfr/Button';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import Tag from '@codegouvfr/react-dsfr/Tag';
import clsx from 'clsx';
import { useId, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { matchesSearch, SearchableCheckboxList } from '@/shared/ui/searchable-checkbox-list';
import { Tooltip } from '@/shared/ui/tooltip';
import type { FoundCallForApplicationsFormDto } from '@api/types';

import { GuidelinesAdaptationBadge } from './GuidelinesAdaptationBadge';

/** the courts of one type that a specific call targets: a search narrows a list of more than a hundred */
export function TargetCourtsPicker(props: {
  guidelinesAdaptations: readonly string[];
  checked: readonly string[];
  courtGroup: FoundCallForApplicationsFormDto['targetCourtTypes'][number];
  /** the type is checked without any court: the form stays incomplete */
  isEmpty: boolean;
  onGuidelinesAdaptationsChange: (guidelinesAdaptations: string[]) => void;
  onChange: (checked: string[]) => void;
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
        <p className="fr-mb-0 fr-text--md font-bold" id={titleId}>
          {type.label}
        </p>
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
            buttonsLabelSuffix={formatMessage({ defaultMessage: 'parmi les {group}' }, { group })}
            canShowCheckedOnly
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
            options={courts
              .filter((court) => matchesSearch(court.label, search))
              .map((court) => ({
                ...court,
                aside: checkedInGroup.includes(court.id) && (
                  <Tooltip
                    label={<FormattedMessage defaultMessage="Sur la durée d'affectation du poste actuel" />}
                  >
                    <Tag
                      nativeButtonProps={{
                        // a button in a form submits it by default
                        type: 'button',
                        onClick: () =>
                          props.onGuidelinesAdaptationsChange(
                            props.guidelinesAdaptations.includes(court.id)
                              ? props.guidelinesAdaptations.filter((id) => id !== court.id)
                              : [...props.guidelinesAdaptations, court.id],
                          ),
                      }}
                      pressed={props.guidelinesAdaptations.includes(court.id)}
                      small
                    >
                      <FormattedMessage defaultMessage="Adapter les lignes directrices de gestion" />{' '}
                      <span className="fr-sr-only">
                        <FormattedMessage
                          defaultMessage="sur la durée d'affectation du poste actuel pour {court}"
                          values={{ court: court.label }}
                        />
                      </span>
                    </Tag>
                  </Tooltip>
                ),
              }))}
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
          {chosen.map((court) => (
            <li key={court.id}>
              {props.guidelinesAdaptations.includes(court.id) ? (
                // a div rather than the paragraph of the DSFR tag: the tooltip holds a block
                <div className={clsx(cx('fr-tag'), 'gap-1.5')}>
                  {court.label}
                  <GuidelinesAdaptationBadge />
                </div>
              ) : (
                <Tag>{court.label}</Tag>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
