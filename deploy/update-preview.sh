#!/usr/bin/env bash
set -euo pipefail

# Install this file as /usr/local/bin/blog-preview-update (mode 0755).
# Build the server's saved working copy and update its private preview.
if [[ "${1:-}" != "--worker" ]]; then
    if (( $# != 0 )); then
        printf 'Usage: blog-preview-update\n' >&2
        exit 2
    fi
    if (( EUID != 0 )); then
        printf 'Please run: sudo blog-preview-update\n' >&2
        exit 1
    fi
    printf '正在构建私人预览。首次运行需要安装依赖，请等待完成。\n'
    exec systemd-run --quiet --wait --pipe --collect \
        --unit=wingsluo-preview-build \
        --property=MemoryMax=900M \
        --property=MemorySwapMax=1G \
        --property=CPUQuota=100% \
        --property=OOMPolicy=stop \
        --property=RuntimeMaxSec=20min \
        /bin/bash "$(readlink -f "$0")" --worker
fi

exec 9>/run/lock/wingsluo-preview-build.lock
if ! flock -n 9; then
    printf '已有构建正在运行，请等待它完成。\n' >&2
    exit 1
fi

export PATH="/opt/node-v24.22.2-linux-x64/bin:$PATH"
export NODE_OPTIONS="--max-old-space-size=512"
export ASTRO_TELEMETRY_DISABLED=1
export UV_THREADPOOL_SIZE=2
export MAKEFLAGS=-j1

cd /srv/wingsluo.com
trap 'printf "更新失败，原有私人预览保留。请查看上方报错。\n" >&2' ERR

node --version
deps_fingerprint=$(cat package.json package-lock.json .nvmrc | sha256sum | cut -d ' ' -f 1)
if [[ ! -x node_modules/.bin/astro ]] || \
   [[ ! -f node_modules/.wingsluo-preview-deps ]] || \
   [[ "$(cat node_modules/.wingsluo-preview-deps)" != "$deps_fingerprint" ]]; then
    npm ci --no-audit --no-fund
    printf '%s' "$deps_fingerprint" > node_modules/.wingsluo-preview-deps
fi

npm run build

# Construct a separate release; switch the symlink only after validation.
python3 - <<'PY'
from pathlib import Path
from datetime import datetime
import os
import shutil
import tempfile
import uuid

source = Path('/srv/wingsluo.com/dist')
required = ['index.html', '404.html', 'rss.xml', 'search/index.html', 'pagefind/pagefind.js']
for name in required:
    if not (source / name).is_file():
        raise SystemExit('Missing build output: ' + name)

base = Path('/var/www/wingsluo.com')
release = Path(tempfile.mkdtemp(prefix=datetime.now().strftime('%Y%m%d-%H%M%S-preview-'), dir=base / 'releases'))
shutil.copytree(source, release, dirs_exist_ok=True)
for directory, _, files in os.walk(release):
    os.chmod(directory, 0o755)
    for name in files:
        os.chmod(Path(directory) / name, 0o644)

temporary = base / ('.preview-next-' + uuid.uuid4().hex)
try:
    temporary.symlink_to(release)
    os.replace(temporary, base / 'preview')
finally:
    temporary.unlink(missing_ok=True)
print('私人预览已更新。刷新浏览器即可查看。', flush=True)
print('Release: ' + str(release), flush=True)
PY
