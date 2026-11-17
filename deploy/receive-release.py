#!/usr/bin/python3
"""Receive a static build through a restricted deployment SSH key."""

import datetime
import fcntl
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile

BASE = Path('/var/www/wingsluo-live')
command = os.environ.get('SSH_ORIGINAL_COMMAND', '')
match = re.fullmatch(r'deploy ([0-9a-f]{40})', command)
if not match:
    sys.exit('Only deploy <commit SHA> is permitted.')
sha = match.group(1)

with (BASE / '.deploy.lock').open('w') as lock:
    fcntl.flock(lock, fcntl.LOCK_EX)
    staging = Path(tempfile.mkdtemp(prefix='.incoming-', dir=BASE))
    previous = (BASE / 'current').resolve() if (BASE / 'current').exists() else None
    switched = False
    try:
        # Store a bounded archive first so validation completes before extraction.
        archive_path = staging / 'build.tar.gz'
        with archive_path.open('wb') as output:
            total = 0
            while chunk := sys.stdin.buffer.read(1024 * 1024):
                total += len(chunk)
                if total > 512 * 1024 * 1024:
                    raise ValueError('Build archive exceeds 512 MiB.')
                output.write(chunk)
        content = staging / 'site'
        content.mkdir()
        with tarfile.open(archive_path, 'r:gz') as archive:
            members = archive.getmembers()
            if sum(member.size for member in members) > 2 * 1024**3:
                raise ValueError('Extracted build exceeds 2 GiB.')
            for member in members:
                if not (member.isfile() or member.isdir()):
                    raise ValueError('Only regular files and directories are allowed.')
                target = (content / member.name).resolve()
                if not target.is_relative_to(content.resolve()):
                    raise ValueError('Archive path escapes release directory.')
            archive.extractall(content, members=members, filter='data')
        for required in ['index.html', '404.html', '_astro', 'pagefind']:
            if not (content / required).exists():
                raise ValueError('Build is missing ' + required)
        stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
        metadata = {'commit': sha, 'deployedAt': stamp}
        (content / 'deployment.json').write_text(json.dumps(metadata) + '\n')
        for item in content.rglob('*'):
            item.chmod(0o755 if item.is_dir() else 0o644)
        content.chmod(0o755)
        release = BASE / 'releases' / (stamp + '-' + sha[:12])
        content.rename(release)
        next_link = BASE / '.next'
        next_link.unlink(missing_ok=True)
        next_link.symlink_to(release)
        os.replace(next_link, BASE / 'current')
        switched = True
        result = subprocess.run([
            'curl', '--fail', '--silent', '--show-error', '--max-time', '20',
            '--noproxy', '*', '--resolve', 'wingsluo.com:443:127.0.0.1',
            'https://wingsluo.com/deployment.json',
        ], check=True, capture_output=True, text=True)
        if json.loads(result.stdout).get('commit') != sha:
            raise ValueError('Origin health check returned a different release.')
        if previous:
            previous_link = BASE / 'previous'
            previous_link.unlink(missing_ok=True)
            previous_link.symlink_to(previous)
        keep = {release.resolve(), previous} if previous else {release.resolve()}
        releases = sorted((BASE / 'releases').iterdir(), reverse=True)
        keep.update(path.resolve() for path in releases[:5])
        for old in releases:
            if old.is_dir() and not old.is_symlink() and old.resolve() not in keep:
                shutil.rmtree(old)
        print('Deployed ' + sha)
    except Exception:
        if switched and previous:
            recovery = BASE / '.rollback'
            recovery.unlink(missing_ok=True)
            recovery.symlink_to(previous)
            os.replace(recovery, BASE / 'current')
        raise
    finally:
        shutil.rmtree(staging, ignore_errors=True)
