import * as time from '../../../utils/time';
import { Clock } from '../clock';

/**
 * a screenshot removed from a text is marked detached rather than deleted: an undo brings it back.
 * The cleanup of the unused files purges the ones detached for longer than this
 */
const DETACHED_SCREENSHOT_RETENTION_MS = 30 * time.DAYS;

export function purgeDetachedBefore(clock: Clock): Date {
  return new Date(clock.now().getTime() - DETACHED_SCREENSHOT_RETENTION_MS);
}
