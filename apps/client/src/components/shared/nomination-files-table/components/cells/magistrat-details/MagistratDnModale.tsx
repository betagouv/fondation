import { colors } from '@codegouvfr/react-dsfr';
import Button from '@codegouvfr/react-dsfr/Button';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { type SessionNominationFile } from '@queries/nomination-sessions.queries';

import { MagistratDetails } from './MagistratDetails';

const modalMagistratDnDetails = createModal({
  id: `modal-magistrat-dn-details`,
  isOpenedByDefault: false,
});

type MagistratModalContextType = { setActive(id: string): void };
const MagistratModalContext = createContext(null as unknown as MagistratModalContextType);

export function MagistratModaleProvider(
  props: PropsWithChildren<{
    sessionId: string;
    nominationFiles: SessionNominationFile[];
  }>,
) {
  const [activeNominationFileId, setActiveNominationFileId] = useState<string | null>(null);
  const modalRef = useRef<HTMLDialogElement | null>(null);

  const isOpen = useIsModalOpen(modalMagistratDnDetails, {
    onConceal() {
      setActiveNominationFileId(null);
    },
  });

  const activeFileIndex = useMemo(
    () =>
      activeNominationFileId
        ? props.nominationFiles.findIndex(({ id }) => id === activeNominationFileId)
        : -1,
    [activeNominationFileId, props.nominationFiles],
  );

  const activeFile = useMemo(
    () => (activeFileIndex !== -1 ? props.nominationFiles[activeFileIndex] : null),
    [activeFileIndex, props.nominationFiles],
  );

  const modalExists = useCallback(
    () =>
      // Bug in @codegouvfr/react-dsfr implementation for the modal
      // oxlint-disable-next-line @typescript-eslint/no-explicit-any
      Boolean(modalRef.current && (window as any).dsfr(modalRef.current)?.modal),
    [modalRef],
  );

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
        size="large"
        buttons={[
          {
            priority: 'tertiary',
            disabled: !hasPrevious,
            children: 'Précédent',
            iconId: 'fr-icon-arrow-left-s-line',
            iconPosition: 'left',
            onClick: onPreviousClicked,
            doClosesModal: false,
          },
          {
            priority: 'tertiary',
            disabled: !hasNext,
            children: 'Suivant',
            iconId: 'fr-icon-arrow-right-s-line',
            iconPosition: 'right',
            onClick: onNextClicked,
            doClosesModal: false,
          },
        ]}
      >
        {activeFile && <MagistratDetails sessionId={props.sessionId} nominationFile={activeFile} />}
      </modalMagistratDnDetails.Component>

      <MagistratModalContext value={{ setActive: setActiveNominationFileId }}>
        {props.children}
      </MagistratModalContext>
    </>
  );
}

export function MagistratDnModalLink(props: { nominationFile: SessionNominationFile }) {
  const ctx = useContext(MagistratModalContext);

  const hasComment =
    !!props.nominationFile.memo ||
    !!props.nominationFile.summary?.canWrite ||
    !!props.nominationFile.summary?.canRead ||
    (props.nominationFile.comment?.trim().length ?? 0) > 0;

  return (
    <Button
      size="small"
      className="flex! flex-col! items-start! text-left! font-normal! normal-case!"
      style={{ color: colors.decisions.text.default.grey.default }}
      priority="tertiary no outline"
      aria-controls={modalMagistratDnDetails.id}
      onClick={() => ctx.setActive(props.nominationFile.id)}
    >
      <div className="text-left leading-4 underline">
        {props.nominationFile.content.nomMagistrat}
        {hasComment && (
          <i
            aria-label="Au moins un commentaire est présent"
            className="ri-message-3-line ml-1 cursor-pointer before:size-5! before:content-['']"
            title="Au moins un commentaire est présent"
          />
        )}
        {props.nominationFile.hasAttachment && (
          <i
            aria-label="Au moins une pièce jointe est présente"
            className="ri-file-line ml-1 cursor-pointer before:size-5! before:content-['']"
            title="Au moins une pièce jointe est présente"
          />
        )}
      </div>
      {props.nominationFile.content.posteActuel ? (
        <span className="text-xs">{props.nominationFile.content.posteActuel}</span>
      ) : null}
    </Button>
  );
}
