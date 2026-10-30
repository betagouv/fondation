import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { FILES_PER_UPLOAD, Upload } from './Upload';

function files(count: number): File[] {
  return Array.from(
    { length: count },
    (_, i) => new File(['x'], `piece-${i}.pdf`, { type: 'application/pdf' }),
  );
}

function renderUpload(onChange: (files: File[]) => void) {
  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <Upload label="Ajouter un fichier" multiple onChange={onChange} />
    </IntlProvider>,
  );
  return screen.getByLabelText(/Ajouter un fichier/);
}

describe('Upload', () => {
  it('hands over a selection within the cap', async () => {
    const onChange = vi.fn();
    const input = renderUpload(onChange);

    await userEvent.upload(input, files(FILES_PER_UPLOAD));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0]![0]).toHaveLength(FILES_PER_UPLOAD);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('refuses a selection over the cap without sending it', async () => {
    const onChange = vi.fn();
    const input = renderUpload(onChange);

    await userEvent.upload(input, files(FILES_PER_UPLOAD + 1));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(`${FILES_PER_UPLOAD} fichiers au plus par envoi.`);
  });
});
