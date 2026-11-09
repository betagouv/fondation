# Données fictives

Le local et staging ne contiennent aucune personne réelle. On y ingère une archive LOLFI fictive,
toujours la même. Ses volumes sont calqués sur la prod au 06/11/2026. Ses juridictions et ses fonctions
sont réelles alors que ses magistrats sont inventés. Les cas rares que l'application traite à part
(audition, fiche de juridiction, détachement, outre-mer) y sont garantis.

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

# 3. Copier les comptes hors du dépôt, pour pouvoir les remettre en cas de problème
pg_dump "$DATABASE_URL" --data-only --column-inserts -t identity_and_access_context.users > ~/comptes-staging.sql

# 4. Vérifier ce qui serait effacé, puis effacer
node apps/api/scripts/empty-local-or-staging-except-accounts.mjs
node apps/api/scripts/empty-local-or-staging-except-accounts.mjs --confirm fondation_a_3234
```

Enfin, envoyer les deux archives dans l'ordre par la page "Importer une archive LOLFI" de staging. Supprimer
`~/comptes-staging.sql`, qui contient les empreintes des mots de passe puis fermer les deux terminaux.
