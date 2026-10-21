#!/usr/bin/env python3
"""Suite integrity and validation checker for legalsuite (stdlib only).

Verifies:
1. Skills: frontmatter follows the Agent Skills spec (name = folder, description
   <= 1024 chars), metadata (version/last_validated/category) present, the H1/H2
   sections present, no proprietary notice, every named path and script exists.
2. Capabilities: each defined once (signature uniqueness), every door/mode
   declares valid `imports:`, and the §1.4 mode contract (Object of work; Checks
   before Fan-out) holds.
3. Neutralization (§6): no jurisdiction content in the method.
4. Commands: description, $ARGUMENTS, existing skills.
5. state-schema.json valid and its mode enum matches the stance header.
6. Data packs match their templates and are fresh.
7. Every script's --demo passes (both runtimes when present), plus a
   substance.py inline check.
8. Every playbook passes load_playbook.py --check.
9. The mechanical evals pass (evals/run.py --mechanical).

Run:
    python3 scripts/verify_suite.py
"""
import json
import re
import subprocess
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / "skills"
ENGINE = SKILLS / "legal"
NAME_RE = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
# The Agent Skills spec's progressive-disclosure guidance suggests a <500-line
# body, but that figure is a token-budget heuristic, not a technical limit: a
# long-context model handles a few thousand lines fine. The binding cost is
# attention dilution, controlled by rule density, not by line count -- so we
# keep a generous runaway backstop instead of the spec's number.
BODY_MAX = 3000
PATH_RE = re.compile(r"`((?:\.\./legal/)?(?:references|scripts|jurisdictions|regimes)/[\w./-]+\.\w+)")
SCRIPT_RE = re.compile(r"\b([a-z_]+\.(?:py|js))\b")
SKILL_REF_RE = re.compile(r"`(legal(?:-[a-z]+)?)`")
FORBIDDEN = ("Proprietary notice", ".config/opencode", "copy-protected")

# §6 neutralization: the method names the *pattern*, never the law. These
# fingerprints must not appear in a capability or the engine -- they belong in
# packs/playbooks. (Terminology-parity aliases like *promlčení* are allowed.)
CONTENT_FINGERPRINTS = [
    (r"zákon\s+(?:č\.|o\s)", "a named statute"),
    (r"\bSb\.", "a national gazette citation"),
    (r"\(\s*EU\s*\)\s*\d{4}/\d+", "an EU act number"),
    (r"\b(?:nařízení|směrnice)\s+(?:EU|Evropsk)", "a named EU instrument"),
    (r"\b\d{1,3}\s+(?:Cdo|Odo|Cmo|Co|ÚS|As|Ads)\s+\d+/\d{4}\b", "a case number"),
    (r"\b(?:ÚOOÚ|ČNB|ÚOHS|SÚKL|ERO)\b", "a regulator acronym"),
    (r"(?:občanský|pracovní|trestní|obchodní)\s+zákoník", "a named code"),
    # Named instruments, jurisdictions and practice labels belong in a pack or a
    # playbook. The method names the pattern, never the label.
    (r"\b(?:GDPR|AI Act|DORA|NIS2|MDR|eIDAS|PSD2|MiFID|Omnibus|SEPA|Rome I{1,2}|Brussels (?:I|II|Ia|Ib|IIa))\b",
     "a named instrument"),
    (r"\b(?:Czech|Czechia|Slovak|German|Austrian|French|Polish|Dutch|Spanish|Italian)\b",
     "a named jurisdiction"),
    (r"\b(?:civil law|common law)\b", "a legal-family label"),
    (r"\b(?:NDA|SOW|SPA|APA|DPA|SHA|MSA|SaaS|PaaS|IaaS|M&A|W&I)\b", "a practice label"),
    (r"\b(?:promlčení|prekluze|kogentní|smluvní pokuta|eSbírka|katastr|Registr smluv|ústavní stížnost)\b",
     "a local-law term"),
]

# Capability-layer integrity (plan §1.4): each reusable method is defined once.
# A signature string must appear ONLY in its owning capability file; a copy in a
# door or mode is the duplication the restructure exists to prevent.
CAPABILITY_SIGNATURES = [
    ("[Matter: <slug>]", "references/ir-and-provenance.md"),
    ("| `[CRITICAL]` | voids or defeats the document's purpose", "references/capabilities/vocabulary.md"),
    ("| substance-preservation | on for every revision |", "references/capabilities/verify.md"),
    ("| `[DOC]` | Verbatim from a source document |", "references/capabilities/provenance.md"),
    ("- `GREEN`: within the preferred position.", "references/capabilities/positions.md"),
]
CAPABILITIES = {"frame", "orchestrate", "gate", "ground", "currency-watch", "provenance",
                "register", "challenge", "verify", "present", "guard", "economy", "positions",
                "configure", "vocabulary", "context"}
MODE_GLOBS = ("*/SKILL.md", "*/references/modes/*.md", "*/references/modes/*/*.md")


FM_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
# The Agent Skills spec's closed field set (agentskills.io). Anything else in a
# skill's frontmatter makes the reference validator reject the skill.
SKILL_FIELDS = {"name", "description", "license", "allowed-tools", "metadata", "compatibility"}
# The suite's own keys, carried inside the `metadata:` block.
META_FIELDS = {"imports", "delta", "version", "last_validated", "category"}
MAX_COMPATIBILITY_LENGTH = 500
# Strict YAML forbids flow collections (`[a, b]`, `{a: b}`) and anchor/alias/tag
# tokens: the spec's parser rejects them outright, so no frontmatter may use
# that style. The value must *start* with the token, so a quoted description
# that merely contains a bracket is fine.
FLOW_RE = re.compile(r"^\s*[\w.-]+:\s*[\[{]", re.M)
TAG_RE = re.compile(r"^\s*[\w.-]+:\s*[&*!]", re.M)
# Strict YAML: a key is `name:` followed by a space or the end of the line.
KEY_RE = re.compile(r"^([A-Za-z0-9_.\-]+):(?: (.*))?$")


def _yaml_scalar(path: Path, key: str, val: str) -> str:
    """A scalar as strict YAML reads it; raises on the shapes strict YAML rejects.

    The reference validator (`skills-ref`) parses with strictyaml, so a value the
    repo gate accepts but strict YAML rejects is a skill that is broken for
    every host and only fails in CI.
    """
    if val[:1] in ('"', "'"):
        quote = val[0]
        assert len(val) >= 2 and val.endswith(quote) and quote not in val[1:-1], \
            f"{path}: {key}: malformed quoted scalar"
        return val[1:-1]
    assert not val.startswith("- "), f"{path}: {key}: value starts a YAML sequence"
    assert ": " not in val, f"{path}: {key}: value contains ': ' (mapping values are not allowed here)"
    assert not val.endswith(":"), f"{path}: {key}: value ends with ':' (mapping values are not allowed here)"
    return val


def frontmatter(path: Path, strict: bool = False) -> tuple[dict, str]:
    """Frontmatter as a dict. A nested block (e.g. `metadata:`) becomes a dict
    under its own key; every other key is a flat string.

    The parser is strict: a tab, a duplicate key, an indented line outside a
    block or a malformed line fails here rather than sliding through.
    `strict=True` adds the strict-YAML scalar rules (the ones the Agent Skills
    spec's parser applies). It is used for skill frontmatter — the format the
    spec governs. The suite's own data packs keep the lenient line format.
    """
    text = path.read_text(encoding="utf-8")
    m = FM_RE.match(text)
    assert m, f"Missing frontmatter in {path}"
    block = m.group(1)
    assert "\t" not in block, f"{path}: tab in frontmatter (strict YAML forbids it)"
    meta: dict = {}
    parent = None
    parent_key = ""
    seen_top: list[str] = []
    seen_nested: list[str] = []
    for line in block.splitlines():
        if not line.strip():
            continue
        indented = line[:1] in " \t"
        raw = line.strip() if indented else line
        if strict:
            km = KEY_RE.match(raw)
            assert km, f"{path}: malformed frontmatter line: {raw!r}"
            key, val = km.group(1), km.group(2)
        else:
            k, sep, v = raw.partition(":")
            assert sep, f"{path}: malformed frontmatter line: {raw!r}"
            key, val = k.strip(), v.strip()
        if indented:
            assert parent is not None, f"{path}: indented line outside a block: {raw!r}"
            assert key not in seen_nested, f"{path}: duplicate key {key!r} in {parent_key}"
            seen_nested.append(key)
            parent[key] = _yaml_scalar(path, key, val) if strict else val.strip('"')
            continue
        assert key not in seen_top, f"{path}: duplicate frontmatter key {key!r}"
        seen_top.append(key)
        if strict:
            if val is None:                                # a parent block, e.g. `metadata:`
                parent_key = key
                meta[key] = {}
                parent = meta[key]
                seen_nested = []
            else:
                parent = None
                meta[key] = _yaml_scalar(path, key, val)
        else:
            if val == "":                                  # a parent block, e.g. `metadata:`
                parent_key = key
                meta[key] = {}
                parent = meta[key]
                seen_nested = []
            else:
                parent = None
                meta[key] = val.strip('"')
    return meta, text[m.end():]


def mval(meta: dict, dotted: str) -> str:
    """A frontmatter value addressed as `parent.key` for a nested block."""
    if "." in dotted:
        parent, key = dotted.split(".", 1)
        block = meta.get(parent)
        return block.get(key, "") if isinstance(block, dict) else ""
    val = meta.get(dotted)
    return val if isinstance(val, str) else ""


def check_frontmatter_shape(path: Path, meta: dict, block: str, *,
                            need_description: bool, need_license: bool) -> None:
    """The Agent Skills spec, enforced on the repo's own frontmatter.

    The reference validator (`agentskills validate`, package `skills-ref`) is
    the oracle; these are the same rules inlined so the gate holds without a
    third-party dependency.
    """
    name = meta.get("name", "") or path.stem
    top = set(meta)
    extra = top - SKILL_FIELDS
    assert not extra, f"{name}: fields not allowed by the Agent Skills spec: {sorted(extra)}"
    assert not FLOW_RE.search(block), f"{name}: frontmatter uses a flow collection (strict YAML forbids it)"
    assert not TAG_RE.search(block), f"{name}: frontmatter uses an anchor/alias/tag (strict YAML forbids it)"
    meta_block = meta.get("metadata")
    if isinstance(meta_block, dict):
        bad = set(meta_block) - META_FIELDS
        assert not bad, f"{name}: unknown metadata keys: {sorted(bad)}"
    if need_description:
        assert meta.get("description"), f"{name}: no description"
        assert len(meta.get("description", "")) <= 1024, f"{name}: description over 1024 chars"
    if need_license:
        assert meta.get("license"), f"{name}: no license"
    if "compatibility" in meta:
        assert len(meta.get("compatibility", "")) <= MAX_COMPATIBILITY_LENGTH, \
            f"{name}: compatibility over {MAX_COMPATIBILITY_LENGTH} chars"


def section_body(body: str, heading: str) -> str:
    """Text under one H2, up to the next H2 or the end."""
    m = re.search(rf"^{re.escape(heading)}.*$", body, re.M)
    if not m:
        return ""
    rest = body[m.end():]
    nxt = re.search(r"^## ", rest, re.M)
    return rest[:nxt.start()] if nxt else rest


def check_skills() -> set[str]:
    names = set()
    scripts = {p.name for p in (ENGINE / "scripts").glob("*.py")}
    scripts |= {p.name for p in (ENGINE / "scripts").glob("*.js")}
    for d in sorted(p for p in SKILLS.iterdir() if p.is_dir()):
        path = d / "SKILL.md"
        meta, body = frontmatter(path, strict=True)
        name = meta.get("name", "")
        assert name == d.name, f"name {name!r} != folder {d.name!r}"
        assert NAME_RE.match(name) and len(name) <= 64, f"bad name {name!r}"
        # Spec conformance: closed field set, a licence, strict-YAML-safe
        # (no flow collections, no anchors) frontmatter.
        raw = FM_RE.match(path.read_text(encoding="utf-8")).group(1)
        check_frontmatter_shape(path, meta, raw, need_description=True, need_license=True)
        for k in ("version", "last_validated", "category"):
            assert mval(meta, f"metadata.{k}"), f"{name}: metadata missing {k}"
        for sec in ("## What this mode does not do", "## Counter-example"):
            assert sec in body, f"{name}: missing {sec!r} section"
            assert section_body(body, sec).strip(), f"{name}: {sec!r} section is a heading with no content"
        assert len(body.splitlines()) < BODY_MAX, f"{name}: body over {BODY_MAX} lines"
        for bad in FORBIDDEN:
            assert bad not in body, f"{name}: contains {bad!r}"
        if name != "legal":
            assert "../legal/SKILL.md" in body, f"{name}: doesn't point to the engine"
        for ref in PATH_RE.findall(body):
            assert (d / ref).exists(), f"{name}: missing {ref}"
        for s in set(SCRIPT_RE.findall(body)):
            assert s in scripts, f"{name}: names unknown script {s}"
        names.add(name)
    engine_body = (ENGINE / "SKILL.md").read_text(encoding="utf-8")
    for n in names - {"legal"}:
        assert f"`{n}`" in engine_body, f"engine mode table omits {n}"
    for ref in ENGINE.glob("references/*.md"):
        for s in set(SCRIPT_RE.findall(ref.read_text(encoding="utf-8"))):
            assert s in scripts, f"{ref.name}: names unknown script {s}"
    print(f"✓ Skills ({len(names)}): {', '.join(sorted(names))}")
    return names


def check_capabilities() -> None:
    capdir = ENGINE / "references" / "capabilities"
    have = {p.stem for p in capdir.glob("*.md")}
    assert CAPABILITIES <= have, f"missing capability files: {sorted(CAPABILITIES - have)}"
    for sig, owner in CAPABILITY_SIGNATURES:
        hits = sorted(p.relative_to(ROOT).as_posix() for p in SKILLS.rglob("*.md")
                      if sig in p.read_text(encoding="utf-8"))
        assert hits == ["skills/legal/" + owner], \
            f"capability text {sig!r} must live only in skills/legal/{owner}; found {hits}"
    modes = sorted({m for pat in MODE_GLOBS for m in SKILLS.glob(pat)})
    for m in modes:
        meta, body = frontmatter(m, strict=True)
        raw = FM_RE.match(m.read_text(encoding="utf-8")).group(1)
        check_frontmatter_shape(m, meta, raw, need_description=False, need_license=False)
        for k in ("version", "last_validated", "category"):
            assert mval(meta, f"metadata.{k}"), f"{m.relative_to(SKILLS)}: metadata missing {k}"
        for sec in ("## What this mode does not do", "## Counter-example"):
            assert sec in body, f"{m.relative_to(SKILLS)}: missing {sec!r} section"
        if m.name != "legal/SKILL.md" and m != ENGINE / "SKILL.md":   # §1.4 contract for all doors & modes
            assert "**Object of work.**" in body, f"{m.relative_to(SKILLS)}: missing Object of work (§1.4)"
            if "## Fan-out" in body and "## Checks" in body:
                assert body.index("## Checks") < body.index("## Fan-out"), \
                    f"{m.relative_to(SKILLS)}: ## Checks must precede ## Fan-out (§1.4)"
        imp = mval(meta, "metadata.imports")
        used = {s.strip() for s in imp.split(",") if s.strip()}
        assert used, f"{m.relative_to(SKILLS)}: mode front-matter declares no imports:"
        unknown = used - have
        assert not unknown, f"{m.relative_to(SKILLS)}: imports unknown capabilities {sorted(unknown)}"
    print(f"✓ Capabilities ({len(have)}) defined once; {len(modes)} doors/modes declare imports")


def check_neutral() -> None:
    # The method = capabilities + engine + every door/mode. The engine's
    # reference files (citation-ledger, fact-map, …) are excluded: they carry
    # *format* examples (a synthetic docket, "Sb." syntax), which are
    # illustrations of notation, not the method naming the law.
    method = sorted((ENGINE / "references" / "capabilities").glob("*.md")) + [ENGINE / "SKILL.md"]
    method += sorted({m for pat in MODE_GLOBS for m in SKILLS.glob(pat)})
    hits = []
    for f in method:
        text = f.read_text(encoding="utf-8")
        for pat, what in CONTENT_FINGERPRINTS:
            for m in re.finditer(pat, text, re.I):
                hits.append(f"{f.relative_to(SKILLS)}: {what} {m.group()!r}")
    assert not hits, "jurisdiction content leaked into the method (§6):\n  " + "\n  ".join(hits)
    print(f"✓ Neutralization: {len(method)} method files free of jurisdiction content")


def check_commands(names: set[str]) -> None:
    files = sorted((ROOT / "commands").glob("*.md"))
    # Non-skill entry tokens the router may name: alias -> owning door skill.
    aliases = {"legal-ground": "legal-research", "legal-drafting": "legal-review"}
    for f in files:
        meta, body = frontmatter(f)
        assert meta.get("description"), f"command {f.name}: no description"
        assert "$ARGUMENTS" in body, f"command {f.name}: no $ARGUMENTS"
        for ref in SKILL_REF_RE.findall(body):
            assert ref in names or ref in aliases, \
                f"command {f.name} names missing skill {ref!r}"
    print(f"✓ Commands ({len(files)}) route to existing skills")
    # Single-command surface: the canonical router must reach every door, so a
    # trimmed description or body can never silently hide a mode.
    router = (ROOT / "commands" / "legal.md").read_text(encoding="utf-8")
    for door in sorted(names - {"legal"}):
        assert f"`{door}`" in router, f"router commands/legal.md omits door {door!r}"
    print(f"✓ Router commands/legal.md reaches all {len(names) - 1} doors")


def check_schema() -> None:
    data = json.loads((ENGINE / "references" / "state-schema.json").read_text(encoding="utf-8"))
    modes = set(data["properties"]["stance"]["properties"]["mode"]["enum"])
    header = re.search(r"^MODE\s*=\s*<(.*)>", (ENGINE / "SKILL.md").read_text(encoding="utf-8"), re.M)
    assert header, "engine stance header has no MODE line"
    stance_modes = {m.strip() for m in header.group(1).split("|")}
    assert stance_modes == modes, f"schema modes {sorted(modes ^ stance_modes)} differ from stance header"
    print("✓ state-schema.json valid; modes match the stance header")


def check_packs() -> None:
    n = 0
    for kind in ("jurisdictions", "regimes"):
        folder = ENGINE / kind
        tmpl = folder / "_template.md"
        assert tmpl.is_file(), f"missing {tmpl}"
        heads = [h for h in re.findall(r"^## (.+)$", tmpl.read_text(encoding="utf-8"), re.M)]
        for pack in sorted(folder.glob("[!_]*.md")):
            meta, body = frontmatter(pack)
            for k in ("code", "reviewed_at", "review_by", "status"):
                assert meta.get(k), f"{pack.name}: missing {k}"
            # A status is a claim: `current` may not coexist with an item the
            # pack itself marks unverified. `partially verified` is the honest
            # state for a pack that carries ⚠ items.
            status = meta["status"].strip().lower()
            assert status in {"current", "partially verified", "draft", "retired"}, \
                f"{pack.name}: unknown status {meta['status']!r}"
            if status == "current":
                flagged = [ln.strip() for ln in body.splitlines() if "⚠" in ln]
                assert not flagged, (f"{pack.name}: status 'current' but {len(flagged)} unverified "
                                     f"item(s) — use 'partially verified':\n    " + "\n    ".join(flagged[:3]))
            reviewed = date.fromisoformat(meta["reviewed_at"][:10])
            assert reviewed <= date.today(), f"{pack.name}: reviewed_at is in the future"
            got = re.findall(r"^## (.+)$", body, re.M)
            assert [h.split("(")[0].strip() for h in got] == [h.split("(")[0].strip() for h in heads], \
                f"{pack.name}: headings differ from {kind}/_template.md"
            assert date.fromisoformat(meta["review_by"][:10]) >= date.today(), f"{pack.name}: stale (review_by passed)"
            n += 1
    print(f"✓ Data packs ({n}) match their templates and are fresh")


def run(args: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run([sys.executable, *args], capture_output=True, text=True, cwd=ROOT)


def check_scripts() -> None:
    scripts = sorted((ENGINE / "scripts").glob("*.py"))
    for s in scripts:
        res = run([str(s), "--demo"])
        assert res.returncode == 0 and "demo ok" in res.stdout, f"{s.name} --demo failed: {res.stderr[-400:]}"
    res = run([str(ENGINE / "scripts" / "substance.py"), "--text-orig", "Nájem 100 Kč",
               "--text-rev", "Nájem 120 Kč", "--json"])
    assert json.loads(res.stdout)["dropped"] == [{"category": "money", "value": "100 Kč", "count": 1}]
    print(f"✓ Scripts ({len(scripts)}) pass their demos")
    # JS flavor (when ported): every *.js beside a *.py must pass --demo too.
    import shutil as _shutil
    if _shutil.which("node"):
        js = sorted((ENGINE / "scripts").glob("*.js"))
        for s in js:
            r = subprocess.run(["node", str(s), "--demo"], capture_output=True, text=True, cwd=ROOT)
            assert r.returncode == 0 and "demo ok" in r.stdout, f"{s.name} --demo failed: {r.stderr[-400:]}"
        if js:
            print(f"✓ Scripts-js ({len(js)}) pass their demos")


def check_playbooks() -> None:
    books = [p for p in sorted((ROOT / "playbooks").glob("*.md"))
             if not p.name.startswith("_") and p.stem.lower() != "readme"]
    for p in books:
        res = run([str(ENGINE / "scripts" / "load_playbook.py"), "--check", str(p), "--json"])
        assert json.loads(res.stdout)["ok"], f"playbook {p.name} fails --check: {res.stdout[-400:]}"
    print(f"✓ Playbooks ({len(books)}) pass --check")


def check_evals() -> None:
    """Evals, corpus and runtime parity are gates. A skip is reported, never counted as a pass."""
    res = run([str(ROOT / "evals" / "run.py"), "--mechanical"])
    assert res.returncode == 0, f"mechanical evals failed:\n{res.stdout}"
    m = re.search(r"mechanical (\d+)/(\d+)", res.stdout)
    assert m and m.group(1) == m.group(2), f"mechanical evals under-count:\n{res.stdout}"
    print(f"✓ Mechanical evals pass ({m.group(1)}/{m.group(2)}; manifest inventory ok)")
    for script, label in (("corpus.py", "Corpus (matter folders)"), ("parity_js.py", "Python/Node parity")):
        if not (ROOT / "evals" / script).is_file():
            continue
        r = run([str(ROOT / "evals" / script)])
        assert r.returncode in (0, 77), f"{label} failed:\n{r.stdout[-600:]}"
        tail = (r.stdout.strip().splitlines() or ["?"])[-1]
        print(f"{'✓' if r.returncode == 0 else '…'} {label}: {tail}")


def check_spec_reference() -> None:
    """The Agent Skills spec, checked by the reference validator.

    `skills-ref` (package `skills-ref`, console script `agentskills`) is the
    oracle: the inline shape check is the approximation that runs everywhere,
    this is the authority. When the library is installed the gate is exactly as
    strict as the spec; when it is not, the check is reported as skipped and is
    never counted as a pass.

    The differential battery below is what keeps the approximation honest: for
    every shape strict YAML refuses, the inline check must refuse it too. A
    divergence in that direction is a skill that is broken for every host and
    only fails in CI.
    """
    try:
        from skills_ref.validator import validate as ref_validate
    except ImportError:
        print("… Spec (reference validator): skipped — skills-ref not installed")
        return
    dirs = sorted(p for p in SKILLS.iterdir() if p.is_dir())
    rejected = {p.name: ref_validate(p) for p in dirs}
    rejected = {k: v for k, v in rejected.items() if v}
    assert not rejected, f"reference validator rejected: {rejected}"
    print(f"✓ Spec: {len(dirs)} skills valid (reference validator)")

    # Differential: the inline check must never accept what the oracle rejects.
    base = ("name: parity-probe\n"
            "description: \"A probe skill for the differential test.\"\n"
            "license: Apache-2.0\n"
            "metadata:\n"
            "  imports: frame\n"
            "  delta: probe\n"
            "  version: 1.0\n"
            "  last_validated: 2026-10-21\n"
            "  category: mode\n")
    cases = {
        "unquoted value with ': '": base.replace('description: "A probe skill for the differential test."',
                                                  "description: A probe: skill"),
        "value starting with '- '": base.replace('description: "A probe skill for the differential test."',
                                                  "description: - A probe skill"),
        "value ending with ':'": base.replace('description: "A probe skill for the differential test."',
                                               "description: A probe skill:"),
        "key without a space": base.replace('description: "A probe skill for the differential test."',
                                             "description:A probe skill"),
        "tab-indented line": base.replace("  imports: frame", "\timports: frame"),
        "duplicate key": base.replace("license: Apache-2.0", "license: Apache-2.0\nlicense: MIT"),
        "flow collection": base.replace("  imports: frame", "  imports: [frame, gate]"),
        "anchor token": base.replace("  delta: probe", "  delta: &x probe"),
        "dotted top-level key": base.replace("metadata:", "metadata.imports: frame\nmetadata:"),
        "unquoted value with '# '": base.replace('description: "A probe skill for the differential test."',
                                                  "description: A probe skill # comment"),
    }
    import tempfile
    dangerous = []
    for label, text in cases.items():
        with tempfile.TemporaryDirectory() as tmp:
            d = Path(tmp) / "parity-probe"
            d.mkdir()
            (d / "SKILL.md").write_text(f"---\n{text}---\n\n# parity probe\n", encoding="utf-8")
            oracle = bool(ref_validate(d))
            try:
                meta, _ = frontmatter(d / "SKILL.md", strict=True)
                block = FM_RE.match((d / "SKILL.md").read_text(encoding="utf-8")).group(1)
                check_frontmatter_shape(d / "SKILL.md", meta, block,
                                        need_description=True, need_license=True)
                inline = False
            except AssertionError:
                inline = True
            if oracle and not inline:
                dangerous.append(label)
    assert not dangerous, (f"inline check accepts what the reference validator rejects: {dangerous}")
    print(f"✓ Spec parity: {len(cases)} strict-YAML shapes refused by both")


def main() -> int:
    print("Running legalsuite integrity verification...")
    names = check_skills()
    check_capabilities()
    check_spec_reference()
    check_neutral()
    check_commands(names)
    check_schema()
    check_packs()
    check_scripts()
    check_playbooks()
    check_evals()
    print("All legalsuite integrity checks PASSED.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
