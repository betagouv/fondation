import Button from '@codegouvfr/react-dsfr/Button';
import { useState, type ReactNode } from 'react';

/** Copies the value of an input, selected instead for a manual copy when the browser refuses the clipboard */
export function CopyButton(props: {
  copiedLabel: ReactNode;
  inputId: string;
  label: ReactNode;
  text: string;
}) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const isCopied = copiedText === props.text;

  return (
    <>
      <Button
        iconId={isCopied ? 'fr-icon-check-line' : 'fr-icon-clipboard-line'}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(props.text);
            setCopiedText(props.text);
          } catch {
            // the browser refuses the clipboard outside a secure context
            (document.getElementById(props.inputId) as HTMLInputElement | null)?.select();
          }
        }}
        priority="tertiary"
        size="small"
        type="button"
      >
        {isCopied ? props.copiedLabel : props.label}
      </Button>
      {/* rendered empty beforehand: a live region added with its text is not announced */}
      <span className="fr-sr-only" role="status">
        {isCopied && props.copiedLabel}
      </span>
    </>
  );
}
