BEGIN;

-- Names are neither stemmed nor dropped as French stop words: "le" must find LEROY, "ma" MARTIN
CREATE TEXT SEARCH CONFIGURATION unaccent_simple ( COPY = simple );

ALTER TEXT SEARCH CONFIGURATION unaccent_simple
  ALTER MAPPING FOR hword, hword_part, word
  WITH unaccent, simple;

-- PostgreSQL 16 cannot change the expression of a generated column: it is dropped, with its index, then added back
ALTER TABLE "nominations_context"."magistrat" DROP COLUMN "search";

ALTER TABLE "nominations_context"."magistrat" ADD COLUMN "search" TSVECTOR GENERATED ALWAYS AS (
    SETWEIGHT(TO_TSVECTOR('unaccent_simple'::regconfig, LOWER(COALESCE("first_name", ''))), 'A') ||
    SETWEIGHT(TO_TSVECTOR('unaccent_simple'::regconfig, LOWER(COALESCE("used_name", ''))), 'A') ||
    SETWEIGHT(TO_TSVECTOR('unaccent_simple'::regconfig, LOWER(COALESCE("last_name", ''))), 'B') ||
    SETWEIGHT(TO_TSVECTOR('unaccent_simple'::regconfig, LOWER(COALESCE("married_name", ''))), 'B') ||
    SETWEIGHT(TO_TSVECTOR('unaccent_simple'::regconfig, LOWER(COALESCE("professional_email", ''))), 'C')
) STORED;

CREATE INDEX "magistrat_search_idx_gin" ON "nominations_context"."magistrat" USING GIN ("search");

COMMIT;
