import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import type { ReactNode } from 'react';

import { BoldButton } from './buttons/BoldButton';
import { BulletListButton } from './buttons/BulletListButton';
import { CalloutButton } from './buttons/CalloutButton';
import { HeadingButton } from './buttons/HeadingButton';
import { HighlightButton } from './buttons/HighlightButton';
import { HorizontalRuleButton } from './buttons/HorizontalRuleButton';
import { ImageUploadButton } from './buttons/ImageUploadButton';
import { IndentDecreaseButton } from './buttons/IndentDecreaseButton';
import { IndentIncreaseButton } from './buttons/IndentIncreaseButton';
import { ItalicButton } from './buttons/ItalicButton';
import { LinkButton } from './buttons/LinkButton';
import { OrderedListButton } from './buttons/OrderedListButton';
import { RedoButton } from './buttons/RedoButton';
import { InsertTableButton, TableRowAndColumnButtons } from './buttons/TableButtons';
import { TextColorButton } from './buttons/TextColorButton';
import { UnderlineButton } from './buttons/UnderlineButton';
import { UndoButton } from './buttons/UndoButton';
import { type EditorFeatures, headingLevels } from './extensions/constant';

export const MenuBar = (props: { end?: ReactNode; features: EditorFeatures }) => {
  return (
    <div className="fr-mb-1v fr-px-4v fr-pt-4v fr-pb-3v sticky top-(--fondation-table-header-top) z-3 bg-(--background-default-grey)">
      <div className={`${cx('fr-grid-row')} items-center`}>
        <UndoButton />
        <RedoButton />
        <TextColorButton />
        <HighlightButton />
        <BoldButton />
        <ItalicButton />
        <UnderlineButton />
        {headingLevels.map((level) => (
          <HeadingButton key={level} level={level} />
        ))}
        <OrderedListButton />
        <BulletListButton />
        <IndentDecreaseButton />
        <IndentIncreaseButton />
        {props.features === 'page' && (
          <>
            <LinkButton />
            <HorizontalRuleButton />
            <CalloutButton kind="tip" />
            <CalloutButton kind="warning" />
            <InsertTableButton />
            <TableRowAndColumnButtons />
          </>
        )}
        <ImageUploadButton features={props.features} />
        {props.end && <div className="relative -top-0.5 -mr-5 ml-auto">{props.end}</div>}
      </div>
    </div>
  );
};
