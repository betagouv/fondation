import z from 'zod';

import * as time from 'src/utils/time';

export const LOLFI_FLUSH_TRANSACTION = { maxWait: 5 * time.SECONDS, timeout: 20 * time.SECONDS };

export const RawLolfiDate = z
  .string()
  .trim()
  .regex(/\d\d\/\d\d\/\d{4}/, {
    error: ({ input }) => `DD/MM/YYYY attendu vs. "${input}"`,
  })
  .transform((x) => {
    const [date, month, year] = x.split('/');
    return new Date(`${year}-${month}-${date}`);
  })
  .pipe(z.date());
