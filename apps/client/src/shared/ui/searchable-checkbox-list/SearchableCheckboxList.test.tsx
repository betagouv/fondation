import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { matchesSearch, SearchableCheckboxList } from './SearchableCheckboxList';

const OPTIONS = [
  { id: 'TJ  AUCH', label: "Tribunal judiciaire d'Auch" },
  { id: 'TJ  CAHORS', label: 'Tribunal judiciaire de Cahors' },
];

function renderList(props: Partial<ComponentProps<typeof SearchableCheckboxList>> = {}) {
  const onChange = vi.fn();
  const onSearchChange = vi.fn();
  const { container } = render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <SearchableCheckboxList
        checked={[]}
        countLabel="Aucune juridiction sélectionnée"
        emptyLabel="Aucune juridiction ne correspond à la recherche"
        legend="Tribunaux judiciaires"
        onChange={onChange}
        onSearchChange={onSearchChange}
        options={OPTIONS}
        search=""
        searchLabel="Rechercher une juridiction"
        {...props}
      />
    </IntlProvider>,
  );
  return { container, onChange, onSearchChange };
}

describe('SearchableCheckboxList', () => {
  it.each([
    [
      'with options checked and an error',
      { checked: ['TJ  AUCH'], error: 'Choisissez au moins une juridiction' },
    ],
    ['without any option', { options: [] }],
  ])('has no accessibility violation %s', async (_, props) => {
    const { container } = renderList(props);

    expect(await axe(container)).toHaveNoViolations();
  });

  it('adds an option checked to the choice', async () => {
    const { onChange } = renderList({ checked: ['TJ  AUCH'] });

    await userEvent.click(screen.getByRole('checkbox', { name: 'Tribunal judiciaire de Cahors' }));

    expect(onChange).toHaveBeenCalledWith(['TJ  AUCH', 'TJ  CAHORS']);
  });

  it('clears the whole choice from the bar under the list', async () => {
    const { onChange } = renderList({ checked: ['TJ  AUCH', 'TJ  CAHORS'] });

    await userEvent.click(screen.getByRole('button', { name: 'Tout désélectionner' }));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('offers nothing to clear while the choice is empty', () => {
    renderList();

    expect(screen.getByRole('button', { name: 'Tout désélectionner' })).toBeDisabled();
  });

  it('hands the search to the screen', async () => {
    const { onSearchChange } = renderList();

    await userEvent.type(screen.getByRole('textbox', { name: 'Rechercher une juridiction' }), 'a');

    expect(onSearchChange).toHaveBeenCalledWith('a');
  });

  it('says that no option matches the search', () => {
    renderList({ options: [] });

    expect(screen.getByText('Aucune juridiction ne correspond à la recherche')).toBeInTheDocument();
  });

  it('describes the list by what it still waits for', () => {
    renderList({ error: 'Choisissez au moins une juridiction' });

    expect(screen.getByRole('group', { name: 'Tribunaux judiciaires' })).toHaveAccessibleDescription(
      'Choisissez au moins une juridiction',
    );
  });

  it('asks for the next page once the list is scrolled near its end', () => {
    const onEndReached = vi.fn();
    renderList({ onEndReached });
    const list = screen.getByRole('list');
    Object.defineProperties(list, {
      clientHeight: { value: 200 },
      scrollHeight: { value: 400 },
      scrollTop: { value: 150 },
    });

    fireEvent.scroll(list);

    expect(onEndReached).toHaveBeenCalled();
  });
});

describe('matchesSearch', () => {
  it.each([
    ['Tribunal judiciaire de Béziers', 'beziers', true],
    ['Tribunal judiciaire de Béziers', '  BÉZ ', true],
    ['Tribunal judiciaire de Lyon', 'paris', false],
  ])('finds %s with %j: %s', (label, search, found) => {
    expect(matchesSearch(label, search)).toBe(found);
  });
});
