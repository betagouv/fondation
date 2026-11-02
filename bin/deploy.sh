#!/bin/bash
# Deploys staging and production step by step, without touching the current checkout.
# The production runbook: https://app.notion.com/p/1b665210f6b64b34b86d25819dca7715
set -euo pipefail
# Without it, bash ignores set -e inside $(...) and keeps going after a failed command.
shopt -s inherit_errexit

# Must match the tag triggers of .github/workflows/release-staging.yml
readonly TAG_FORMAT='^IT([0-9]+)S([0-9]+)(-([0-9]+))?$'
readonly ALIGNMENT_BRANCH_PREFIX=chore/aligns-production-on-develop-
readonly STAGING_WORKFLOW=release-staging.yml
readonly PRODUCTION_WORKFLOW=release-production.yml
readonly PRODUCTION_URL=https://fondation-webapp-production.osc-secnum-fr1.scalingo.io
readonly RUNBOOK_URL=https://app.notion.com/p/1b665210f6b64b34b86d25819dca7715
readonly HOLIDAYS_URL=https://calendrier.api.gouv.fr/jours-feries/metropole
readonly MIGRATIONS=apps/api/prisma/migrations
readonly SDV_RELAY_SCRIPT=apps/api/scripts/send-to-scalingo.sh

die() {
  echo "$*" >&2
  exit 1
}

nothing_new() {
  echo "Rien de nouveau depuis $1."
  exit 0
}

require() {
  local tool
  for tool; do
    command -v "$tool" >/dev/null || die "$tool est requis pour cette action."
  done
}

confirm() {
  local answer
  read -rp "$1 [o/N] " answer
  [[ $answer == [oOyY] ]]
}

# Prints the 1-based index of the chosen option, the first one by default.
choose() {
  local prompt=$1 answer option i=1
  shift
  for option; do
    echo "  $i) $option" >&2
    i=$((i + 1))
  done
  while read -rp "$prompt [1] " answer; do
    answer=${answer:-1}
    if [[ $answer =~ ^[0-9]+$ ]] && ((answer >= 1 && answer <= $#)); then
      echo "$answer"
      return
    fi
  done
  exit 1
}

latest_tag() {
  local tags
  tags=$(git tag --merged "$1" --sort=-creatordate)
  grep -E -m1 "$TAG_FORMAT" <<<"$tags"
}

show_changes() {
  local changes
  changes=$(git log --first-parent --format='  %h %s' "$1..$2")
  [[ -n $changes ]] || nothing_new "$1"
  echo "Ce qui part depuis $1 :"
  echo "$changes"
}

# Prints the id of the first run of the workflow that is not the previous one.
wait_for_new_run() {
  local workflow=$1 previous=$2 id attempt
  shift 2
  for attempt in {1..30}; do
    id=$(gh run list --workflow "$workflow" --limit 1 --json databaseId --jq '.[0].databaseId // empty' "$@")
    if [[ -n $id && $id != "$previous" ]]; then
      echo "$id"
      return
    fi
    sleep 2
  done
  die "Le run de $workflow n'apparaît pas, suis-le sur GitHub Actions."
}

watch_run() {
  gh run watch "$1" --compact --exit-status --interval 10
}

staging() {
  local remote_tags last next options tags index run
  remote_tags=$(git ls-remote --tags --refs origin 'IT*')
  last=$(sed 's|.*refs/tags/||' <<<"$remote_tags" | grep -E "$TAG_FORMAT" | sort -V | tail -n1 || true)
  [[ $last =~ $TAG_FORMAT ]] || die "Aucun tag de staging trouvé."
  local iteration=${BASH_REMATCH[1]} sprint=${BASH_REMATCH[2]} build=${BASH_REMATCH[4]:-0}

  show_changes "$last" origin/develop

  tags=("IT${iteration}S${sprint}-$((build + 1))" "IT${iteration}S$((sprint + 1))" "IT$((iteration + 1))S1")
  options=("${tags[0]} (build suivant)" "${tags[1]} (sprint suivant)" "${tags[2]} (itération suivante)" "Autre")
  index=$(choose "Tag à poser sur origin/develop :" "${options[@]}")
  if ((index == 4)); then
    read -rp "Tag : " next
  else
    next=${tags[index - 1]}
  fi
  [[ $next =~ $TAG_FORMAT ]] || die "$next ne suit pas IT<n>S<n> ou IT<n>S<n>-<n>, le déploiement ne partirait pas."
  ! git rev-parse --quiet --verify "refs/tags/$next" >/dev/null || die "Le tag $next existe déjà."

  confirm "Pousser $next pour déployer staging ?" || exit 0
  git tag -a "$next" -m "$next" origin/develop
  git push --quiet origin "refs/tags/$next" || {
    git tag -d "$next"
    exit 1
  }

  if command -v gh >/dev/null; then
    run=$(wait_for_new_run "$STAGING_WORKFLOW" "" --branch "$next")
    watch_run "$run"
  else
    echo "Suis le déploiement sur https://github.com/betagouv/fondation/actions/workflows/$STAGING_WORKFLOW"
  fi
}

# Prints "<number> <branch> <head sha>" of each open alignment PR.
alignment_pr() {
  gh pr list --base production --state open --json number,headRefName,headRefOid \
    --jq ".[] | select(.headRefName | startswith(\"$ALIGNMENT_BRANCH_PREFIX\")) | \"\(.number) \(.headRefName) \(.headRefOid)\""
}

migrations_with_status() {
  git diff --no-renames --diff-filter="$1" --name-only origin/production "$2" -- "$MIGRATIONS/*/migration.sql" |
    sed -E 's|.*/migrations/([^/]+)/.*|  \1|'
}

report_migrations() {
  local added changed
  added=$(migrations_with_status A "$1")
  changed=$(migrations_with_status M "$1")
  if [[ -n $added ]]; then
    echo "Migrations ajoutées :"
    echo "$added"
    echo "Répète sur une copie de la production celles qui déplacent ou suppriment des données : $RUNBOOK_URL"
  fi
  if [[ -n $changed ]]; then
    echo "Attention, migrations déjà en production modifiées :"
    echo "$changed"
  fi
}

prepare() {
  require gh
  local production_tag staging_runs tags=() tag index merged_tree commit branch open_pr open_number open_branch url
  production_tag=$(latest_tag origin/production)

  staging_runs=$(gh run list --workflow "$STAGING_WORKFLOW" --status success --limit 30 --json headBranch --jq '.[].headBranch')
  while read -r tag; do
    if [[ $tag =~ $TAG_FORMAT && " ${tags[*]} " != *" $tag "* ]] && ! git merge-base --is-ancestor "$tag" origin/production; then
      tags+=("$tag")
    fi
  done <<<"$staging_runs"
  ((${#tags[@]})) || nothing_new "$production_tag"

  echo "Tags passés sur staging, absents de production :"
  index=$(choose "Tag à mettre en production :" "${tags[@]}")
  tag=${tags[index - 1]}

  show_changes "$production_tag" "$tag"
  report_migrations "$tag"

  merged_tree=$(git merge-tree --write-tree --no-messages "$tag" origin/production | head -n1 || true)
  if [[ $merged_tree != "$(git rev-parse "$tag^{tree}")" ]]; then
    echo "production contient des changements absents de $tag, à faire passer par develop :" >&2
    git log --no-merges --cherry-pick --right-only --format='  %h %s' "$tag...origin/production" >&2
    exit 1
  fi

  confirm "Ouvrir la PR d'alignement de production sur $tag ?" || exit 0
  commit=$(git commit-tree "$merged_tree" -p "$tag^{commit}" -p origin/production -m "chore: aligns production on develop")
  branch=$ALIGNMENT_BRANCH_PREFIX${tag,,}
  open_pr=$(alignment_pr)
  read -r open_number open_branch _ <<<"$open_pr"
  git push --quiet --force origin "$commit:refs/heads/$branch"

  if [[ $open_branch == "$branch" ]]; then
    url=$(gh pr view "$open_number" --json url --jq .url)
  else
    url=$(gh pr create --base production --head "$branch" \
      --title "chore(FON-000): aligns production on develop" \
      --body "Release of $tag: production gets develop as tested on staging")
    if [[ -n $open_number ]]; then
      gh pr close "$open_number" --delete-branch --comment "Replaced by $url"
    fi
  fi
  echo "PR d'alignement : $url"
}

warn_outside_slot() {
  local holidays
  holidays=$(curl -fsS --max-time 5 "$HOLIDAYS_URL/$(date +%Y).json" || true)
  if (($(date +%u) > 5)) || [[ $(date +%H) != 07 || $holidays == *"\"$(date +%F)\""* ]]; then
    echo "Attention : on n'est pas un jour ouvré entre 7 h et 8 h, des utilisateurs peuvent être connectés."
  fi
}

scalingo_postgresql() {
  scalingo --region osc-secnum-fr1 --app fondation-api-production --addon postgresql "$@"
}

# Prints "id<TAB>created at<TAB>status" of the given backup, or of the most recent one.
# The CLI ignores --format json for backups: only its table can be read.
backup_row() {
  scalingo_postgresql backups |
    sed $'s/\x1b\\[[0-9;]*m//g' |
    awk -F' *│ *' -v id="${1:-}" '$2 ~ /^[0-9a-f]+$/ && (id == "" || $2 == id) && !found++ { print $2 "\t" $3 "\t" $5 }'
}

start_backup() {
  local row id created status
  row=$(backup_row)
  IFS=$'\t' read -r id created status <<<"$row"
  case $status in
    done)
      # Scalingo backup ids are MongoDB ObjectIds: their first 4 bytes are the creation time.
      if (($(date +%s) - 16#${id:0:8} < 3600)) && confirm "Réutiliser la sauvegarde $id du $created ?"; then
        echo "$id"
        return
      fi
      ;;
    pending | running)
      echo "Sauvegarde $id déjà en cours." >&2
      echo "$id"
      return
      ;;
  esac
  scalingo_postgresql backups-create >&2
  local previous=$id
  until [[ $id != "$previous" ]]; do
    sleep 2
    id=$(backup_row | cut -f1)
  done
  echo "$id"
}

wait_for_backup() {
  local status
  while :; do
    status=$(backup_row "$1" | cut -f3)
    case $status in
      done) return ;;
      error) die "La sauvegarde $1 a échoué." ;;
    esac
    echo "Sauvegarde $1 : ${status:-introuvable}, nouvel essai dans 15 s."
    sleep 15
  done
}

follow_production() {
  local run=$1 tag=$2 deployed_sha=$3 backup=$4
  if ! watch_run "$run"; then
    echo "Le déploiement a échoué. Les migrations ne se défont pas : le seul retour arrière est la sauvegarde du jour, $backup."
    echo "Rien n'a été restauré. Voir la section « Retour arrière » : $RUNBOOK_URL"
    exit 1
  fi
  echo "Déploiement terminé, à vérifier :"
  echo "  - la version $tag dans le footer de $PRODUCTION_URL ;"
  echo "  - une session, un ODJ, un PV, une notice et une fiche magistrat existants ;"
  if ! git diff --quiet "$deployed_sha" "$tag" -- "$SDV_RELAY_SCRIPT"; then
    echo "  - $SDV_RELAY_SCRIPT a changé : recopie-le sur le relais SDV, empreinte attendue $(git show "$tag:$SDV_RELAY_SCRIPT" | sha256sum | cut -c1-12) ;"
  fi
  echo "  - demain, l'ingestion dans $PRODUCTION_URL/admin/jobs."
}

release() {
  require gh scalingo
  warn_outside_slot
  local production_sha deployed_sha deployed_tag open_pr number head_sha tag last_run run_id run_sha run_status backup answer
  production_sha=$(git rev-parse origin/production)
  deployed_sha=$(gh run list --workflow "$PRODUCTION_WORKFLOW" --status success --limit 1 --json headSha --jq '.[0].headSha')
  deployed_tag=$(latest_tag "$deployed_sha")
  open_pr=$(alignment_pr)
  read -r number _ head_sha <<<"$open_pr"
  tag=$(latest_tag "${head_sha:-origin/production}")

  last_run=$(gh run list --workflow "$PRODUCTION_WORKFLOW" --limit 1 \
    --json databaseId,headSha,status --jq '.[0] | "\(.databaseId) \(.headSha) \(.status)"')
  read -r run_id run_sha run_status <<<"$last_run"
  if [[ $run_status != completed && $run_sha == "$production_sha" ]]; then
    echo "Le déploiement de $tag est déjà en cours."
    backup=$(backup_row | cut -f1)
  else
    if [[ -z $number && $deployed_sha == "$production_sha" ]]; then
      nothing_new "$deployed_tag"
    fi
    show_changes "$deployed_tag" "$tag"
    echo "Vérifie que l'ingestion du jour est terminée : $PRODUCTION_URL/admin/jobs"
    confirm "Ingestion du jour terminée ?" || exit 0

    backup=$(start_backup)
    if [[ -n $number ]]; then
      gh pr merge "$number" --merge
      git fetch --quiet origin production
    fi
    wait_for_backup "$backup"

    read -rp "Sauvegarde $backup terminée. Retape $tag pour lancer le déploiement de production : " answer
    [[ $answer == "$tag" ]] || die "Déploiement abandonné."
    gh workflow run "$PRODUCTION_WORKFLOW" --ref production
    run_id=$(wait_for_new_run "$PRODUCTION_WORKFLOW" "$run_id")
  fi
  follow_production "$run_id" "$tag" "$deployed_sha" "$backup"
}

git fetch --quiet --tags origin
case $(choose "Que veux-tu faire ?" "Staging" "Préparer la mise en production" "Mettre en production") in
  1) staging ;;
  2) prepare ;;
  3) release ;;
esac
