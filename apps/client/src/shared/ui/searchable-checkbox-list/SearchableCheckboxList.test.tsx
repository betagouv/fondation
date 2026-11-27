import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState, type ComponentProps } from 'react';
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

  it('toggles an option from a click anywhere on its line but on what sits at its end', async () => {
    const onAside = vi.fn();
    const { onChange } = renderList({
      options: [
        {
          aside: (
            <button onClick={onAside} type="button">
              Adapter
            </button>
          ),
          id: 'TJ  AUCH',
          label: "Tribunal judiciaire d'Auch",
        },
      ],
    });

    await userEvent.click(screen.getByRole('button', { name: 'Adapter' }));
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('listitem'));

    expect(onAside).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith(['TJ  AUCH']);
  });

  it('clears the whole choice and gives the focus back to the search', async () => {
    const { onChange } = renderList({ checked: ['TJ  AUCH', 'TJ  CAHORS'] });

    await userEvent.click(screen.getByRole('button', { name: 'Tout désélectionner' }));

    expect(onChange).toHaveBeenCalledWith([]);
    expect(screen.getByRole('textbox', { name: 'Rechercher une juridiction' })).toHaveFocus();
  });

  it('names the list its clear button empties when two lists show at once', () => {
    renderList({ checked: ['TJ  AUCH'], buttonsLabelSuffix: 'parmi les tribunaux judiciaires' });

    expect(
      screen.getByRole('button', { name: 'Tout désélectionner parmi les tribunaux judiciaires' }),
    ).toBeInTheDocument();
  });

  it('shows only the checked options then every option again', async () => {
    renderList({ canShowCheckedOnly: true, checked: ['TJ  CAHORS'] });

    await userEvent.click(screen.getByRole('button', { name: 'Afficher la sélection' }));
    expect(screen.getAllByRole('checkbox').map((option) => option.closest('li')?.textContent)).toEqual([
      'Tribunal judiciaire de Cahors',
    ]);
    await userEvent.click(screen.getByRole('button', { name: 'Tout afficher' }));

    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('clears the search before it shows the choice alone', async () => {
    const { onSearchChange } = renderList({
      canShowCheckedOnly: true,
      checked: ['TJ  CAHORS'],
      search: 'Marseille',
    });

    await userEvent.click(screen.getByRole('button', { name: 'Afficher la sélection' }));

    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('goes back to every option once the selection shown is cleared', async () => {
    function Choosing() {
      const [checked, setChecked] = useState<string[]>(['TJ  CAHORS']);
      return (
        <SearchableCheckboxList
          canShowCheckedOnly
          checked={checked}
          countLabel=""
          emptyLabel="Aucune juridiction ne correspond à la recherche"
          legend="Tribunaux judiciaires"
          onChange={setChecked}
          onSearchChange={() => {}}
          options={OPTIONS}
          search=""
          searchLabel="Rechercher une juridiction"
        />
      );
    }
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <Choosing />
      </IntlProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Afficher la sélection' }));
    await userEvent.click(screen.getByRole('button', { name: 'Tout désélectionner' }));
    await userEvent.click(screen.getByRole('checkbox', { name: "Tribunal judiciaire d'Auch" }));

    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('goes back to every option once the last option shown is unchecked', async () => {
    function Choosing() {
      const [checked, setChecked] = useState<string[]>(['TJ  CAHORS']);
      return (
        <SearchableCheckboxList
          canShowCheckedOnly
          checked={checked}
          countLabel=""
          emptyLabel="Aucune juridiction ne correspond à la recherche"
          legend="Tribunaux judiciaires"
          onChange={setChecked}
          onSearchChange={() => {}}
          options={OPTIONS}
          search=""
          searchLabel="Rechercher une juridiction"
        />
      );
    }
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <Choosing />
      </IntlProvider>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Afficher la sélection' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Tribunal judiciaire de Cahors' }));
    await userEvent.click(screen.getByRole('checkbox', { name: "Tribunal judiciaire d'Auch" }));

    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('offers to show the choice alone only to a screen that lists every option', () => {
    renderList({ checked: ['TJ  CAHORS'] });

    expect(screen.queryByRole('button', { name: 'Afficher la sélection' })).not.toBeInTheDocument();
  });

  it('offers neither to clear nor to show the choice while it is empty', () => {
    renderList({ canShowCheckedOnly: true });

    expect(screen.queryByRole('button', { name: 'Tout désélectionner' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Afficher la sélection' })).not.toBeInTheDocument();
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
