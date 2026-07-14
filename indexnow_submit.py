#!/usr/bin/env python3
"""Submit changed URLs to IndexNow for pmmastery.app.

Usage:
    python indexnow_submit.py <url-or-path> [<url-or-path> ...] [--dry-run]

Each arg is a full https URL or a site path (e.g. /blog/foo), which gets
prefixed with https://pmmastery.app. Reads the IndexNow key from the
<32hex>.txt key file in this repo root. Prints the HTTP status; exits nonzero
on failure. Pass --dry-run to preview the payload without submitting.
"""
import os
import re
import sys
import json
import urllib.request
import urllib.error

HOST = "pmmastery.app"
BASE = "https://" + HOST
ENDPOINT = "https://api.indexnow.org/indexnow"
REPO_ROOT = os.path.dirname(os.path.abspath(__file__))


def find_key():
    for name in os.listdir(REPO_ROOT):
        if re.fullmatch(r"[0-9a-fA-F]{32}\.txt", name):
            return os.path.splitext(name)[0]
    return None


def to_url(arg):
    if arg.startswith("http://") or arg.startswith("https://"):
        return arg
    return BASE + ("" if arg.startswith("/") else "/") + arg


def main():
    raw = sys.argv[1:]
    dry = "--dry-run" in raw
    args = [a for a in raw if a != "--dry-run"]
    if not args:
        print("usage: python indexnow_submit.py <url-or-path> [...] [--dry-run]")
        return 2

    key = find_key()
    if not key:
        print("ERROR: no IndexNow key file (<32hex>.txt) found in repo root")
        return 1

    body = {
        "host": HOST,
        "key": key,
        "keyLocation": f"{BASE}/{key}.txt",
        "urlList": [to_url(a) for a in args],
    }
    payload = json.dumps(body, indent=2)
    print(payload)
    if dry:
        print("(dry-run, not submitted)")
        return 0

    req = urllib.request.Request(
        ENDPOINT,
        data=payload.encode("utf-8"),
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            code = resp.getcode()
            print(f"HTTP {code} {getattr(resp, 'reason', '')}".rstrip())
            return 0 if 200 <= code < 300 else 1
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code} {e.reason}")
        return 1
    except Exception as e:
        print(f"ERROR: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
