-- FON-572 read the validation from validated_at without copying is_validated into it: the sessions validated before
-- were taken for new ones. Their real validation date is lost, their creation stands in for it
UPDATE "nominations_context"."session"
SET "validated_at" = "created_at"
WHERE "is_validated" AND "validated_at" IS NULL;
