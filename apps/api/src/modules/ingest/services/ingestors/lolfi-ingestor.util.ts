import z from 'zod';

export const LOLFI_FLUSH_TRANSACTION = { maxWait: 5_000, timeout: 20_000 };

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
