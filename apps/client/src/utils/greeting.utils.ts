import { defineMessages } from 'react-intl';

export type Greeting = 'DAY' | 'EVENING';

export const GreetingMessages = defineMessages({
  DAY: { defaultMessage: 'Bonjour, {civility}' },
  EVENING: { defaultMessage: 'Bonsoir, {civility}' },
} satisfies Record<Greeting, { defaultMessage: string }>);

export function greetingAt(now: Date): Greeting {
  const hour = now.getHours();
  return hour >= 6 && hour < 18 ? 'DAY' : 'EVENING';
}
