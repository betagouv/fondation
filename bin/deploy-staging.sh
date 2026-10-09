#!/bin/bash
# Usage: bin/deploy-staging.sh [tag]
# Without a tag, increments the highest staging tag pushed on origin.
set -euo pipefail

# Must match the tag triggers of .github/workflows/release-staging.yml
TAG_FORMAT='^IT[0-9]+S[0-9]+(-[0-9]+)?$'

if [[ -n $(git status --porcelain) ]]; then
  echo "The working tree is not clean, commit or stash your changes first." >&2
  exit 1
fi

git checkout --quiet develop
git pull --quiet --ff-only origin develop

last=$(git ls-remote --tags --refs origin 'IT*' | sed 's|.*refs/tags/||' | grep -E "$TAG_FORMAT" | sort -V | tail -n1 || true)

if [[ $# -gt 0 ]]; then
  next=$1
elif [[ $last =~ ^(.+)-([0-9]+)$ ]]; then
  next="${BASH_REMATCH[1]}-$((BASH_REMATCH[2] + 1))"
else
  next="$last-1"
fi

if [[ ! $next =~ $TAG_FORMAT ]]; then
  echo "$next does not match IT<n>S<n> or IT<n>S<n>-<n>, the deployment would not start." >&2
  exit 1
fi

# The team's deployment procedure asks to wait a minute after the merge on develop.
remaining=$((60 - $(date +%s) + $(git log -1 --format=%ct)))
if ((remaining > 0)); then
  echo "Develop was just updated, waiting ${remaining}s…"
  sleep "$remaining"
fi

echo "Last staging tag: ${last:-none}"
echo "Commit:           $(git log -1 --format='%h %s')"
read -rp "Push $next to deploy staging? [y/N] " answer
[[ $answer == [yY] ]] || exit 0

git tag -a "$next" -m "$next"
git push origin "$next" || {
  git tag -d "$next"
  exit 1
}

echo "Follow the deployment on https://github.com/betagouv/fondation/actions/workflows/release-staging.yml"
