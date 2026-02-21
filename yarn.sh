#!/usr/bin/env bash

# note: realpath isn't always installed, so use pwd in subshell instead
script_dir="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )" || exit 1

interactive=
if [ -t 1 ] ; then
	interactive=-it
fi

exec docker run --rm \
	--mount "type=bind,src=$script_dir,dst=/workspace" \
	--workdir=/workspace \
	$interactive \
	--entrypoint=yarn \
	node:lts \
	"$@"
