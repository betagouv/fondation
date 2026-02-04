import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { useQueryState } from 'nuqs';
import { useCallback, useEffect, useMemo, useRef, type PropsWithChildren } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { type SessionNominationFile } from '@queries/nomination-sessions.queries';
import { MagistratRouteDetails } from './MagistratRouteDetails';

const modalMagistratDnDetails = createModal({
  id: `modal-magistrat-dn-details`,
  isOpenedByDefault: false
});

export function MagistratModaleProvider(
  props: PropsWithChildren<{
    sessionId: string;
    nominationFiles: SessionNominationFile[];
  }>
) {
  const [activeNominationFileId, setActiveNominationFileId] = useQueryState('active');
  const modalRef = useRef<HTMLDialogElement | null>(null);

  const isOpen = useIsModalOpen(modalMagistratDnDetails, {
    onConceal() {
      setActiveNominationFileId(null);
    }
  });

  const activeFileIndex = useMemo(
    () =>
      activeNominationFileId
        ? props.nominationFiles.findIndex(({ id }) => id === activeNominationFileId)
        : -1,
    [activeNominationFileId, props.nominationFiles]
  );

  const modalExists = useCallback(() => {
    // Bug in @codegouvfr/react-dsfr implementation for the modal
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Boolean(modalRef.current && (window as any).dsfr(modalRef.current)?.modal);
  }, [modalRef]);

  useEffect(() => {
    if (activeFileIndex !== -1 && !isOpen && modalExists()) modalMagistratDnDetails.open();
    if (activeFileIndex === -1 && isOpen && modalExists()) modalMagistratDnDetails.close();
  }, [activeFileIndex, isOpen, setActiveNominationFileId, modalExists]);

  const hasPrevious = props.nominationFiles.length > 0 && activeFileIndex > 0;
  const onPreviousClicked = useCallback(() => {
    if (!hasPrevious) return;

    const active = props.nominationFiles[activeFileIndex - 1].id;
    setActiveNominationFileId(active);
  }, [hasPrevious, setActiveNominationFileId, props.nominationFiles, activeFileIndex]);

  const hasNext = props.nominationFiles.length > 0 && activeFileIndex < props.nominationFiles.length - 1;
  const onNextClicked = useCallback(() => {
    if (!hasNext) return;

    const active = props.nominationFiles[activeFileIndex + 1].id;
    setActiveNominationFileId(active);
  }, [hasNext, setActiveNominationFileId, props.nominationFiles, activeFileIndex]);

  const modalProps = { title: null, ref: modalRef };
  return (
    <>
      <modalMagistratDnDetails.Component
        {...modalProps}
        buttons={[
          {
            priority: 'tertiary',
            disabled: !hasPrevious,
            children: 'Précédent',
            iconId: 'fr-icon-arrow-left-s-line',
            iconPosition: 'left',
            onClick: onPreviousClicked,
            doClosesModal: false
          },
          {
            priority: 'tertiary',
            disabled: !hasNext,
            children: 'Suivant',
            iconId: 'fr-icon-arrow-right-s-line',
            iconPosition: 'right',
            onClick: onNextClicked,
            doClosesModal: false
          }
        ]}
      >
        <MagistratRouteDetails sessionId={props.sessionId} nominationFiles={props.nominationFiles} />
      </modalMagistratDnDetails.Component>

      {props.children}
    </>
  );
}

export function MagistratDnModalLink(props: { nominationFile: SessionNominationFile }) {
  const location = useLocation();

  const hasComment =
    !!props.nominationFile.memo ||
    !!props.nominationFile.summary?.canWrite ||
    !!props.nominationFile.summary?.canRead;

  const search = new URLSearchParams(location.search);
  search.set('active', props.nominationFile.id);

  return (
    <Link aria-controls={modalMagistratDnDetails.id} to={{ search: `?${search.toString()}` }}>
      {props.nominationFile.content.nomMagistrat}
      {hasComment && (
        <i
          className="ri-message-3-line ml-1 cursor-pointer"
          style={{ fontSize: '10px' }}
          title="Commentaire présent"
          aria-label="Commentaire présent"
        />
      )}
    </Link>
  );
}
