/** 
 * Mesure d'impact de FONDATION. On utilise les 2 dernières années calendaires
 */ 

---

/** 
 * Pour chaque "grande transparence" (> 50 dossiers),
 * la date de restitution auprès de la DSJ
 */

with
  "session" as (
    select
      "session"."id",
      "session"."created_at",
      "session"."name",
      count(ddn.id) as "files_count"

    from nominations_context.session
      inner join nominations_context.dossier_de_nomination ddn on ddn.session_id = "session".id

    where
      "session".deleted_at is null
      AND "session".created_at >=
      -- start of last year
      ((extract (year from current_date)::int - 1) || '-01-01')::date

    group by "session".id

    having count(ddn.id) > 50
  )

select
  to_char("session"."created_at", 'DD/MM/YYYY') as "date de la session",
  "session"."name" as "nom de la session",
  "session"."files_count" as "nb. de dossiers",
  official_report.session_meeting_date "dates de restitution"
from
  "session"
  inner join docs.agenda on "session"."id" = docs.agenda.session_id
  inner join docs.official_report on docs.agenda.official_report_id = docs.official_report.id
order by "session"."created_at";

---

/** mesure du temps moyen de traitement d'une proposition */

with
  reported_sessions as (
    select "session".id, "session".created_at, "session"."name", count("dossier_de_nomination".id) as files_count
    from nominations_context.session
      inner join nominations_context."dossier_de_nomination" on "dossier_de_nomination".session_id = "session".id

    where
      "session"."created_at" >= ((extract (year from current_date)::int - 1) || '-01-01')::date
      and "session".deleted_at is null
      and (
        "session"."archived_at" is not null
        or exists (
          select 1
          from
            nominations_context.dossier_de_nomination _ddn
            left join docs.official_report_nomination_file ornf on ornf.nomination_file_id = _ddn.id
          where
            _ddn.session_id = "session".id
            and (ornf.id is null or ornf.outcome = 'SUSPENDED')
        )
      )
    
    group by "session".id

    order by "session"."created_at"
  ),

  time_per_file as (
    select
      "reported_sessions".id as "session_id",
      "reported_sessions"."name" as "session_name",
      ornf."nomination_file_id" as "nomination_file_id",
      (official_report.session_meeting_date)::timestamp - reported_sessions.created_at
        AS nomination_file_life_time

    from reported_sessions
      inner join docs.agenda on agenda.session_id = reported_sessions.id
      inner join docs.official_report on official_report.id = agenda.official_report_id
      inner join docs.official_report_nomination_file ornf on (
        ornf.official_report_id = official_report.id
        and ornf.outcome != 'SUSPENDED'
      )
  )

select
  "session_id" as "ID session",
  "session_name" as "Nom de la session",
  AVG(nomination_file_life_time) AS "temps d'étude moyen par dossier"
from time_per_file
group by "session_id", "session_name";

---

/** taux de rapports affectés / taux de rapports finalisés */

with
  month_window as (
    select
      generate_series(
        -- start of last year
        ((extract (year from current_date)::int - 1) || '-01-01')::date,
        current_date,
        interval '1 month'
      ) as "date"
  )

select
  to_char(month_window."date", 'DD/MM/YYYY') as "start",
  to_char(
    month_window."date" + interval '1 month' - interval '1 day',
    'DD/MM/YYYY'
  ) as "end",

  count("reports"."id") as total_reports,
  count("reports"."id") filter (
    where
      ("reports"."state" != 'NEW' or LENGTH(TRIM("reports"."comment")) != 0)
      and exists (
        select 1
        from nominations_context.dossier_de_nomination ddn
        where ddn.id = reports.nomination_file_id and ddn.outcome is not null
      )
  ) as reported_file_count

from month_window
  left join reports_context.reports on (
    reports.is_deleted = false
    and reports.created_at >= month_window."date"
    and reports.created_at < month_window."date" + interval '1 month'
  )

group by month_window."date"

order by month_window."date" desc;

---

/** Nb. de nouveau dossiers par mois */

with
  month_window as (
    select
      generate_series(
        -- start of last year
        ((extract (year from current_date)::int - 1) || '-01-01')::date,
        current_date,
        interval '1 month'
      ) as "date"
  )

select
  to_char(month_window."date", 'DD/MM/YYYY') as "start",
  to_char(
    month_window."date" + interval '1 month' - interval '1 day',
    'DD/MM/YYYY'
  ) as "end",
  files_count.total AS "Nouveau dossier"

from
  month_window
  left join lateral (
    select count(ddn.id) as total
    from nominations_context.session
      inner join nominations_context.dossier_de_nomination ddn on ddn.session_id = "session".id
    where
      "session".deleted_at is null
      and ddn.created_at >= month_window."date"
      and ddn.created_at < (month_window."date" + interval '1 month')
  ) as files_count on true;

---

/** Mesure des sessions actives */

with month_range as (
  select generate_series (
    ((extract (year from current_date))::int || '-01-01')::date,
    current_date,
    '1 month'::interval
  ) as "date"
)

select
  to_char("date", 'MM/YYYY') as "date",
  potential_count as "total",
  potential_member_count as "membres",
  potential_sg_count as "sg"
from
  month_range
  left join lateral (
    select
      count(distinct s.user_id) as potential_count,
      count(distinct s.user_id) filter (where u.role != ALL('{ADMIN,ADJOINT_SECRETAIRE_GENERAL}'::identity_and_access_context.role[])) as potential_member_count,
      count(distinct s.user_id) filter (where u.role = ANY('{ADMIN,ADJOINT_SECRETAIRE_GENERAL}'::identity_and_access_context.role[])) as potential_sg_count

    from identity_and_access_context.sessions s
      inner join identity_and_access_context.users u on u.id = s.user_id
    where
      (s.created_at >= month_range."date" and s.created_at < (month_range."date" + '1 month'::interval))
      or (s.expires_at >= month_range."date" and s.expires_at < (month_range."date" + '1 month'::interval))
  ) on true;
