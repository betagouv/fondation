import { cx } from '@codegouvfr/react-dsfr/fr/cx';

import { BoldButton } from './buttons/BoldButton';
import { BulletListButton } from './buttons/BulletListButton';
import { HeadingButton } from './buttons/HeadingButton';
import { HighlightButton } from './buttons/HighlightButton';
import { ImageUploadButton } from './buttons/ImageUploadButton';
import { IndentDecreaseButton } from './buttons/IndentDecreaseButton';
import { IndentIncreaseButton } from './buttons/IndentIncreaseButton';
import { ItalicButton } from './buttons/ItalicButton';
import { OrderedListButton } from './buttons/OrderedListButton';
import { RedoButton } from './buttons/RedoButton';
import { TextColorButton } from './buttons/TextColorButton';
import { UnderlineButton } from './buttons/UnderlineButton';
import { UndoButton } from './buttons/UndoButton';
import { headingLevels } from './extensions/constant';

export const MenuBar = () => {
  return (
    <div className="fr-mb-1v fr-px-4v fr-pt-4v fr-pb-3v sticky top-2 z-10 bg-white">
      <div className={cx('fr-grid-row')}>
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
        <ImageUploadButton />
      </div>
    </div>
  );
};
