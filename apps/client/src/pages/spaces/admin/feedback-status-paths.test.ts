import { describe, expect, it } from 'vitest';

import { feedbackStatusOf, feedbackStatusPath } from './feedback-status-paths';

describe('feedback status paths', () => {
  it('reads back the status of its path', () => {
    const path = feedbackStatusPath('ACKNOWLEDGED');

    expect(path).toBe('/admin/retours/pris-en-compte');
    expect(feedbackStatusOf(path.split('/').at(-1))).toBe('ACKNOWLEDGED');
  });

  it('knows no status for an unknown or missing slug, which the page sends to the new feedbacks', () => {
    expect(feedbackStatusOf('archives')).toBeUndefined();
    expect(feedbackStatusOf(undefined)).toBeUndefined();
  });
});
