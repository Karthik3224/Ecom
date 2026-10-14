#!/usr/bin/env bash
set -euo pipefail
printf 'OS: '; cat /etc/os-release
uname -m
free -m
df -h / /var
java -version
command -v systemctl nginx mysql sha256sum curl
mysql --version
systemctl --version | head -n 1
test -d "${RELEASE_DIR:?explicit immutable release directory required}"
cd "$RELEASE_DIR"
sha256sum --check SHA256SUMS
echo 'File preflight only. Database identity, restore evidence, migrations and deployment approval are separate gates.'
