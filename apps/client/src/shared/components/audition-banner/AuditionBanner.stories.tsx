import Button from '@codegouvfr/react-dsfr/Button';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AuditionBanner } from './AuditionBanner';

const UPCOMING_AT = new Date('2029-06-15T14:30').getTime();
const PAST_AT = new Date('2020-01-10T14:30').getTime();

function AuditionBannerStory(props: { at: number | null; withAction: boolean }) {
  const at = props.at ? new Date(props.at) : null;
  const date = at ? { year: at.getFullYear(), month: at.getMonth() + 1, day: at.getDate() } : null;
  const time = at ? { hours: at.getHours(), minutes: at.getMinutes(), seconds: 0 } : null;

  return (
    <AuditionBanner className="rounded px-4 py-3" date={date} time={time}>
      {props.withAction && (
        <Button className="ml-auto underline" priority="tertiary no outline" size="small">
          Modifier
        </Button>
      )}
    </AuditionBanner>
  );
}

const meta = {
  title: 'Shared/AuditionBanner',
  component: AuditionBannerStory,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  argTypes: {
    at: { control: 'date' },
    withAction: { control: 'boolean' },
  },
  args: { at: UPCOMING_AT, withAction: false },
} satisfies Meta<typeof AuditionBannerStory>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Upcoming: Story = {};

export const Past: Story = { args: { at: PAST_AT } };

export const WithAction: Story = { args: { withAction: true } };
