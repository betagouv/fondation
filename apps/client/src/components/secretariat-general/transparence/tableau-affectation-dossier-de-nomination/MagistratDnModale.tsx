import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { useQueryState } from 'nuqs';
import { useCallback, useLayoutEffect, useMemo, useRef, type PropsWithChildren } from 'react';
import { Link, useLocation } from 'react-router-dom';

import type { Magistrat } from 'shared-models';

import { type SessionNominationFile } from '../../../../react-query/mutations/sg/nomination-session-affectations';
import { MagistratRouteDetails } from './MagistratRouteDetails';

const modalMagistratDnDetails = createModal({
  id: `modal-magistrat-dn-details`,
  isOpenedByDefault: false
});

export function MagistratModaleProvider(
  props: PropsWithChildren<{ formation: Magistrat.Formation; nominationFiles: SessionNominationFile[] }>
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

  useLayoutEffect(() => {
    const nominationFileExists = activeFileIndex !== -1;
    if (nominationFileExists && !isOpen) {
      // Bug in @codegouvfr/react-dsfr implementation for the modal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const modalExists = Boolean(modalRef.current && (window as any).dsfr(modalRef.current)?.modal);
      if (modalExists) {
        modalMagistratDnDetails.open();
      } else {
        setActiveNominationFileId(null);
      }
    }
  }, [activeFileIndex, isOpen, setActiveNominationFileId, modalRef]);

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
        <MagistratRouteDetails nominationFiles={props.nominationFiles} formation={props.formation} />
      </modalMagistratDnDetails.Component>

      {props.children}
    </>
  );
}

export function MagistratDnModalLink(props: { nominationFile: SessionNominationFile }) {
  const location = useLocation();

  const hasComment = !!props.nominationFile.comment;

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
