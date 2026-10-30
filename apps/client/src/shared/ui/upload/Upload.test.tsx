import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

import { ATTACHMENT_MAX_BYTES, FILES_PER_UPLOAD, Upload } from './Upload';

function files(count: number): File[] {
  return Array.from(
    { length: count },
    (_, i) => new File(['x'], `piece-${i}.pdf`, { type: 'application/pdf' }),
  );
}

function heavyFile(): File {
  const file = new File(['x'], 'lourd.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'size', { value: ATTACHMENT_MAX_BYTES + 1 });
  return file;
}

function renderUpload(onChange: (files: File[]) => void, options: { clearOnChange?: boolean } = {}) {
  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <Upload clearOnChange={options.clearOnChange} label="Ajouter un fichier" multiple onChange={onChange} />
    </IntlProvider>,
  );
  return screen.getByLabelText(/Ajouter un fichier/);
}

describe('Upload', () => {
  it('hands over a selection within the caps', async () => {
    const onChange = vi.fn();
    const input = renderUpload(onChange, { clearOnChange: true });

    await userEvent.upload(input, files(FILES_PER_UPLOAD));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.calls[0]![0]).toHaveLength(FILES_PER_UPLOAD);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('refuses a selection over the cap without sending it', async () => {
    const onChange = vi.fn();
    const input = renderUpload(onChange, { clearOnChange: true });

    await userEvent.upload(input, files(FILES_PER_UPLOAD + 1));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(`${FILES_PER_UPLOAD} fichiers au plus par envoi.`);
  });

  it('refuses a file over the size cap without sending it, and names it', async () => {
    const onChange = vi.fn();
    const input = renderUpload(onChange, { clearOnChange: true });

    await userEvent.upload(input, [...files(1), heavyFile()]);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Le fichier "lourd.pdf" dépasse 50 Mo.');
  });

  it('empties the held selection once a new one is refused', async () => {
    const onChange = vi.fn();
    const input = renderUpload(onChange);

    await userEvent.upload(input, files(1));
    await userEvent.upload(input, [heavyFile()]);

    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
