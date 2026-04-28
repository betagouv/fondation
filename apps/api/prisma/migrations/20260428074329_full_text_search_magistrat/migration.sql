BEGIN;

CREATE TEXT SEARCH CONFIGURATION unaccent_fr ( COPY = french );

ALTER TEXT SEARCH CONFIGURATION unaccent_fr
  ALTER MAPPING FOR hword, hword_part, word
  WITH unaccent, french_stem;

ALTER TABLE "nominations_context"."magistrat" ADD COLUMN
  "search" TSVECTOR GENERATED ALWAYS AS (
    SETWEIGHT(TO_TSVECTOR('unaccent_fr', LOWER(COALESCE("first_name", ''))), 'A') ||
    SETWEIGHT(TO_TSVECTOR('unaccent_fr', LOWER(COALESCE("used_name", ''))), 'A') ||
    SETWEIGHT(TO_TSVECTOR('unaccent_fr', LOWER(COALESCE("last_name", ''))), 'B') ||
    SETWEIGHT(TO_TSVECTOR('unaccent_fr', LOWER(COALESCE("professional_email", ''))), 'C')
  ) STORED;

CREATE INDEX magistrat_search_idx_gin ON "nominations_context"."magistrat" USING GIN(search);

COMMIT;
