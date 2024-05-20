#!/usr/bin/env bash

# note: realpath isn't always installed, so use pwd in subshell instead
script_dir="$( cd "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )" || exit 1
cd "$script_dir" || exit 1

git diff-index --quiet HEAD --
has_changes=$?

if [ $has_changes == 1 ]; then
	echo "Must commit all changes before publishing"
	exit 1
fi

# bump the version for npm
echo "What type of update is this?"
echo "Options are: A (major), I (minor), P (patch)"

read -p "Type: " -n 1 -r
echo ''

version=
if [[ $REPLY =~ ^[Aa]$ ]]; then
	version=$(npm version major)
elif [[ $REPLY =~ ^[Ii]$ ]]; then
	version=$(npm version minor)
elif [[ $REPLY =~ ^[Pp]$ ]]; then
	version=$(npm version patch)
else
	echo "Invalid option provided as update type. Valid options are: A, I, P."
	exit 1
fi

if [ -z "$version" ]; then
	echo "Failed to update version."
	exit 1
fi

git push \
	|| { echo "git push failed"; exit 1; }

npm publish --access public \
	|| { echo "publish failed"; exit 1; }

echo "Successfully published config-builder $version"
