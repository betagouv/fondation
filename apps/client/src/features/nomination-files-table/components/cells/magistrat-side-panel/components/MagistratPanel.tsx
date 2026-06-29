import Button from '@codegouvfr/react-dsfr/Button';
import { useRef } from 'react';
import { FormattedMessage } from 'react-intl';

import { MAGISTRAT_PANEL_ID, useMagistratPanel } from '../context/magistrat-panel.context';
import { SidePanel } from '@/shared/ui/side-panel';

import { MagistratDetails } from './MagistratDetails';

export function MagistratPanel(props: { sessionId: string }) {
  const { activeFile, close, hasNext, hasPrevious, isLeaveBlocked, isOpen, next, previous } =
    useMagistratPanel();

  const lastFile = useRef(activeFile);
  if (activeFile) lastFile.current = activeFile;
  const fileToRender = activeFile ?? lastFile.current;

  return (
    <SidePanel
      ariaLabel={fileToRender?.content.nomMagistrat}
      disableClose={isLeaveBlocked}
      header={
        <>
          <Button
            disabled={isLeaveBlocked || !hasPrevious}
            iconId="fr-icon-arrow-left-s-line"
            iconPosition="left"
            onClick={previous}
            priority="tertiary no outline"
            size="small"
          >
            <FormattedMessage defaultMessage="Précédent" />
          </Button>
          <Button
            disabled={isLeaveBlocked || !hasNext}
            iconId="fr-icon-arrow-right-s-line"
            iconPosition="right"
            onClick={next}
            priority="tertiary no outline"
            size="small"
          >
            <FormattedMessage defaultMessage="Suivant" />
          </Button>
        </>
      }
      id={MAGISTRAT_PANEL_ID}
      onClose={close}
      open={isOpen}
    >
      {fileToRender && <MagistratDetails nominationFile={fileToRender} sessionId={props.sessionId} />}
    </SidePanel>
  );
}
