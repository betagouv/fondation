import z from 'zod';

export const RawLolfiDate = z
  .string()
  .trim()
  .regex(/\d\d\/\d\d\/\d{4}/, {
    error: ({ input }) => `date au format JJ/MM/AAAA attendue, "${input}" reçu`,
  })
  .transform((x) => {
    const [date, month, year] = x.split('/');
    return new Date(`${year}-${month}-${date}`);
  })
  .pipe(z.date());
