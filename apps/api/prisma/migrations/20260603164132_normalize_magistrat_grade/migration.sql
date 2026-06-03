begin;

update nominations_context.magistrat set grade = 'G3sup' where grade = 'G3cc';

update nominations_context.magistrat
  set grade = coalesce(g.mass_grade_id, g.grade)
from data_administration_context.grade as g
where exists (
  select 1 from data_administration_context.grade
  where (
    nominations_context.magistrat.grade = data_administration_context.grade.grade
    and data_administration_context.grade.mass_grade_id is not null
  )
);

commit;