import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import Select from '@codegouvfr/react-dsfr/Select';
import { useCurrentEditor, useEditorState } from '@tiptap/react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { isAllowedLink, isSectionAnchor } from '../extensions/constant';
import { Modal } from '@/shared/ui/modal/Modal';

import { EditorButton } from './EditorButton';

export function LinkButton() {
  const { editor } = useCurrentEditor();
  const [isOpen, setIsOpen] = useState(false);
  const [href, setHref] = useState('');
  const disabled = useEditorState({
    editor,
    selector: (ctx) => !ctx.editor || !ctx.editor.can().setLink({ href: 'https://example.org' }),
  });
  const [sections, setSections] = useState<{ id: string; text: string }[]>([]);

  const open = () => {
    if (!editor) return;

    const found: { id: string; text: string }[] = [];
    editor.state.doc.descendants((node) => {
      const id = node.attrs['id'];
      if (node.type.name === 'heading' && typeof id === 'string' && node.textContent) {
        found.push({ id, text: node.textContent });
      }
    });
    setSections(found);
    setHref(editor.getAttributes('link')['href'] ?? '');
    setIsOpen(true);
  };

  const unsetLink = () => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    setIsOpen(false);
  };

  const setLink = () => {
    if (!editor || !href.trim()) return;

    // an address typed without its scheme is a web address
    const address = href.trim();
    const target = isAllowedLink(address) ? address : `https://${address}`;

    const chain = editor.chain().focus().extendMarkRange('link');
    if (editor.state.selection.empty && !editor.isActive('link')) {
      const section = isSectionAnchor(target) ? sections.find(({ id }) => id === target.slice(1)) : undefined;
      chain
        .insertContent({
          marks: [{ attrs: { href: target }, type: 'link' }],
          text: section?.text ?? target,
          type: 'text',
        })
        .run();
    } else {
      chain.setLink({ href: target }).run();
    }
    setIsOpen(false);
  };

  return (
    <>
      <EditorButton disabled={!!disabled} iconId="fr-icon-link" mark="link" onClick={open} title="Lien" />
      <Modal
        actions={
          <>
            {editor?.isActive('link') && (
              <Button onClick={unsetLink} priority="secondary">
                <FormattedMessage defaultMessage="Retirer le lien" />
              </Button>
            )}
            <Button disabled={!href} onClick={setLink}>
              <FormattedMessage defaultMessage="Appliquer" />
            </Button>
          </>
        }
        onClose={() => setIsOpen(false)}
        open={isOpen}
        title={<FormattedMessage defaultMessage="Lien" />}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setLink();
          }}
        >
          <Input
            label={<FormattedMessage defaultMessage="Adresse" />}
            nativeInputProps={{
              autoFocus: true,
              onChange: (event) => setHref(event.target.value),
              placeholder: 'https://',
              value: href,
            }}
          />
          {sections.length > 0 && (
            <Select
              label={<FormattedMessage defaultMessage="Ou une section de la page" />}
              nativeSelectProps={{
                onChange: (event) => setHref(event.target.value ? `#${event.target.value}` : ''),
                value: isSectionAnchor(href) ? href.slice(1) : '',
              }}
            >
              <option value="">{''}</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.text}
                </option>
              ))}
            </Select>
          )}
          <input hidden type="submit" />
        </form>
      </Modal>
    </>
  );
}
