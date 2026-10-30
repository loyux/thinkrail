#!/usr/bin/env bash
set -euo pipefail

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Synchronization requires a clean disposable checkout." >&2
  exit 1
fi

if [[ "$(git rev-parse --is-shallow-repository)" == true ]]; then
  echo "Synchronization requires full Git history." >&2
  exit 1
fi

git fetch --no-tags origin \
  refs/heads/main:refs/remotes/origin/main \
  refs/heads/phone-web:refs/remotes/origin/phone-web
git fetch --no-tags upstream refs/heads/main:refs/remotes/upstream/main

merge_into() {
  local branch="$1"
  local source="$2"
  git switch --detach "origin/$branch"
  if ! git merge --no-edit "$source"; then
    git merge --abort
    echo "Cannot merge $source into $branch. Resolve the conflict manually and rerun synchronization." >&2
    exit 1
  fi
  git push origin "HEAD:refs/heads/$branch"
}

merge_into main upstream/main
main_commit=$(git rev-parse HEAD)
merge_into phone-web "$main_commit"
