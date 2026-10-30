import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';

import { MenuContent, MenuItem, MenuRoot, MenuTrigger } from './menu';

describe('MenuItem', () => {
  it('should close the menu when a link item leads to its page', async () => {
    render(
      <MemoryRouter>
        <MenuRoot>
          <MenuTrigger>Menu</MenuTrigger>
          <MenuContent>
            <MenuItem linkProps={{ to: '/destination' }}>Destination</MenuItem>
          </MenuContent>
        </MenuRoot>
        <Routes>
          <Route element={<p>Page de destination</p>} path="/destination" />
          <Route element={null} path="/" />
        </Routes>
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Menu' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Destination' }));

    expect(screen.getByText('Page de destination')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });
});
