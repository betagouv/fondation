import { compareDateOnly, type PlainDateOnly } from '@/utils/date-only.util';

// the business needs answers by the end of October 2026: until then, those who never answered are asked more often
const CAMPAIGN_END: PlainDateOnly = { day: 31, month: 10, year: 2026 };
const DAYS_BETWEEN_CAMPAIGN_INVITATIONS = 2;
const DAYS_BETWEEN_ANSWERS = 30;
const DAYS_AFTER_A_LATER = 7;

const INVITED_ON_KEY = 'feedback-invited-on';

function daysBetween(from: PlainDateOnly | null, to: PlainDateOnly): number {
  if (!from) return Infinity;
  return (
    (Date.UTC(to.year, to.month - 1, to.day) - Date.UTC(from.year, from.month - 1, from.day)) / 86_400_000
  );
}

export function isInvitationDue(props: {
  lastAnsweredOn: PlainDateOnly | null;
  lastInvitedOn: PlainDateOnly | null;
  today: PlainDateOnly;
}): boolean {
  const daysSinceInvitation = daysBetween(props.lastInvitedOn, props.today);
  if (compareDateOnly(props.today, CAMPAIGN_END) <= 0)
    return !props.lastAnsweredOn && daysSinceInvitation >= DAYS_BETWEEN_CAMPAIGN_INVITATIONS;

  return (
    daysBetween(props.lastAnsweredOn, props.today) >= DAYS_BETWEEN_ANSWERS &&
    daysSinceInvitation >= DAYS_AFTER_A_LATER
  );
}

export function today(): PlainDateOnly {
  const now = new Date();
  return { day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear() };
}

// the browser only remembers when it last asked: another computer may ask again sooner, which an invitation can afford
export function readLastInvitedOn(userId: string): PlainDateOnly | null {
  try {
    const stored = localStorage.getItem(`${INVITED_ON_KEY}:${userId}`);
    return stored ? (JSON.parse(stored) as PlainDateOnly) : null;
  } catch {
    return null;
  }
}

export function rememberInvitation(userId: string, invitedOn: PlainDateOnly): void {
  try {
    localStorage.setItem(`${INVITED_ON_KEY}:${userId}`, JSON.stringify(invitedOn));
  } catch {
    // without storage, the invitation comes back at the next opportunity
  }
}
