-- left over from the Drizzle migrations, it only exists in the databases created before Prisma
DROP INDEX IF EXISTS "nominations_context"."idx_one_brouillon_per_session";
