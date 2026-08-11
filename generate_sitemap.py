#!/usr/bin/env python3
"""Refresh <lastmod> dates in sitemap.xml from git history.

Usage:
    python generate_sitemap.py [--dry-run]

Updates ONLY the text inside existing <lastmod>...</lastmod> tags, one per
<url> block. It never adds or removes <url> blocks -- which pages appear in
the sitemap stays a human decision. Each URL is mapped to its local file and
dated by that file's last commit date (git log -1 --format=%cs). A file with
no commits yet falls back to its mtime date, so running this before committing
a brand-new post gives that post today's date.

Any <loc> that cannot be mapped to a file on disk, and any <url> block missing
a <lastmod>, is an error: nothing is written and the exit code is nonzero.
Pass --dry-run to see the same table without writing.
"""
import os
import re
import sys
import shutil
import subprocess
from datetime import date
from pathlib import Path

SITE_ROOT = Path(__file__).resolve().parent
SITEMAP = SITE_ROOT / "sitemap.xml"
BASE = "https://pmmastery.app"

URL_BLOCK_RE = re.compile(r"<url>.*?</url>", re.DOTALL)
LOC_RE = re.compile(r"<loc>(.*?)</loc>", re.DOTALL)
LASTMOD_RE = re.compile(r"(<lastmod>)(.*?)(</lastmod>)", re.DOTALL)

GIT_FALLBACK = r"C:\Program Files\Git\cmd\git.exe"


def find_git():
    if os.path.exists(GIT_FALLBACK):
        return GIT_FALLBACK
    return shutil.which("git")


def resolve_loc(loc):
    """Map a sitemap <loc> to a local file, or None if it does not resolve."""
    if not loc.startswith(BASE):
        return None
    rel = loc[len(BASE):].strip("/")
    if not rel:
        candidates = [SITE_ROOT / "index.html"]
    else:
        parts = rel.split("/")
        candidates = [
            SITE_ROOT.joinpath(*parts[:-1], parts[-1] + ".html"),
            SITE_ROOT.joinpath(*parts, "index.html"),
        ]
    for path in candidates:
        if path.is_file():
            return path
    return None


def git_date(git, path):
    """Last-commit date (YYYY-MM-DD) for path, or None if never committed."""
    rel = path.relative_to(SITE_ROOT).as_posix()
    proc = subprocess.run(
        [git, "-C", str(SITE_ROOT), "log", "-1", "--format=%cs", "--", rel],
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    if proc.returncode != 0:
        return None
    out = proc.stdout.strip()
    return out or None


def mtime_date(path):
    return date.fromtimestamp(path.stat().st_mtime).isoformat()


def main():
    argv = sys.argv[1:]
    dry = "--dry-run" in argv
    unknown = [a for a in argv if a != "--dry-run"]
    if unknown:
        print("usage: python generate_sitemap.py [--dry-run]")
        return 2

    git = find_git()
    if not git:
        print("ERROR: git not found (looked at %s and on PATH)" % GIT_FALLBACK)
        return 1

    if not SITEMAP.is_file():
        print("ERROR: %s not found" % SITEMAP)
        return 1

    with open(SITEMAP, "r", encoding="utf-8", newline="") as f:
        text = f.read()

    errors = []
    rows = []

    def handle_block(match):
        block = match.group(0)
        loc_m = LOC_RE.search(block)
        if not loc_m:
            errors.append("<url> block has no <loc>: %s" % block.strip())
            return block
        loc = loc_m.group(1).strip()

        lastmod_m = LASTMOD_RE.search(block)
        if not lastmod_m:
            errors.append("no <lastmod> tag: %s" % loc)
            return block
        old = lastmod_m.group(2).strip()

        path = resolve_loc(loc)
        if path is None:
            errors.append("could not resolve to a local file: %s" % loc)
            return block

        note = ""
        new = git_date(git, path)
        if new is None:
            new = mtime_date(path)
            note = " (uncommitted, used mtime)"

        status = ("ok" if new == old else "updated") + note
        rows.append((loc, old, new, status))
        if new == old:
            return block
        return LASTMOD_RE.sub(
            lambda m: m.group(1) + new + m.group(3), block, count=1
        )

    new_text = URL_BLOCK_RE.sub(handle_block, text)

    if errors:
        print("ERRORS -- nothing written:")
        for e in errors:
            print("  %s" % e)
        return 1

    width = max((len(loc) for loc, _, _, _ in rows), default=0)
    for loc, old, new, status in rows:
        print("%-*s  %s -> %s  %s" % (width, loc, old, new, status))

    changed = sum(1 for _, old, new, _ in rows if old != new)
    mtimes = sum(1 for _, _, _, s in rows if "mtime" in s)
    print("")
    print("%d URLs, %d updated, %d unchanged, %d dated from mtime"
          % (len(rows), changed, len(rows) - changed, mtimes))

    if dry:
        print("(dry-run, sitemap.xml not written)")
        return 0

    if new_text == text:
        print("sitemap.xml already up to date")
        return 0

    with open(SITEMAP, "w", encoding="utf-8", newline="") as f:
        f.write(new_text)
    print("wrote sitemap.xml")
    return 0


if __name__ == "__main__":
    sys.exit(main())
