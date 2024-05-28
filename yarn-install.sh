#!/usr/bin/env bash

# note: realpath isn't always installed, so use pwd in subshell instead
script_dir="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )" || exit 1

docker run -it --rm \
	-v "$script_dir/:/app" \
	--entrypoint=bash \
	node:lts \
	-c \
	"cd /app && yarn install"
