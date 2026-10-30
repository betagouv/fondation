import { fireEvent, render, screen } from '@testing-library/react';
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

function renderUpload(
  onChange: (files: File[]) => void,
  options: { accept?: string; clearOnChange?: boolean; disabled?: boolean; multiple?: boolean } = {},
) {
  render(
    <IntlProvider defaultLocale="fr" locale="fr">
      <Upload
        accept={options.accept}
        clearOnChange={options.clearOnChange}
        disabled={options.disabled}
        label="Ajouter un fichier"
        multiple={options.multiple ?? true}
        onChange={onChange}
      />
    </IntlProvider>,
  );
  return screen.getByLabelText<HTMLInputElement>(/Ajouter un fichier/);
}

function drop(input: HTMLInputElement, dropped: File[]) {
  // jsdom only takes a real FileList, which it cannot build
  Object.defineProperty(input, 'files', { configurable: true, value: null, writable: true });
  fireEvent.drop(input.closest('div')!, { dataTransfer: { files: dropped } });
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

  it('describes the refusal without adding it to the field name', async () => {
    const input = renderUpload(vi.fn(), { clearOnChange: true });

    await userEvent.upload(input, [heavyFile()]);

    expect(input).toHaveAccessibleName('Ajouter un fichier');
    expect(input).toHaveAccessibleDescription('Le fichier "lourd.pdf" dépasse 50 Mo.');
  });

  it('empties the held selection once a new one is refused', async () => {
    const onChange = vi.fn();
    const input = renderUpload(onChange);

    await userEvent.upload(input, files(1));
    await userEvent.upload(input, [heavyFile()]);

    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('hands over the files dropped anywhere in the box', () => {
    const onChange = vi.fn();
    const input = renderUpload(onChange, { clearOnChange: true });

    drop(input, files(2));

    expect(onChange).toHaveBeenCalledWith(files(2));
  });

  it('refuses a dropped file the picker would not offer', () => {
    const onChange = vi.fn();
    const input = renderUpload(onChange, { accept: 'application/pdf,.docx', clearOnChange: true });

    drop(input, [new File(['x'], 'script.exe', { type: 'application/x-msdownload' })]);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      `Le format du fichier "script.exe" n'est pas accepté.`,
    );
  });

  it('refuses several dropped files where only one is expected', () => {
    const onChange = vi.fn();
    const input = renderUpload(onChange, { clearOnChange: true, multiple: false });

    drop(input, files(2));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Un seul fichier par envoi.');
  });

  it('tells attachments can be dropped, in the singular or the plural', () => {
    render(
      <IntlProvider defaultLocale="fr" locale="fr">
        <Upload multiple onChange={vi.fn()} />
        <Upload onChange={vi.fn()} />
      </IntlProvider>,
    );

    expect(screen.getByLabelText('Ajouter ou glisser-déposer des fichiers')).toBeInTheDocument();
    expect(screen.getByLabelText('Ajouter ou glisser-déposer un fichier')).toBeInTheDocument();
  });

  it('ignores a drop while disabled', () => {
    const onChange = vi.fn();
    const input = renderUpload(onChange, { disabled: true });

    drop(input, files(1));

    expect(onChange).not.toHaveBeenCalled();
  });
});
