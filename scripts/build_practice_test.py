"""Free PMP practice test: picker (Phase A) and page builder (Phase B).

Spec: Claude Rules and PM Mastery State/specs/2026-10-07-practice-test.md

  python scripts/build_practice_test.py pick

`pick` reads the app repo question files and never writes to the app repo. It
writes only the review file. `build` is Phase B and is not implemented yet.
"""

import argparse
import json
import os
import random
import sys
from collections import Counter

APP = r"C:\Users\georg\pmp-study-assistant"
REVIEW_DEFAULT = os.path.join(
    APP, "Claude Rules and PM Mastery State", "specs",
    "2026-10-07-practice-test-picks.md")
SEED = "pmm-practice-test-2026-10"
CASE_ID = "CS036"

DOMAIN_QUOTA = {"people": 7, "process": 8, "business_environment": 5}
ALT_DOMAIN_QUOTA = {"people": 3, "process": 4, "business_environment": 3}
DIFF_QUOTA = {"Easy": 5, "Medium": 9, "Hard": 6}
MIN_SCENARIO = 14
ALT_MIN_SCENARIO = 7
MIN_APPROACH = 4
APPROACHES = ("predictive", "agile", "hybrid")


def load(*parts):
    with open(os.path.join(APP, *parts), encoding="utf-8") as f:
        return json.load(f)


def expl_text(q):
    e = q["explanation"]
    return e if isinstance(e, str) else (e.get("correct_answer") or "")


def eligible(q, excluded_ids):
    return (
        not q.get("retired")
        and q.get("active") is not False
        and q.get("exam_version") == "2026"
        and "format" not in q
        and q.get("type", "") in ("", "multiple_choice")
        and not q.get("duplicate_of")
        and isinstance(q.get("options"), dict) and len(q["options"]) == 4
        and isinstance(q.get("correct_answer"), str)
        and len(q["correct_answer"]) == 1
        and len(expl_text(q)) >= 200
        and q["id"] not in excluded_ids
    )


def try_pick(pool, rng, domain_quota, diff_quota, need_spread):
    """One greedy pass over a shuffled pool. Returns a list or None."""
    order = pool[:]
    rng.shuffle(order)
    n = sum(domain_quota.values())
    dom, diff, tasks, picks = Counter(), Counter(), set(), []
    standard = 0
    max_std = n - (MIN_SCENARIO if need_spread else ALT_MIN_SCENARIO)
    for q in order:
        d, df, t = q["domain_2026"], q["difficulty"], q["task_2026"]
        if dom[d] >= domain_quota.get(d, 0):
            continue
        if diff_quota and diff[df] >= diff_quota.get(df, 0):
            continue
        if t in tasks:
            continue
        is_std = q["question_type"] != "scenario"
        if is_std and standard >= max_std:
            continue
        dom[d] += 1
        diff[df] += 1
        tasks.add(t)
        standard += is_std
        picks.append(q)
        if len(picks) == n:
            break
    if len(picks) != n:
        return None
    if need_spread:
        ap = Counter(q["delivery_approach"] for q in picks)
        if any(ap[a] < MIN_APPROACH for a in APPROACHES):
            return None
    return picks


def pick_set(pool, rng, domain_quota, diff_quota, need_spread):
    for attempt in range(1, 20001):
        got = try_pick(pool, rng, domain_quota, diff_quota, need_spread)
        if got:
            return got, attempt
    sys.exit("could not satisfy quotas")


def fmt_expl(q):
    e = q["explanation"]
    if isinstance(e, str):
        return e
    out = [e.get("correct_answer", "")]
    wrong = e.get("why_others_wrong") or {}
    if isinstance(wrong, dict) and wrong:
        out.append("\n".join("- %s: %s" % (k, wrong[k]) for k in sorted(wrong)))
    return "\n\n".join(out)


def render_q(num, role, q):
    meta = [
        "id: %s" % q["id"],
        "domain: %s" % q["domain_2026"],
        "difficulty: %s" % q.get("difficulty", ""),
        "question_type: %s" % q.get("question_type", "(case study)"),
        "task_2026: %s" % q.get("task_2026", ""),
        "delivery_approach: %s" % q.get("delivery_approach", ""),
    ]
    lines = ["### %s. %s" % (num, role), "", " | ".join(meta), "", q["question"], ""]
    for k in sorted(q["options"]):
        lines.append("- %s. %s" % (k, q["options"][k]))
    lines += ["", "Correct: **%s**" % q["correct_answer"], "", "Explanation:", "",
              fmt_expl(q), ""]
    return "\n".join(lines)


def tally(title, items):
    dom = Counter(q["domain_2026"] for q in items)
    diff = Counter(q["difficulty"] for q in items)
    typ = Counter(q["question_type"] for q in items)
    ap = Counter(q["delivery_approach"] for q in items)
    tasks = Counter(q["task_2026"] for q in items)
    dup = sorted(t for t, c in tasks.items() if c > 1)
    return [
        "**%s (%d)**" % (title, len(items)),
        "- Domain: " + ", ".join("%s %d" % (k, dom[k]) for k in DOMAIN_QUOTA),
        "- Difficulty: " + ", ".join("%s %d" % (k, diff[k]) for k in DIFF_QUOTA),
        "- Type: scenario %d, standard %d" % (typ["scenario"], typ["standard"]),
        "- Approach: " + ", ".join("%s %d" % (k, ap[k]) for k in APPROACHES),
        "- Distinct tasks: %d of %d%s" % (
            len(tasks), len(items),
            (" (shared: %s)" % ", ".join(dup)) if dup else ""),
        "",
    ]


def check_case(cs):
    probs = []
    qs = cs["questions"]
    if len(qs) != 5:
        probs.append("expected 5 questions, found %d" % len(qs))
    for q in qs:
        if len(q.get("options", {})) != 4:
            probs.append("%s: options != 4" % q["id"])
        ca = q.get("correct_answer")
        if not (isinstance(ca, str) and len(ca) == 1 and ca in q.get("options", {})):
            probs.append("%s: bad correct_answer %r" % (q["id"], ca))
        if not (isinstance(q.get("explanation"), str) and q["explanation"].strip()):
            probs.append("%s: missing explanation" % q["id"])
    return probs


def cmd_pick(args):
    bank = load("data", "questions", "practice_questions.json")["questions"]
    excluded = set(load("data", "questions", "free_tier_pool.json")["question_ids"])
    excluded |= set(load("data", "questions", "anon_trial_pool.json")["question_ids"])
    pool = [q for q in bank if eligible(q, excluded)]
    rng = random.Random(SEED)

    picks, tries = pick_set(pool, rng, DOMAIN_QUOTA, DIFF_QUOTA, True)
    used = {q["id"] for q in picks}
    rest = [q for q in pool if q["id"] not in used]
    alts, alt_tries = pick_set(rest, rng, ALT_DOMAIN_QUOTA, None, False)

    cs = next(c for c in load("data", "case_studies", "case_studies.json")["case_studies"]
              if c["id"] == CASE_ID)
    probs = check_case(cs)

    dorder = {d: i for i, d in enumerate(DOMAIN_QUOTA)}
    picks.sort(key=lambda q: (dorder[q["domain_2026"]], q["id"]))
    alts.sort(key=lambda q: (dorder[q["domain_2026"]], q["id"]))

    L = ["# Practice test picks (Phase A review)", "",
         "Seed: `%s`. Eligible standalone pool: %d of %d bank items. "
         "Picks took %d pass(es), alternates %d." % (SEED, len(pool), len(bank), tries, alt_tries),
         "",
         "Eligibility notes: domain is the bank's `domain_2026` field. Retired means `retired` "
         "true; items with `active` false are also excluded. Explanation length is the "
         "`correct_answer` text inside the explanation (or the whole string when the explanation "
         "is a plain string). Excluded ids: free_tier_pool + anon_trial_pool.", "",
         "Alternates are unique on task_2026 among themselves but may share a task with a pick, "
         "because People has 8 tasks and 10 items are chosen. Alternates keep the 70% scenario "
         "ratio (at least 7 of 10). The spec did not constrain alternate difficulty or approach.", ""]
    L += tally("Picks", picks) + tally("Alternates", alts)
    L += ["Bank lint: skipped. `tools/bank_lint.py` has no per-id mode; it lints the whole bank "
          "and writes reports under the app repo.", ""]
    cdom = Counter(q["domain_2026"] for q in cs["questions"])
    L += ["## Case study %s: %s" % (cs["id"], cs["title"]), "",
          "Structure check: " + (
              "OK, 5 questions, each with 4 options, a single-letter answer and an explanation."
              if not probs else "PROBLEMS: " + "; ".join(probs)), "",
          "Question domains: " + ", ".join("%s %d" % kv for kv in cdom.items()), "",
          "Scenario:", "", cs["scenario"], ""]
    L.append("## Part 1 picks (20)\n")
    for i, q in enumerate(picks, 1):
        L.append(render_q("P%d" % i, "PICK", q))
    L.append("## Alternates (10)\n")
    for i, q in enumerate(alts, 1):
        L.append(render_q("A%d" % i, "ALTERNATE", q))
    L.append("## Case study questions (5)\n")
    for i, q in enumerate(cs["questions"], 1):
        L.append(render_q("CS%d" % i, "CASE STUDY", q))
    text = "\n".join(L)
    with open(args.review, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    print("pool %d of %d, pick passes %d, alt passes %d" % (len(pool), len(bank), tries, alt_tries))
    print("\n".join(tally("Picks", picks) + tally("Alternates", alts)))
    print("case study domains:", dict(cdom))
    print("case study problems:", probs or "none")
    print("em dash chars in review file:", text.count("\u2014"))
    print("review file:", args.review)


# ---------------------------------------------------------------- Phase B ---

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_OUT = os.path.join(SITE, "data", "practice-test-questions.json")
PAGE_OUT = os.path.join(SITE, "pmp-practice-test.html")

# Amendment A1: final 20 standalone ids. Swap ids here to change the set.
FINAL_IDS = {
    "people": [3241, 3854, 4195, 4400, 3154, 4488],
    "process": [1960, 3645, 3867, 3939, 4168, 4449, 4538],
    "business_environment": [3233, 3653, 3753, 4420, 4014, 4481, 4012],
}
DOMAIN_LABEL = {"people": "People", "process": "Process",
                "business_environment": "Business Environment"}
CASE_TITLE = "The Agile Rescue: Turning Around a Failing Predictive Project"
MIN_EXPL = 120

import html as _html
import re

_SPLIT = re.compile(r"(?<=[.!?])(\s+)(?=[A-Z0-9\"'(\[])")


def norm_dash(s):
    return re.sub(r"\s*—\s*", ", ", s)


def drop_pmbok(text, qid, dropped):
    """Drop every sentence containing PMBOK. Nothing else is reworded."""
    parts = _SPLIT.split(text.strip())
    sents = parts[0::2]
    seps = parts[1::2] + [""]
    out = []
    for s, sep in zip(sents, seps):
        if "pmbok" in s.lower():
            dropped.append((qid, s))
        else:
            out.append(s + sep)
    return "".join(out).strip()


def build_explanation(q, qid, dropped):
    e = q["explanation"]
    if isinstance(e, str):
        main, wrong = e, {}
    else:
        main, wrong = e.get("correct_answer", ""), e.get("why_others_wrong") or {}
    main = norm_dash(drop_pmbok(main, qid, dropped))
    paras = [main]
    if isinstance(wrong, dict):
        for k in sorted(wrong):
            w = norm_dash(drop_pmbok(wrong[k], qid, dropped))
            if w:
                paras.append("%s. %s" % (k, w))
    return main, "\n\n".join(paras)


def interleave(by_dom, rng):
    lists = {d: ids[:] for d, ids in by_dom.items()}
    for ids in lists.values():
        rng.shuffle(ids)
    order, last = [], None
    while any(lists.values()):
        cands = [d for d in lists if lists[d] and d != last] or [d for d in lists if lists[d]]
        top = max(len(lists[d]) for d in cands)
        d = rng.choice(sorted(d for d in cands if len(lists[d]) == top))
        order.append(lists[d].pop())
        last = d
    return order


def cmd_build(args):
    bank = {q["id"]: q for q in load("data", "questions", "practice_questions.json")["questions"]}
    cs = next(c for c in load("data", "case_studies", "case_studies.json")["case_studies"]
              if c["id"] == CASE_ID)
    dropped, short, pmbok_elsewhere = [], [], []

    ids = [i for d in FINAL_IDS.values() for i in d]
    if len(ids) != 20 or len(set(ids)) != 20:
        sys.exit("FINAL_IDS must hold 20 distinct ids")
    for i in ids:
        if i not in bank or not eligible(bank[i], set()):
            sys.exit("id %s missing or not eligible" % i)
    dom_of = {i: bank[i]["domain_2026"] for i in ids}
    for d, lst in FINAL_IDS.items():
        if any(dom_of[i] != d for i in lst):
            sys.exit("domain mismatch in FINAL_IDS for %s" % d)

    rng = random.Random(SEED + "-order")
    order = interleave(FINAL_IDS, rng)

    def item(src, qid, num):
        main, full = build_explanation(src, qid, dropped)
        if len(main) < MIN_EXPL:
            short.append((qid, len(main)))
        stem = norm_dash(src["question"])
        opts = {k: norm_dash(v) for k, v in sorted(src["options"].items())}
        for t in [stem] + list(opts.values()):
            if "pmbok" in t.lower():
                pmbok_elsewhere.append((qid, t[:80]))
        return {"number": num, "id": qid, "domain": src["domain_2026"],
                "difficulty": src.get("difficulty", ""), "question": stem,
                "options": opts, "correct": src["correct_answer"], "explanation": full}

    part1 = [item(bank[i], i, n) for n, i in enumerate(order, 1)]
    case = [item(q, q["id"], n) for n, q in enumerate(cs["questions"], 21)]
    if len(case) != 5:
        sys.exit("CS036 must have 5 questions")
    scenario = norm_dash(cs["scenario"])

    if short:
        print("STOP: explanation under %d characters after the PMBOK drop:" % MIN_EXPL)
        for qid, n in short:
            print("  %s: %d chars" % (qid, n))
        sys.exit(1)

    os.makedirs(os.path.dirname(DATA_OUT), exist_ok=True)
    doc = {"seed": SEED, "case_study": {"id": CASE_ID, "title": CASE_TITLE, "scenario": scenario},
           "part1": part1, "case": case}
    with open(DATA_OUT, "w", encoding="utf-8", newline="\n") as f:
        json.dump(doc, f, indent=1, ensure_ascii=False)
        f.write("\n")

    page = render_page(doc)
    with open(PAGE_OUT, "w", encoding="utf-8", newline="") as f:
        f.write(page.replace("\n", "\r\n"))

    print("dropped PMBOK sentences: %d" % len(dropped))
    for qid, s in dropped:
        print("  [%s] %s" % (qid, s))
    print("PMBOK in stems/options (not touched):", pmbok_elsewhere or "none")
    print("part 1 order:", order)
    print("wrote", DATA_OUT)
    print("wrote", PAGE_OUT, len(page), "chars")


def esc(s):
    return _html.escape(s, quote=True)


def render_scenario(text):
    out, buf, kind = [], [], None

    def flush():
        nonlocal buf, kind
        if not buf:
            return
        if kind == "ul":
            out.append("<ul>" + "".join("<li>%s</li>" % esc(b[2:]) for b in buf) + "</ul>")
        else:
            out.append("<p>%s</p>" % "<br>".join(esc(b) for b in buf))
        buf, kind = [], None

    for line in text.split("\n"):
        if not line.strip():
            flush()
            continue
        k = "ul" if line.startswith("- ") else "p"
        if k != kind:
            flush()
            kind = k
        buf.append(line.strip() if k == "p" else line)
    flush()
    return "\n".join(out)


def render_question(q):
    n = q["number"]
    opts = []
    for letter, text in q["options"].items():
        opts.append(
            '<label class="pt-opt" for="q%d-%s"><input type="radio" name="q%d" id="q%d-%s" value="%s">'
            '<span class="pt-letter">%s.</span><span class="pt-text">%s</span></label>'
            % (n, letter, n, n, letter, letter, letter, esc(text)))
    return ('<fieldset class="pt-q" id="pt-q%d" data-n="%d">\n<legend><span class="pt-num">%d.</span> %s</legend>\n%s\n</fieldset>'
            % (n, n, n, esc(q["question"]), "\n".join(opts)))


FAQ = [
    ("Is this PMP practice test free?",
     "Yes. It is free, with no signup and no email required. You get your score, a domain breakdown and every explanation as soon as you submit.",
     None),
    ("Do I need an account?",
     "No. Your answers are graded in your browser. A free PM Mastery account is optional, for when you want to keep practicing.",
     None),
    ("How many questions are on the real PMP exam?",
     "The exam has 180 questions (170 scored and 10 unscored pretest questions) in 240 minutes, with two 10-minute breaks.",
     None),
    ("Where can I take full-length PMP mock exams?",
     "PM Mastery paid plans include unlimited 180-question mock exams in the 2026 format. See the fact sheet for plans and prices.",
     ("fact sheet", "/facts")),
]

TITLE = "Free PMP Practice Test 2026 (with a Case Study) | PM Mastery"
DESC = ("Free PMP practice test for the 2026 exam: 20 questions plus a 5-question case study, "
        "weighted by exam domain. No signup, instant score and explanations.")
URL = "https://pmmastery.app/pmp-practice-test"


def render_page(doc):
    assert len(DESC) <= 155, len(DESC)
    with open(os.path.join(SITE, "index.html"), encoding="utf-8") as f:
        idx = f.read().replace("\r", "")
    a = idx.index("<!-- PostHog analytics -->")
    b = idx.index("<!-- /PostHog -->") + len("<!-- /PostHog -->")
    posthog = idx[a:b]

    faq_html, faq_ld = [], []
    for qn, ans, link in FAQ:
        body = esc(ans)
        if link:
            body = body.replace(esc(link[0]), '<a href="%s">%s</a>' % (link[1], esc(link[0])))
        faq_html.append('<div class="pt-faq"><h3>%s</h3><p>%s</p></div>' % (esc(qn), body))
        faq_ld.append({"@type": "Question", "name": qn,
                       "acceptedAnswer": {"@type": "Answer", "text": ans}})

    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "WebPage", "url": URL, "name": TITLE, "description": DESC,
         "dateModified": "2026-10-07"},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://pmmastery.app/"},
            {"@type": "ListItem", "position": 2, "name": "Free PMP Practice Test", "item": URL}]},
        {"@type": "FAQPage", "mainEntity": faq_ld}]}
    ld_json = json.dumps(ld, indent=4, ensure_ascii=False).replace("</", "<\\/")

    keyed = [{"number": q["number"], "correct": q["correct"], "domain": q["domain"],
              "explanation": q["explanation"]} for q in doc["part1"] + doc["case"]]
    key_json = json.dumps(keyed, ensure_ascii=True).replace("</", "<\\/")

    with open(os.path.join(SITE, "facts.html"), encoding="utf-8") as f:
        facts = f.read().replace("\r", "")
    nav = facts[facts.index("    <!-- Navigation -->"):facts.index("    <!-- Facts Header -->")]
    footer = facts[facts.index("    <footer class=\"footer\">"):facts.index("    <!-- Custom JavaScript -->")]

    reps = {
        "%%TITLE%%": esc(TITLE), "%%DESC%%": esc(DESC), "%%URL%%": URL,
        "%%POSTHOG%%": posthog, "%%LD%%": ld_json, "%%NAV%%": nav.rstrip("\n"),
        "%%FOOTER%%": footer.rstrip("\n"),
        "%%PART1%%": "\n".join(render_question(q) for q in doc["part1"]),
        "%%CASETITLE%%": esc(doc["case_study"]["title"]),
        "%%SCENARIO%%": render_scenario(doc["case_study"]["scenario"]),
        "%%PART2%%": "\n".join(render_question(q) for q in doc["case"]),
        "%%FAQ%%": "\n".join(faq_html), "%%KEY%%": key_json,
    }
    page = PAGE_TEMPLATE
    for k, v in reps.items():
        page = page.replace(k, v)
    assert "%%" not in page
    return page


PAGE_TEMPLATE = r"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="%%DESC%%">
    <title>%%TITLE%%</title>

    <link rel="canonical" href="%%URL%%">

    <meta property="og:type" content="website">
    <meta property="og:url" content="%%URL%%">
    <meta property="og:title" content="%%TITLE%%">
    <meta property="og:description" content="%%DESC%%">
    <meta property="og:image" content="https://pmmastery.app/og-image-v2.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:site_name" content="PM Mastery">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="%%URL%%">
    <meta name="twitter:title" content="%%TITLE%%">
    <meta name="twitter:description" content="%%DESC%%">
    <meta name="twitter:image" content="https://pmmastery.app/og-image-v2.png">

    <meta name="author" content="PM Mastery Solutions, LLC">
    <meta name="robots" content="index, follow">

    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" as="style">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%233B4C8B'/%3E%3Cpath d='M32 12 L48 40 L32 32 L16 40 Z' fill='%23C9A55C'/%3E%3C/svg%3E">

    <link rel="stylesheet" href="css/style.css?v=20261007">

    <script async src="https://www.googletagmanager.com/gtag/js?id=G-P0RSXYS7K8"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-P0RSXYS7K8');
    </script>

    <script type="application/ld+json">
%%LD%%
    </script>
    %%POSTHOG%%

    <style>
        .pt-wrap { max-width: 820px; margin: 0 auto; }
        .pt-hero { background: linear-gradient(135deg, #3B4C8B 0%, #2d3a6b 100%); color: #fff; padding: 72px 0 52px; }
        .pt-hero h1 { font-family: 'Montserrat', sans-serif; font-size: 2.4rem; font-weight: 800; margin: 0 0 16px; line-height: 1.15; color: #fff; }
        .pt-hero p { font-size: 1.15rem; line-height: 1.6; color: rgba(255,255,255,0.88); margin: 0; }
        .pt-section { padding: 40px 0; background: #fff; }
        .pt-section.alt { background: #f8f9fa; border-top: 1px solid #e9ecef; border-bottom: 1px solid #e9ecef; }
        .pt-section h2 { color: #3B4C8B; font-family: 'Montserrat', sans-serif; font-size: 1.6rem; margin: 0 0 16px; }
        .pt-section p, .pt-section li { font-size: 1.05rem; line-height: 1.75; color: #444; overflow-wrap: anywhere; }
        .pt-section p { margin: 0 0 14px; }
        .pt-scenario { border: 2px solid #3B4C8B; background: #f4f6fb; border-radius: 10px; padding: 18px 20px; margin: 0 0 24px; overflow-wrap: anywhere; }
        .pt-scenario h3 { margin: 0 0 10px; color: #3B4C8B; font-family: 'Montserrat', sans-serif; font-size: 1.15rem; }
        .pt-scenario p, .pt-scenario li { font-size: 1rem; line-height: 1.65; color: #333; margin: 0 0 10px; }
        .pt-scenario ul { margin: 0 0 10px; padding-left: 22px; }
        .pt-q { border: 1px solid #e1e4ea; border-left: 5px solid #e1e4ea; border-radius: 8px; padding: 16px 18px 12px; margin: 0 0 20px; background: #fff; min-width: 0; }
        .pt-q legend { float: left; width: 100%; padding: 0; margin: 0 0 12px; font-size: 1.08rem; line-height: 1.6; font-weight: 600; color: #2d3a6b; overflow-wrap: anywhere; }
        .pt-q legend + * { clear: both; }
        .pt-num { color: #C9A55C; margin-right: 4px; }
        .pt-opt { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; margin: 0 0 8px; border: 1px solid #e9ecef; border-radius: 8px; cursor: pointer; font-size: 1rem; line-height: 1.55; color: #333; }
        .pt-opt:hover { border-color: #C9A55C; background: #fffaf0; }
        .pt-opt input { margin-top: 5px; flex: 0 0 auto; }
        .pt-letter { font-weight: 700; color: #3B4C8B; flex: 0 0 auto; }
        .pt-text { min-width: 0; overflow-wrap: anywhere; }
        .pt-q.pt-right { border-left-color: #2e7d32; }
        .pt-q.pt-wrong { border-left-color: #c62828; }
        .pt-q.pt-done .pt-opt { cursor: default; }
        .pt-q.pt-done .pt-opt:hover { border-color: #e9ecef; background: transparent; }
        .pt-opt.pt-key { border-color: #2e7d32; background: #eef7ee; }
        .pt-mark { display: inline-block; margin-left: 8px; font-size: 1rem; }
        .pt-right .pt-mark { color: #2e7d32; }
        .pt-wrong .pt-mark { color: #c62828; }
        .pt-expl { margin-top: 12px; padding: 12px 14px; background: #f8f9fa; border-radius: 8px; font-size: 0.98rem; line-height: 1.65; color: #333; overflow-wrap: anywhere; }
        .pt-expl p { margin: 0 0 8px; font-size: 0.98rem; line-height: 1.65; }
        .pt-expl .pt-ans { font-weight: 700; color: #3B4C8B; }
        .pt-submit { background: #f4f6fb; border: 1px solid #dfe3f0; border-radius: 10px; padding: 18px 20px; margin: 24px 0 0; }
        .pt-btn { display: inline-block; border: 0; border-radius: 8px; padding: 12px 22px; font-size: 1rem; font-weight: 700; cursor: pointer; font-family: inherit; text-decoration: none; text-align: center; }
        .pt-btn-primary { background: #3B4C8B; color: #fff; }
        .pt-btn-primary:hover { background: #2d3a6b; }
        .pt-btn-gold { background: #C9A55C; color: #1f2a52; }
        .pt-btn-gold:hover { background: #d8b66d; }
        .pt-btn-ghost { background: #fff; color: #3B4C8B; border: 2px solid #3B4C8B; }
        .pt-count { display: inline-block; margin-left: 14px; color: #555; font-size: 0.98rem; }
        .pt-note { margin: 14px 0 0; padding: 12px 14px; background: #fff8e6; border-left: 4px solid #C9A55C; border-radius: 6px; font-size: 1rem; color: #444; }
        .pt-note .pt-btn { margin-top: 10px; display: block; }
        .pt-results { border: 2px solid #3B4C8B; border-radius: 12px; padding: 22px 22px 18px; margin: 0 0 28px; background: #fff; }
        .pt-results h2 { margin-top: 0; }
        .pt-score { font-family: 'Montserrat', sans-serif; font-size: 2rem; font-weight: 800; color: #3B4C8B; margin: 0 0 14px; }
        .pt-bar { margin: 0 0 12px; }
        .pt-bar-head { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 12px; font-size: 0.98rem; color: #333; margin: 0 0 4px; }
        .pt-bar-track { height: 14px; background: #e9ecef; border-radius: 7px; overflow: hidden; }
        .pt-bar-fill { height: 100%; background: #3B4C8B; border-radius: 7px; }
        .pt-weak { font-weight: 700; color: #2d3a6b; margin: 14px 0 6px; }
        .pt-honest { font-size: 0.98rem; color: #555; margin: 0 0 16px; }
        .pt-cta { background: #3B4C8B; color: #fff; border-radius: 10px; padding: 20px 22px; margin: 0 0 14px; }
        .pt-cta h3 { margin: 0 0 8px; color: #fff; font-family: 'Montserrat', sans-serif; font-size: 1.25rem; }
        .pt-cta p { color: rgba(255,255,255,0.9); margin: 0 0 14px; font-size: 1rem; line-height: 1.6; }
        .pt-cta .pt-links { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 18px; }
        .pt-cta .pt-links a.pt-plain { color: #fff; text-decoration: underline; }
        .pt-faq h3 { font-size: 1.1rem; color: #2d3a6b; margin: 18px 0 6px; }
        .pt-faq p { margin: 0 0 8px; }
        .pt-related { padding-left: 22px; }
        .pt-related a, .pt-section p a { color: #3B4C8B; font-weight: 600; }
        .pt-results, #pt-part1 { scroll-margin-top: 90px; }
        [hidden] { display: none !important; }
        @media (max-width: 600px) {
            .pt-hero { padding: 48px 0 36px; }
            .pt-hero h1 { font-size: 1.75rem; }
            .pt-hero p { font-size: 1.02rem; }
            .pt-q { padding: 14px 12px 8px; }
            .pt-count { display: block; margin: 10px 0 0; }
            .pt-btn { width: 100%; }
            .pt-results { padding: 16px 14px; }
        }
    </style>
</head>
<body>
%%NAV%%

    <section class="pt-hero">
        <div class="container">
            <div class="pt-wrap">
                <h1>Free PMP Practice Test for the 2026 Exam</h1>
                <p>25 questions in the 2026 format: 20 standalone questions weighted by exam domain, then one 5-question case study. No signup. You get your score, a domain breakdown and every explanation as soon as you submit. Plan on 30 to 40 minutes.</p>
            </div>
        </div>
    </section>

    <section class="pt-section">
        <div class="container">
            <div class="pt-wrap">
                <div id="pt-results" class="pt-results" tabindex="-1" hidden></div>
                <form id="pt-form" novalidate>
                    <h2 id="pt-part1">Part 1: 20 questions</h2>
%%PART1%%
                    <h2 id="pt-part2" style="margin-top: 36px;">Part 2: Case study</h2>
                    <div class="pt-scenario">
                        <h3>%%CASETITLE%%</h3>
%%SCENARIO%%
                    </div>
%%PART2%%
                    <div class="pt-submit">
                        <button type="button" id="pt-submit" class="pt-btn pt-btn-primary">Submit answers</button>
                        <span id="pt-count" class="pt-count" aria-live="polite">0 of 25 answered</span>
                        <div id="pt-blank" class="pt-note" hidden>
                            <span id="pt-blank-text"></span>
                            <button type="button" id="pt-confirm" class="pt-btn pt-btn-gold">Submit anyway</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </section>

    <section class="pt-section alt">
        <div class="container">
            <div class="pt-wrap">
                <h2>How this practice test works</h2>
                <p>The questions follow the 2026 Exam Content Outline weights: People 33%, Process 41%, Business Environment 26%. The 25 questions split 8 People, 10 Process and 7 Business Environment, as close to those weights as 25 questions allow.</p>
                <p>The test ends with a case study because case study questions, where several questions share one project scenario, are part of the new exam.</p>
            </div>
        </div>
    </section>

    <section class="pt-section">
        <div class="container">
            <div class="pt-wrap">
                <h2>What your score means</h2>
                <p>A 25-question sample can't predict whether you will pass. Use the domain breakdown to decide what to study next. Full 180-question mock exams are the better readiness check.</p>
            </div>
        </div>
    </section>

    <section class="pt-section alt">
        <div class="container">
            <div class="pt-wrap">
                <h2>FAQ</h2>
%%FAQ%%
            </div>
        </div>
    </section>

    <section class="pt-section">
        <div class="container">
            <div class="pt-wrap">
                <h2>Related</h2>
                <ul class="pt-related">
                    <li><a href="/blog/pmp-mock-exam-2026">What a 2026 PMP mock exam should look like</a></li>
                    <li><a href="/blog/best-pmp-practice-questions-2026">Best PMP practice questions for 2026</a></li>
                    <li><a href="/facts">PM Mastery fact sheet</a></li>
                </ul>
            </div>
        </div>
    </section>

%%FOOTER%%

    <script type="application/json" id="pt-key">%%KEY%%</script>
    <script>
    (function () {
        var KEY = JSON.parse(document.getElementById('pt-key').textContent);
        var TOTAL = KEY.length;
        var LABEL = { people: 'People', process: 'Process', business_environment: 'Business Environment' };
        var ORDER = ['business_environment', 'process', 'people'];
        var form = document.getElementById('pt-form');
        var resultsEl = document.getElementById('pt-results');
        var countEl = document.getElementById('pt-count');
        var blankEl = document.getElementById('pt-blank');
        var blankText = document.getElementById('pt-blank-text');
        var submitBtn = document.getElementById('pt-submit');
        var confirmBtn = document.getElementById('pt-confirm');
        var started = false;
        var graded = false;

        function track(name, params) {
            try { if (typeof gtag === 'function') gtag('event', name, params); } catch (e) {}
            try { if (window.posthog && typeof window.posthog.capture === 'function') window.posthog.capture(name, params); } catch (e) {}
        }
        function picked(n) {
            var r = form.querySelector('input[name="q' + n + '"]:checked');
            return r ? r.value : null;
        }
        function answered() {
            var c = 0;
            for (var i = 1; i <= TOTAL; i++) if (picked(i)) c++;
            return c;
        }
        function updateCount() { countEl.textContent = answered() + ' of ' + TOTAL + ' answered'; }
        function el(tag, cls, text) {
            var e = document.createElement(tag);
            if (cls) e.className = cls;
            if (text !== undefined) e.textContent = text;
            return e;
        }

        form.addEventListener('change', function (e) {
            if (graded) return;
            if (!started && e.target && e.target.type === 'radio') {
                started = true;
                track('practice_test_start', { location: 'practice_test' });
            }
            updateCount();
            blankEl.hidden = true;
        });

        submitBtn.addEventListener('click', function () {
            if (graded) return;
            var blank = TOTAL - answered();
            if (blank > 0) {
                blankText.textContent = 'You left ' + blank + ' blank; they count as wrong. Submit anyway?';
                blankEl.hidden = false;
                return;
            }
            grade();
        });
        confirmBtn.addEventListener('click', function () { if (!graded) grade(); });

        function grade() {
            graded = true;
            blankEl.hidden = true;
            var tally = { people: [0, 0], process: [0, 0], business_environment: [0, 0] };
            var total = 0, caseRight = 0;
            KEY.forEach(function (k) {
                var n = k.number, chosen = picked(n), ok = chosen === k.correct;
                var fs = document.getElementById('pt-q' + n);
                tally[k.domain][1]++;
                if (ok) { tally[k.domain][0]++; total++; if (n > 20) caseRight++; }
                fs.classList.add('pt-done', ok ? 'pt-right' : 'pt-wrong');
                var mark = el('span', 'pt-mark');
                mark.setAttribute('aria-label', ok ? 'Correct' : 'Incorrect');
                mark.innerHTML = ok ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-xmark"></i>';
                fs.querySelector('legend').appendChild(mark);
                var keyOpt = document.getElementById('q' + n + '-' + k.correct);
                if (keyOpt) keyOpt.closest('.pt-opt').classList.add('pt-key');
                var box = el('div', 'pt-expl');
                var head = el('p', 'pt-ans', chosen ? (ok ? 'Correct. The answer is ' + k.correct + '.' : 'Incorrect. You chose ' + chosen + '. The answer is ' + k.correct + '.') : 'Not answered. The answer is ' + k.correct + '.');
                box.appendChild(head);
                k.explanation.split('\n\n').forEach(function (para) { box.appendChild(el('p', '', para)); });
                fs.appendChild(box);
                Array.prototype.forEach.call(fs.querySelectorAll('input'), function (i) { i.disabled = true; });
            });

            var pct = Math.round(total * 100 / TOTAL);
            var weak = null, weakPct = 101;
            ORDER.forEach(function (d) {
                var p = tally[d][0] * 100 / tally[d][1];
                if (p < weakPct) { weakPct = p; weak = d; }
            });
            if (weakPct === 100) weak = null;

            resultsEl.textContent = '';
            resultsEl.appendChild(el('h2', '', 'Your results'));
            resultsEl.appendChild(el('p', 'pt-score', total + '/' + TOTAL + ' (' + pct + '%)'));
            ['people', 'process', 'business_environment'].forEach(function (d) {
                var row = el('div', 'pt-bar');
                var h = el('div', 'pt-bar-head');
                h.appendChild(el('span', '', LABEL[d]));
                h.appendChild(el('span', '', tally[d][0] + '/' + tally[d][1]));
                var track_ = el('div', 'pt-bar-track');
                var fill = el('div', 'pt-bar-fill');
                fill.style.width = Math.round(tally[d][0] * 100 / tally[d][1]) + '%';
                track_.appendChild(fill);
                row.appendChild(h);
                row.appendChild(track_);
                resultsEl.appendChild(row);
            });
            resultsEl.appendChild(el('p', '', 'Case study: ' + caseRight + '/5'));
            resultsEl.appendChild(el('p', 'pt-weak', weak ? 'Your weakest domain: ' + LABEL[weak] + '.' : 'No weak domain on this set.'));
            resultsEl.appendChild(el('p', 'pt-honest', '25 questions is a snapshot, not a pass prediction. Use it to see where to focus.'));

            var cta = el('div', 'pt-cta');
            cta.appendChild(el('h3', '', 'Practice your weakest domain'));
            cta.appendChild(el('p', '', 'Create a free account to keep practicing: 100 free questions, up to 10 a day, with the AI coach explaining every answer.'));
            var links = el('div', 'pt-links');
            var btn = el('a', 'pt-btn pt-btn-gold', 'Create a free account');
            btn.href = 'https://app.pmmastery.app/auth/register?utm_source=pmmastery&utm_medium=practice_test&utm_campaign=free_practice_test&utm_content=' + (weak || 'none');
            btn.addEventListener('click', function () {
                track('signup_click', { event_category: 'conversion', event_label: 'create a free account', link_url: btn.href, location: 'practice_test' });
            });
            var plans = el('a', 'pt-plain', 'See plans');
            plans.href = '/#pricing';
            links.appendChild(btn);
            links.appendChild(plans);
            cta.appendChild(links);
            resultsEl.appendChild(cta);

            var retake = el('button', 'pt-btn pt-btn-ghost', 'Retake');
            retake.type = 'button';
            retake.addEventListener('click', reset);
            resultsEl.appendChild(retake);

            resultsEl.hidden = false;
            submitBtn.disabled = true;
            track('practice_test_complete', { score_pct: pct, weakest_domain: weak || 'none', location: 'practice_test' });
            resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            resultsEl.focus({ preventScroll: true });
        }

        function reset() {
            graded = false;
            Array.prototype.forEach.call(form.querySelectorAll('input[type="radio"]'), function (i) { i.checked = false; i.disabled = false; });
            Array.prototype.forEach.call(form.querySelectorAll('.pt-q'), function (fs) {
                fs.classList.remove('pt-done', 'pt-right', 'pt-wrong');
                var m = fs.querySelector('.pt-mark'); if (m) m.remove();
                var x = fs.querySelector('.pt-expl'); if (x) x.remove();
            });
            Array.prototype.forEach.call(form.querySelectorAll('.pt-key'), function (o) { o.classList.remove('pt-key'); });
            resultsEl.hidden = true;
            resultsEl.textContent = '';
            blankEl.hidden = true;
            submitBtn.disabled = false;
            updateCount();
            document.getElementById('pt-part1').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        updateCount();
    })();
    </script>

    <!-- Custom JavaScript -->
    <script src="js/main.js?v=20261007"></script>
</body>
</html>
"""


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = p.add_subparsers(dest="cmd", required=True)
    pk = sub.add_parser("pick", help="Phase A: pick questions, write the review file")
    pk.add_argument("--review", default=REVIEW_DEFAULT)
    pk.set_defaults(fn=cmd_pick)
    bd = sub.add_parser("build", help="Phase B: write the data file and the page")
    bd.set_defaults(fn=cmd_build)
    args = p.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
