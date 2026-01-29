BEGIN;

-- AlterTable
ALTER TABLE nominations_context.dossier_de_nomination ADD COLUMN sortable_targeted_grade SMALLINT;

UPDATE nominations_context.dossier_de_nomination SET sortable_targeted_grade = (
  CASE
    WHEN targeted_grade = 'G3sup' THEN 35
    WHEN targeted_grade = 'G3' THEN 30
    WHEN targeted_grade = 'G2' THEN 20
    WHEN targeted_grade = 'G1' THEN 10

    WHEN targeted_grade = 'HH' THEN 3
    WHEN targeted_grade = 'I' THEN 2
    WHEN targeted_grade = 'II' THEN 1
    ELSE 0
  END
);

ALTER TABLE nominations_context.dossier_de_nomination ALTER COLUMN sortable_targeted_grade SET NOT NULL;

-- CreateIndex
CREATE INDEX dossier_de_nomination_sortable_targeted_grade_idx ON nominations_context.dossier_de_nomination (
  sortable_targeted_grade
);

COMMIT;
