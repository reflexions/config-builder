#!/usr/bin/env bash

# note: realpath isn't always installed, so use pwd in subshell instead
script_dir="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )" || exit 1

exec "${script_dir}/yarn.sh" install
