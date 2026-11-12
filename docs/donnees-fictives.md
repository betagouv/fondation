# Données fictives

Le local et staging ne contiennent aucune personne réelle. On y ingère une archive LOLFI fictive,
toujours la même. Ses volumes sont calqués sur la prod au 06/11/2026. Ses juridictions et ses fonctions
sont réelles alors que ses magistrats sont inventés. Les cas rares que l'application traite à part
(audition, fiche de juridiction, détachement, outre-mer) y sont garantis. Le poste actuel de chaque
magistrat suit le nombre de titulaires par sorte de poste relevé en prod au 12/11/2026. Les titulaires de
la veille des postes (Cour de cassation, premiers présidents de cour d'appel, présidents de tribunal
judiciaire) sont placés exactement comme en prod, avec leurs âges, leur ancienneté et leurs positions
administratives. Leurs chiffres sont dans
[veille-des-postes-shape.ts](../packages/lolfi/fictitious-archive/veille-des-postes-shape.ts).

```bash
pnpm --filter lolfi generate:fictitious-archive
```

La commande écrit deux archives dans `packages/lolfi`. `LOLFI_CSM_fictitious.zip` s'envoie d'abord.
`LOLFI_CSM_fictitious_departures.zip` s'envoie une fois la première ingestion terminée. Elle retire
444 magistrats du fichier, comme dans la prod. Ils deviennent alors inactifs. Renvoyer la première
archive les rend de nouveau actifs.

Les archives s'envoient avec un compte administrateur, par le menu "Administration" puis "Importer une
archive LOLFI" ([/admin/lolfi](http://localhost:5173/admin/lolfi) en local). Le suivi est sur
`/admin/ingestions`.

Sur staging, un job peut rester plusieurs minutes "en attente" de son conteneur. Envoyer la seconde
archive avant le succès de la première peut les faire passer dans le désordre.

## Remesurer la prod

Les titulaires par sorte de poste (`holders` de
[position-kinds.json](../packages/lolfi/fictitious-archive/referential/position-kinds.json)) et les chiffres
de la veille des postes se relèvent en prod, en lecture seule. On ne relève que des comptes, des parts et
des déciles, jamais une valeur propre à une personne. Les déciles ne se publient que pour un groupe d'au
moins 30 magistrats. Le dépôt est public.

Chaque requête s'écrit dans un fichier puis se lance depuis un terminal, la transaction étant forcée en
lecture seule.

```bash
scalingo --region osc-secnum-fr1 --app fondation-api-production run --file requete.sql \
  'PGOPTIONS="-c default_transaction_read_only=on" psql -P pager=off "$SCALINGO_POSTGRESQL_URL" -f /tmp/uploads/requete.sql'
```

Titulaires actifs par sorte de poste :

```sql
SELECT p.function_id, p.jurisdiction_type_id, p.grade_id, COUNT(m.id) AS holders
FROM data_administration_context.position AS p
  INNER JOIN data_administration_context.magistrat AS m
    ON m.current_position_id = p.id::TEXT AND m.status = 'ACTIVE'
GROUP BY 1, 2, 3 ORDER BY 1, 2, 3;
```

Chiffres de la veille des postes, par poste :

```sql
WITH veille AS (
  SELECT p.function_id || ' ' || p.jurisdiction_type_id AS poste, m.*,
    EXTRACT(EPOCH FROM AGE(m.birth_date)) / 31557600 AS age,
    EXTRACT(EPOCH FROM AGE(m.installation_date)) / 31557600 AS anciennete
  FROM data_administration_context.magistrat AS m
    INNER JOIN data_administration_context.position AS p ON p.id = NULLIF(m.current_position_id, '')::INT
  WHERE m.status = 'ACTIVE' AND (
    (p.jurisdiction_type_id = 'CC' AND p.function_id IN ('ACC', 'C', 'C SE', 'CR', 'PC', 'PP'))
    OR (p.jurisdiction_type_id = 'CA' AND p.function_id = 'PP')
    OR (p.jurisdiction_type_id = 'TJ' AND p.function_id = 'P'))
)
SELECT poste, COUNT(*) AS titulaires,
  ROUND(100.0 * COUNT(installation_date) / COUNT(*)) AS pct_dates,
  PERCENTILE_CONT(ARRAY[0.1, 0.5, 0.9]) WITHIN GROUP (ORDER BY age)::NUMERIC(4, 1)[] AS ages,
  PERCENTILE_CONT(ARRAY[0.1, 0.5, 0.9]) WITHIN GROUP (ORDER BY anciennete)::NUMERIC(4, 1)[] AS anciennete,
  COUNT(*) FILTER (WHERE age >= 67) AS au_dela_de_67,
  COUNT(*) FILTER (WHERE anciennete BETWEEN 6.5 AND 7) AS pres_de_7_ans,
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM data_administration_context.nomination AS n WHERE n.magistrat_id = veille.external_id
  )) AS en_session
FROM veille GROUP BY 1 ORDER BY 1;
```

La même table `veille` donne les positions administratives (`GROUP BY admin_position`). Pour un groupe de
moins de 30 magistrats, seuls les comptes s'écrivent dans le générateur.

## Remettre à zéro

Le script [empty-local-or-staging-except-accounts.mjs](../apps/api/scripts/empty-local-or-staging-except-accounts.mjs)
vide les sessions et ce qui en découle. Cela comprend les copies LOLFI, les magistrats, les dossiers,
les rapports, les documents, les observations, les auditions, les ingestions et leurs fichiers. Il garde
les comptes de connexion, le centre d'aide et ses fichiers, les retours, les avis et les contacts du
ministère. Les juridictions exclues des membres sont effacées avec les juridictions qu'elles référencent.
Il refuse toute autre base que celle du local ou de staging. Il n'efface rien sans `--confirm` suivi du
nom de la base. Il ne se lance jamais pendant une ingestion.

### En local

```bash
pnpm --filter api local:empty-except-accounts                      # affiche ce qui serait effacé
pnpm --filter api local:empty-except-accounts --confirm fondation  # efface
```

Puis on réingère les deux archives.

### Sur staging

Le script se lance depuis un poste car il n'est pas livré sur Scalingo. Dans un premier terminal, ouvrir
un tunnel vers la base avec la clé SSH déclarée sur Scalingo.

```bash
scalingo --region osc-secnum-fr1 --app fondation-api-staging db-tunnel -i ~/.ssh/<clé> --port 10055 SCALINGO_POSTGRESQL_URL
```

Dans un second terminal, depuis la racine du dépôt, lancer les commandes suivantes.

```bash
staging() { scalingo --region osc-secnum-fr1 --app fondation-api-staging "$@"; }

# 1. Sauvegarder la base (l'identifiant de l'addon est donné par `staging addons`)
staging --addon <addon> backups-create

# 2. Pointer le script sur staging, à travers le tunnel
export DATABASE_URL=$(staging env-get SCALINGO_POSTGRESQL_URL | sed -E 's#@[^/]+/#@127.0.0.1:10055/#; s#\?.*##')
export S3_BUCKET=$(staging env-get S3_BUCKET)
export S3_ACCESS_KEY=$(staging env-get S3_ACCESS_KEY)
export S3_SECRET_KEY=$(staging env-get S3_SECRET_KEY)

# 3. Copier les comptes hors du dépôt pour pouvoir les remettre en cas de problème
pg_dump "$DATABASE_URL" --data-only --column-inserts -t identity_and_access_context.users > ~/comptes-staging.sql

# 4. Vérifier ce qui serait effacé, puis effacer
node apps/api/scripts/empty-local-or-staging-except-accounts.mjs
node apps/api/scripts/empty-local-or-staging-except-accounts.mjs --confirm fondation_a_3234
```

Enfin, envoyer les deux archives dans l'ordre par la page "Importer une archive LOLFI" de staging. Supprimer
`~/comptes-staging.sql`, qui contient les empreintes des mots de passe puis fermer les deux terminaux.
