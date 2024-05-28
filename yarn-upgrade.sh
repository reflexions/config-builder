#!/usr/bin/env bash

# note: realpath isn't always installed, so use pwd in subshell instead
script_dir="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )" || exit 1
cd "$script_dir" || exit 1

docker pull node:lts
exec docker run --rm -it --mount "type=bind,src=$script_dir,dst=/workspace" node:lts bash -c "cd /workspace && yarn upgrade-interactive --latest"
