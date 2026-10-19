import type { Meta, StoryObj } from '@storybook/react-vite';

import { FormattedPositionDuration } from '@/i18n/components';

import { IdentityList } from './IdentityList';

function IdentityListStory(props: {
  currentPosition: string;
  grade: string;
  hasBirthDate: boolean;
  hasPositionDuration: boolean;
  rank: string;
  targetedGrade: string;
  targetedPosition: string;
}) {
  return (
    <IdentityList
      birthDate={props.hasBirthDate ? { year: 1962, month: 6, day: 22 } : null}
      currentPosition={props.currentPosition || null}
      grade={props.grade || null}
      positionDuration={
        props.hasPositionDuration && <FormattedPositionDuration value={{ year: 2022, month: 9, day: 1 }} />
      }
      rank={props.rank || null}
      targetedGrade={props.targetedGrade || null}
      targetedPosition={props.targetedPosition || null}
    />
  );
}

const meta = {
  title: 'Shared/IdentityList',
  component: IdentityListStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    currentPosition: 'Avocat général CC PARIS',
    grade: 'G3sup',
    hasBirthDate: true,
    hasPositionDuration: true,
    rank: '(2 sur une liste de 6)',
    targetedGrade: 'G3sup',
    targetedPosition: 'Premier avocat général CC PARIS',
  },
} satisfies Meta<typeof IdentityListStory>;

export default meta;

export const Playground: StoryObj<typeof meta> = {};
